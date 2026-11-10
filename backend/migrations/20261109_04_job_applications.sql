CREATE OR REPLACE FUNCTION public.radar_valid_job_questions(value jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $function$
DECLARE
    question jsonb;
    question_id text;
    seen_ids text[] := ARRAY[]::text[];
BEGIN
    IF jsonb_typeof(value) <> 'array' THEN
        RETURN false;
    END IF;
    IF jsonb_array_length(value) > 30 THEN
        RETURN false;
    END IF;
    FOR question IN SELECT item FROM jsonb_array_elements(value) AS items(item)
    LOOP
        IF NOT coalesce(
            jsonb_typeof(question) = 'object'
            AND jsonb_typeof(question -> 'id') = 'string'
            AND coalesce(question ->> 'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND jsonb_typeof(question -> 'label') = 'string'
            AND length(btrim(question ->> 'label')) BETWEEN 1 AND 200
            AND jsonb_typeof(question -> 'type') = 'string'
            AND question ->> 'type' IN ('short_text', 'long_text', 'url', 'yes_no')
            AND jsonb_typeof(question -> 'required') = 'boolean',
            false
        ) THEN
            RETURN false;
        END IF;
        question_id := question ->> 'id';
        IF question_id = ANY(seen_ids) THEN
            RETURN false;
        END IF;
        seen_ids := array_append(seen_ids, question_id);
    END LOOP;
    RETURN true;
END;
$function$;

CREATE TABLE IF NOT EXISTS public.job_opening (
    opening_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id uuid NOT NULL REFERENCES public.founder(user_id) ON DELETE CASCADE,
    company_name text NOT NULL CHECK (length(btrim(company_name)) BETWEEN 1 AND 200),
    title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
    description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 10000),
    questions jsonb NOT NULL DEFAULT '[]'::jsonb
        CHECK (public.radar_valid_job_questions(questions)),
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_opening_status_created_at_idx
    ON public.job_opening (status, created_at DESC);
CREATE INDEX IF NOT EXISTS job_opening_founder_id_idx
    ON public.job_opening (founder_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.job_application (
    application_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    opening_id uuid NOT NULL REFERENCES public.job_opening(opening_id) ON DELETE CASCADE,
    applicant_id uuid NOT NULL REFERENCES public.applicant(user_id) ON DELETE CASCADE,
    answers jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(answers) = 'object'),
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending', 'accepted', 'rejected')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    submitted_at timestamptz,
    decided_at timestamptz,
    UNIQUE (opening_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS job_application_applicant_id_updated_at_idx
    ON public.job_application (applicant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS job_application_opening_id_created_at_idx
    ON public.job_application (opening_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.radar_protect_job_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    actor uuid := auth.uid();
    opening public.job_opening%ROWTYPE;
    question jsonb;
    answer jsonb;
BEGIN
    IF NEW.application_id IS DISTINCT FROM OLD.application_id
        OR NEW.opening_id IS DISTINCT FROM OLD.opening_id
        OR NEW.applicant_id IS DISTINCT FROM OLD.applicant_id
        OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Application identity fields cannot be changed';
    END IF;

    NEW.updated_at := now();

    IF actor = OLD.applicant_id THEN
        IF OLD.status <> 'draft' OR NEW.status NOT IN ('draft', 'pending') THEN
            RAISE EXCEPTION 'Only draft applications can be changed by the applicant';
        END IF;
        IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
            AND NOT (NEW.status = 'pending' AND NEW.submitted_at IS NOT NULL AND OLD.submitted_at IS NULL) THEN
            RAISE EXCEPTION 'The submitted timestamp cannot be changed';
        END IF;
        IF NEW.decided_at IS DISTINCT FROM OLD.decided_at THEN
            RAISE EXCEPTION 'Applicants cannot change decision timestamps';
        END IF;
        IF NEW.status = 'draft' THEN
            NEW.submitted_at := NULL;
        ELSE
            SELECT * INTO opening FROM public.job_opening WHERE opening_id = OLD.opening_id;
            IF opening.status <> 'open' OR NEW.submitted_at IS NULL THEN
                RAISE EXCEPTION 'Applications can only be submitted to open jobs';
            END IF;
            FOR question IN SELECT value FROM jsonb_array_elements(opening.questions)
            LOOP
                answer := NEW.answers -> (question ->> 'id');
                IF answer IS NOT NULL AND answer <> 'null'::jsonb THEN
                    IF question ->> 'type' = 'yes_no' THEN
                        IF jsonb_typeof(answer) <> 'boolean' THEN
                            RAISE EXCEPTION 'Yes/no questions require a boolean answer';
                        END IF;
                    ELSIF jsonb_typeof(answer) <> 'string' THEN
                        RAISE EXCEPTION 'Text questions require a string answer';
                    ELSIF question ->> 'type' = 'short_text' AND length(answer #>> '{}') > 1000 THEN
                        RAISE EXCEPTION 'Short text answers are too long';
                    ELSIF question ->> 'type' = 'long_text' AND length(answer #>> '{}') > 10000 THEN
                        RAISE EXCEPTION 'Long text answers are too long';
                    ELSIF question ->> 'type' = 'url' AND length(answer #>> '{}') > 2000 THEN
                        RAISE EXCEPTION 'URL answer is too long';
                    ELSIF question ->> 'type' = 'url' AND answer #>> '{}' !~* '^https?://' THEN
                        RAISE EXCEPTION 'URL answers must use HTTP or HTTPS';
                    END IF;
                END IF;
                IF coalesce((question ->> 'required')::boolean, false) THEN
                    IF answer IS NULL OR answer = 'null'::jsonb THEN
                        RAISE EXCEPTION 'Required application questions must be answered';
                    END IF;
                    IF question ->> 'type' <> 'yes_no'
                        AND (jsonb_typeof(answer) <> 'string' OR length(btrim(answer #>> '{}')) = 0) THEN
                        RAISE EXCEPTION 'Required application questions must be answered';
                    END IF;
                END IF;
            END LOOP;
            IF EXISTS (
                SELECT 1 FROM jsonb_object_keys(NEW.answers) AS keys(answer_id)
                WHERE NOT EXISTS (
                    SELECT 1 FROM jsonb_array_elements(opening.questions) AS items(item)
                    WHERE item ->> 'id' = keys.answer_id
                )
            ) THEN
                RAISE EXCEPTION 'Answers contain fields that are not on this application';
            END IF;
        END IF;
        NEW.decided_at := NULL;
    ELSIF EXISTS (
        SELECT 1 FROM public.job_opening
        WHERE opening_id = OLD.opening_id AND founder_id = actor
    ) THEN
        IF OLD.status = 'draft'
            OR NEW.answers IS DISTINCT FROM OLD.answers
            OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
            OR NEW.status NOT IN ('pending', 'accepted', 'rejected') THEN
            RAISE EXCEPTION 'Founders can only decide submitted applications';
        END IF;
        IF NEW.status = 'pending' THEN
            NEW.decided_at := NULL;
        ELSE
            NEW.decided_at := coalesce(NEW.decided_at, now());
        END IF;
    ELSE
        RAISE EXCEPTION 'Not authorized to change this application';
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS radar_protect_job_application ON public.job_application;
CREATE TRIGGER radar_protect_job_application
    BEFORE UPDATE ON public.job_application
    FOR EACH ROW EXECUTE FUNCTION public.radar_protect_job_application();

ALTER TABLE public.job_opening ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Open jobs are publicly readable" ON public.job_opening;
DROP POLICY IF EXISTS "Job details are publicly readable" ON public.job_opening;
CREATE POLICY "Job details are publicly readable"
    ON public.job_opening FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Founders can create their own jobs" ON public.job_opening;
CREATE POLICY "Founders can create their own jobs"
    ON public.job_opening FOR INSERT TO authenticated
    WITH CHECK (
        founder_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1 FROM public."user"
            WHERE user_id = (SELECT auth.uid()) AND account_type = 'founder'
        )
    );

DROP POLICY IF EXISTS "Founders can update their own jobs" ON public.job_opening;
CREATE POLICY "Founders can update their own jobs"
    ON public.job_opening FOR UPDATE TO authenticated
    USING (founder_id = (SELECT auth.uid()))
    WITH CHECK (founder_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Applicants and hiring founders can read applications" ON public.job_application;
CREATE POLICY "Applicants and hiring founders can read applications"
    ON public.job_application FOR SELECT TO authenticated
    USING (
        applicant_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.job_opening
            WHERE opening_id = job_application.opening_id AND founder_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Applicants can start applications for open jobs" ON public.job_application;
CREATE POLICY "Applicants can start applications for open jobs"
    ON public.job_application FOR INSERT TO authenticated
    WITH CHECK (
        applicant_id = (SELECT auth.uid())
        AND status = 'draft'
        AND EXISTS (
            SELECT 1 FROM public."user"
            WHERE user_id = (SELECT auth.uid()) AND account_type = 'applicant'
        )
        AND EXISTS (
            SELECT 1 FROM public.job_opening
            WHERE opening_id = job_application.opening_id AND status = 'open'
        )
    );

DROP POLICY IF EXISTS "Applicants and hiring founders can update applications" ON public.job_application;
CREATE POLICY "Applicants and hiring founders can update applications"
    ON public.job_application FOR UPDATE TO authenticated
    USING (
        (
            applicant_id = (SELECT auth.uid()) AND status = 'draft'
            AND EXISTS (
                SELECT 1 FROM public.job_opening
                WHERE opening_id = job_application.opening_id AND status = 'open'
            )
        )
        OR (
            status <> 'draft'
            AND EXISTS (
                SELECT 1 FROM public.job_opening
                WHERE opening_id = job_application.opening_id AND founder_id = (SELECT auth.uid())
            )
        )
    )
    WITH CHECK (
        applicant_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.job_opening
            WHERE opening_id = job_application.opening_id AND founder_id = (SELECT auth.uid())
        )
    );

GRANT SELECT ON public.job_opening TO anon, authenticated;
GRANT INSERT (founder_id, company_name, title, description, questions, status)
    ON public.job_opening TO authenticated;
GRANT UPDATE (status) ON public.job_opening TO authenticated;
GRANT SELECT ON public.job_application TO authenticated;
GRANT INSERT (opening_id, applicant_id, answers) ON public.job_application TO authenticated;
GRANT UPDATE (answers, status, submitted_at, decided_at)
    ON public.job_application TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('application-documents', 'application-documents', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS "Applicants upload documents to draft applications" ON storage.objects;
CREATE POLICY "Applicants upload documents to draft applications"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'application-documents'
        AND EXISTS (
            SELECT 1 FROM public.job_application
            WHERE application_id::text = split_part(name, '/', 1)
                AND split_part(name, '/', 2) IN ('resume.pdf', 'transcript.pdf')
                AND split_part(name, '/', 3) = ''
                AND applicant_id = (SELECT auth.uid()) AND status = 'draft'
                AND EXISTS (
                    SELECT 1 FROM public.job_opening
                    WHERE opening_id = job_application.opening_id AND status = 'open'
                )
        )
    );

DROP POLICY IF EXISTS "Applicants and hiring founders read submitted documents" ON storage.objects;
CREATE POLICY "Applicants and hiring founders read submitted documents"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'application-documents'
        AND EXISTS (
            SELECT 1 FROM public.job_application
            WHERE application_id::text = split_part(name, '/', 1)
                AND split_part(name, '/', 2) IN ('resume.pdf', 'transcript.pdf')
                AND split_part(name, '/', 3) = ''
                AND (
                    applicant_id = (SELECT auth.uid())
                    OR (
                        status <> 'draft'
                        AND EXISTS (
                            SELECT 1 FROM public.job_opening
                            WHERE opening_id = job_application.opening_id AND founder_id = (SELECT auth.uid())
                        )
                    )
                )
        )
    );

DROP POLICY IF EXISTS "Applicants replace documents on draft applications" ON storage.objects;
CREATE POLICY "Applicants replace documents on draft applications"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'application-documents'
        AND EXISTS (
            SELECT 1 FROM public.job_application
            WHERE application_id::text = split_part(name, '/', 1)
                AND split_part(name, '/', 2) IN ('resume.pdf', 'transcript.pdf')
                AND split_part(name, '/', 3) = ''
                AND applicant_id = (SELECT auth.uid()) AND status = 'draft'
                AND EXISTS (
                    SELECT 1 FROM public.job_opening
                    WHERE opening_id = job_application.opening_id AND status = 'open'
                )
        )
    )
    WITH CHECK (
        bucket_id = 'application-documents'
        AND EXISTS (
            SELECT 1 FROM public.job_application
            WHERE application_id::text = split_part(name, '/', 1)
                AND split_part(name, '/', 2) IN ('resume.pdf', 'transcript.pdf')
                AND split_part(name, '/', 3) = ''
                AND applicant_id = (SELECT auth.uid()) AND status = 'draft'
                AND EXISTS (
                    SELECT 1 FROM public.job_opening
                    WHERE opening_id = job_application.opening_id AND status = 'open'
                )
        )
    );

DROP POLICY IF EXISTS "Applicants remove documents from draft applications" ON storage.objects;
CREATE POLICY "Applicants remove documents from draft applications"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'application-documents'
        AND EXISTS (
            SELECT 1 FROM public.job_application
            WHERE application_id::text = split_part(name, '/', 1)
                AND split_part(name, '/', 2) IN ('resume.pdf', 'transcript.pdf')
                AND split_part(name, '/', 3) = ''
                AND applicant_id = (SELECT auth.uid()) AND status = 'draft'
                AND EXISTS (
                    SELECT 1 FROM public.job_opening
                    WHERE opening_id = job_application.opening_id AND status = 'open'
                )
        )
    );
