CREATE OR REPLACE FUNCTION public.radar_create_applicant_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 requested_type text := coalesce(NULLIF(btrim(NEW.raw_user_meta_data ->> 'account_type'), ''), 'applicant');
BEGIN
 IF NEW.email IS NULL OR btrim(NEW.email) = '' THEN
    RAISE EXCEPTION 'Startup Radar requires an email address' USING ERRCODE = 'invalid_parameter_value';
 END IF;
 IF requested_type NOT IN ('applicant', 'founder') THEN
    RAISE EXCEPTION 'Unknown account type: %', requested_type;
 END IF;

 INSERT INTO public."user" (user_id, email, name, account_type)
    VALUES (NEW.id, NEW.email, NULLIF(btrim(NEW.raw_user_meta_data ->> 'name'), ''), requested_type);

 IF requested_type = 'founder' THEN
    INSERT INTO public.founder (user_id) VALUES (NEW.id);
 ELSE
    INSERT INTO public.applicant (user_id) VALUES (NEW.id);
 END IF;

 RETURN NEW;
END;
$function$;