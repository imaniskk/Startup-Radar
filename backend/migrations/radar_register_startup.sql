CREATE OR REPLACE FUNCTION public.radar_register_startup(
    p_name text,
    p_description text DEFAULT NULL,
    p_location text DEFAULT NULL,
    p_funding_round text DEFAULT NULL,
    p_website text DEFAULT NULL,
    p_industry_id uuid DEFAULT NULL
)
RETURNS public.startup
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    new_startup public.startup;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'You must be logged in to register a startup'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.founder f WHERE f.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only founders can register a startup'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF p_name IS NULL OR btrim(p_name) = '' THEN
        RAISE EXCEPTION 'Startup name is required'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    INSERT INTO public.startup (
        name,
        description,
        location,
        funding_round,
        website
    )
    VALUES (
        btrim(p_name),
        NULLIF(btrim(p_description), ''),
        NULLIF(btrim(p_location), ''),
        NULLIF(btrim(p_funding_round), ''),
        NULLIF(btrim(p_website), '')
    )
    RETURNING * INTO new_startup;

    INSERT INTO public.startup_founder (startup_id, founder_id)
    VALUES (new_startup.startup_id, auth.uid());

    IF p_industry_id IS NOT NULL THEN
        INSERT INTO public.startup_industry (startup_id, industry_id)
        VALUES (new_startup.startup_id, p_industry_id);
    END IF;

    RETURN new_startup;
END;
$$;

REVOKE ALL ON FUNCTION public.radar_register_startup(
    text, text, text, text, text, uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.radar_register_startup(
    text, text, text, text, text, uuid
) TO authenticated;