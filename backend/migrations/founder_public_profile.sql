CREATE OR REPLACE VIEW public.founder_public_profile AS
SELECT u.user_id,
    u.name,
    u.email,
    u.phone,
    u.linkedin_url,
    u.bio,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
          'startup_id', s.startup_id,
          'name', s.name,
          'description', s.description,
          'location', s.location,
          'funding_round', s.funding_round,
          'open_roles', COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                  'job_id', j.job_id,
                  'title', j.title,
                  'location', j.location,
                  'date_posted', j.date_posted,
                  'application_deadline', j.application_deadline,
                  'application_url', j.application_url)
                ORDER BY j.date_posted DESC NULLS LAST, j.job_id)
              FROM public.job_listing j
              WHERE j.startup_id = s.startup_id
                AND j.status = 'open'), '[]'::jsonb))
        ORDER BY s.name, s.startup_id)
      FROM public.startup_founder sf
      JOIN public.startup s ON s.startup_id = sf.startup_id
      WHERE sf.founder_id = u.user_id), '[]'::jsonb) AS startups
FROM public."user" u
JOIN public.founder f ON f.user_id = u.user_id;

GRANT SELECT ON public.founder_public_profile TO anon, authenticated;