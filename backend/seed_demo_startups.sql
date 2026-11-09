-- Fictional companies and internships for the COMPSCI 316 Milestone 3 demo.
-- Run the ENTIRE file in Supabase SQL Editor with an authorized account.
-- Insert-only, rerunnable, one transaction; no schema or policy changes.
-- Source: src/data/demo_startups_seed.json (all records are invented demo data).
BEGIN;
DO $seed$
DECLARE
    company jsonb;
    job jsonb;
    company_id uuid;
    category_id uuid;
    matches integer;
BEGIN
    FOR company IN SELECT value FROM jsonb_array_elements($data$
[
  {
    "startup_id": "e9936adc-553a-5b77-84ba-1834a7179480",
    "is_demo": true,
    "name": "[DEMO] Cloud Sprout",
    "description": "[DEMO] A fictional cloud workspace for student project teams. Created for the COMPSCI 316 project; not a real employer.",
    "location": "Durham, NC, USA (demo)",
    "funding_round": null,
    "website": null,
    "industry": "B2B",
    "jobs": [
      {
        "job_id": "516f1866-a756-58bf-8bce-8fb3694d292e",
        "startup_id": "e9936adc-553a-5b77-84ba-1834a7179480",
        "title": "Software Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample software engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "beeb4f27-4ad7-56bf-9616-85da66affb4e",
        "startup_id": "e9936adc-553a-5b77-84ba-1834a7179480",
        "title": "Data Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample data engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "ca703b15-a9a2-5c2e-add3-5b43049c1455",
        "startup_id": "e9936adc-553a-5b77-84ba-1834a7179480",
        "title": "Product Management Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample product management tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      }
    ],
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "startup_id": "5555b74b-0fcc-5cd2-b924-e943ede6b690",
    "is_demo": true,
    "name": "[DEMO] Data Grove",
    "description": "[DEMO] A fictional platform for learning data pipeline development. Created for the COMPSCI 316 project; not a real employer.",
    "location": "Durham, NC, USA (demo)",
    "funding_round": null,
    "website": null,
    "industry": "B2B",
    "jobs": [
      {
        "job_id": "b16d22f3-ffa3-58ff-b849-e8a7ae0c5fff",
        "startup_id": "5555b74b-0fcc-5cd2-b924-e943ede6b690",
        "title": "Data Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample data engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "52ddb836-05d4-5302-b0bd-ae61f4479ef0",
        "startup_id": "5555b74b-0fcc-5cd2-b924-e943ede6b690",
        "title": "Product Management Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample product management tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "20bf0d5d-9786-5388-b3fa-3d2d06f739df",
        "startup_id": "5555b74b-0fcc-5cd2-b924-e943ede6b690",
        "title": "UX Design Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample ux design tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      }
    ],
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "startup_id": "f25e198c-f3d1-573c-8d7f-781c24e26ccd",
    "is_demo": true,
    "name": "[DEMO] Campus Compass",
    "description": "[DEMO] A fictional tool for organizing campus learning resources. Created for the COMPSCI 316 project; not a real employer.",
    "location": "Durham, NC, USA (demo)",
    "funding_round": null,
    "website": null,
    "industry": "Education",
    "jobs": [
      {
        "job_id": "086bb03e-bb3a-5693-9f0b-8472e67045a1",
        "startup_id": "f25e198c-f3d1-573c-8d7f-781c24e26ccd",
        "title": "Product Management Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample product management tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "93bf3565-3805-56ec-986d-7dc043d3ca45",
        "startup_id": "f25e198c-f3d1-573c-8d7f-781c24e26ccd",
        "title": "UX Design Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample ux design tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "9b84ccde-d175-50b6-b44b-8853297d035e",
        "startup_id": "f25e198c-f3d1-573c-8d7f-781c24e26ccd",
        "title": "QA Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample qa engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      }
    ],
    "industry_id": "c7c01e44-5e92-5118-9f18-ad8ef772bf0a"
  },
  {
    "startup_id": "c56619f8-4d14-5d99-9338-d011ae60d918",
    "is_demo": true,
    "name": "[DEMO] Green Grid",
    "description": "[DEMO] A fictional dashboard for exploring energy-use patterns. Created for the COMPSCI 316 project; not a real employer.",
    "location": "Durham, NC, USA (demo)",
    "funding_round": null,
    "website": null,
    "industry": "Industrials",
    "jobs": [
      {
        "job_id": "d1f79bb0-132a-56b0-a8b1-3796c44d6803",
        "startup_id": "c56619f8-4d14-5d99-9338-d011ae60d918",
        "title": "UX Design Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample ux design tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "3788f6f6-8dd1-5460-b51b-2df90c5167e2",
        "startup_id": "c56619f8-4d14-5d99-9338-d011ae60d918",
        "title": "QA Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample qa engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "8a07f5db-ec4f-5d09-b515-d71a8d7cc26b",
        "startup_id": "c56619f8-4d14-5d99-9338-d011ae60d918",
        "title": "Data Science Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample data science tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      }
    ],
    "industry_id": "5cf1c3a9-305c-5303-96e5-cb1da4492abe"
  },
  {
    "startup_id": "691dce65-38cf-5a40-b291-05a8b23cd0f7",
    "is_demo": true,
    "name": "[DEMO] Care Lantern",
    "description": "[DEMO] A fictional scheduling prototype for community health programs. Created for the COMPSCI 316 project; not a real employer.",
    "location": "Durham, NC, USA (demo)",
    "funding_round": null,
    "website": null,
    "industry": "Healthcare",
    "jobs": [
      {
        "job_id": "9ae54e1b-0205-5f9c-9016-f65c988e57ec",
        "startup_id": "691dce65-38cf-5a40-b291-05a8b23cd0f7",
        "title": "QA Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample qa engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "7a5238d8-052a-5984-9a21-5b0bf026040c",
        "startup_id": "691dce65-38cf-5a40-b291-05a8b23cd0f7",
        "title": "Data Science Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample data science tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "f79f8725-8360-57b6-a7de-07792f4d66af",
        "startup_id": "691dce65-38cf-5a40-b291-05a8b23cd0f7",
        "title": "Software Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample software engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      }
    ],
    "industry_id": "4e0a87f4-29e1-5432-9444-617a47d9ffd8"
  },
  {
    "startup_id": "5b985288-d533-5f9b-8f25-e50b55951d78",
    "is_demo": true,
    "name": "[DEMO] Penny Path",
    "description": "[DEMO] A fictional budgeting learning app for students. Created for the COMPSCI 316 project; not a real employer.",
    "location": "Durham, NC, USA (demo)",
    "funding_round": null,
    "website": null,
    "industry": "Fintech",
    "jobs": [
      {
        "job_id": "d15b217d-6a4e-5c5d-874c-3eb72d6ebc3b",
        "startup_id": "5b985288-d533-5f9b-8f25-e50b55951d78",
        "title": "Data Science Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample data science tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "42b5c15f-cbac-5728-93d2-754ec9c0a136",
        "startup_id": "5b985288-d533-5f9b-8f25-e50b55951d78",
        "title": "Software Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample software engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "12ada040-9bfc-52ef-b9fa-8dc8844f8784",
        "startup_id": "5b985288-d533-5f9b-8f25-e50b55951d78",
        "title": "Data Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample data engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      }
    ],
    "industry_id": "868136d4-e587-5593-8221-9f804bf4e6ae"
  },
  {
    "startup_id": "770f5f1d-a439-59d8-a841-192ae4e571de",
    "is_demo": true,
    "name": "[DEMO] Pixel Orchard",
    "description": "[DEMO] A fictional collaborative design tool for hobby creators. Created for the COMPSCI 316 project; not a real employer.",
    "location": "Durham, NC, USA (demo)",
    "funding_round": null,
    "website": null,
    "industry": "Consumer",
    "jobs": [
      {
        "job_id": "3d615a20-714f-593b-aa25-a80b1ce3796c",
        "startup_id": "770f5f1d-a439-59d8-a841-192ae4e571de",
        "title": "Software Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample software engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "4d6effde-dadd-538f-8531-089feffb8797",
        "startup_id": "770f5f1d-a439-59d8-a841-192ae4e571de",
        "title": "Data Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample data engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "ef6d379f-e2f5-5739-9b9a-debc16560e01",
        "startup_id": "770f5f1d-a439-59d8-a841-192ae4e571de",
        "title": "Product Management Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample product management tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      }
    ],
    "industry_id": "7e0ef537-f7dd-572b-9484-3e43dc5352f9"
  },
  {
    "startup_id": "4223e848-eced-5439-b486-ca4d865fdf71",
    "is_demo": true,
    "name": "[DEMO] Civic Bridge",
    "description": "[DEMO] A fictional prototype for finding community services. Created for the COMPSCI 316 project; not a real employer.",
    "location": "Durham, NC, USA (demo)",
    "funding_round": null,
    "website": null,
    "industry": "Government",
    "jobs": [
      {
        "job_id": "9451e229-2351-5cd4-a70b-d44467d7b428",
        "startup_id": "4223e848-eced-5439-b486-ca4d865fdf71",
        "title": "Data Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample data engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "215b7a4f-4f91-5b4e-ab20-e52f46e15678",
        "startup_id": "4223e848-eced-5439-b486-ca4d865fdf71",
        "title": "Product Management Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample product management tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "bd5f07b4-9093-5b68-a8d6-29990c3498b0",
        "startup_id": "4223e848-eced-5439-b486-ca4d865fdf71",
        "title": "UX Design Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample ux design tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      }
    ],
    "industry_id": "4a9b03e3-8c65-57df-be9c-3b6fdc5757b5"
  },
  {
    "startup_id": "2f8366ca-4f34-5ea3-ac66-1c5c63209572",
    "is_demo": true,
    "name": "[DEMO] Build Nest",
    "description": "[DEMO] A fictional workspace for planning building projects. Created for the COMPSCI 316 project; not a real employer.",
    "location": "Durham, NC, USA (demo)",
    "funding_round": null,
    "website": null,
    "industry": "Real Estate and Construction",
    "jobs": [
      {
        "job_id": "0cd489fa-6569-5f16-9119-ad7e03e0ec17",
        "startup_id": "2f8366ca-4f34-5ea3-ac66-1c5c63209572",
        "title": "Product Management Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample product management tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "b9415343-105d-5d7a-82d9-97ff81d7e659",
        "startup_id": "2f8366ca-4f34-5ea3-ac66-1c5c63209572",
        "title": "UX Design Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample ux design tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "b32d6572-8113-51b2-84ac-a82aa3ee782c",
        "startup_id": "2f8366ca-4f34-5ea3-ac66-1c5c63209572",
        "title": "QA Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample qa engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      }
    ],
    "industry_id": "82ac084b-9a62-52be-8708-a25afd177208"
  },
  {
    "startup_id": "57d18876-4b3c-5943-af07-eadb1ab4c212",
    "is_demo": true,
    "name": "[DEMO] Orbit Cart",
    "description": "[DEMO] A fictional storefront builder for campus makers. Created for the COMPSCI 316 project; not a real employer.",
    "location": "Durham, NC, USA (demo)",
    "funding_round": null,
    "website": null,
    "industry": "Consumer",
    "jobs": [
      {
        "job_id": "90985c60-5600-5e7d-976b-5039be146da9",
        "startup_id": "57d18876-4b3c-5943-af07-eadb1ab4c212",
        "title": "UX Design Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample ux design tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "da8dc010-5008-54a5-89d3-bab95ce98ed6",
        "startup_id": "57d18876-4b3c-5943-af07-eadb1ab4c212",
        "title": "QA Engineering Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample qa engineering tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      },
      {
        "job_id": "2fe666e6-f7e6-5343-9a82-b508d435983b",
        "startup_id": "57d18876-4b3c-5943-af07-eadb1ab4c212",
        "title": "Data Science Intern",
        "description": "[DEMO] Fictional internship for the COMPSCI 316 project. Practice collaborating on sample data science tasks. This is not a real opening and accepts no real applications.",
        "location": "Remote (demo)",
        "status": "open",
        "date_posted": null,
        "application_url": null,
        "application_deadline": null
      }
    ],
    "industry_id": "7e0ef537-f7dd-572b-9484-3e43dc5352f9"
  }
]
$data$::jsonb)
    LOOP
        company_id := (company->>'startup_id')::uuid;
        IF EXISTS (SELECT 1 FROM public.startup WHERE startup_id = company_id
            AND (name IS DISTINCT FROM company->>'name'
                 OR description IS DISTINCT FROM company->>'description')) THEN
            RAISE EXCEPTION 'Existing startup ID differs from demo fixture: %', company_id;
        END IF;
        IF EXISTS (SELECT 1 FROM public.startup WHERE name = company->>'name'
            AND startup_id <> company_id) THEN
            RAISE EXCEPTION 'Demo startup name exists with a different ID: %', company->>'name';
        END IF;
        INSERT INTO public.startup (startup_id, name, description, location, funding_round, website)
        VALUES (company_id, company->>'name', company->>'description', company->>'location', NULL, NULL)
        ON CONFLICT (startup_id) DO NOTHING;

        SELECT count(*) INTO matches FROM public.industry
        WHERE lower(trim(name)) = lower(trim(company->>'industry'));
        IF matches > 1 THEN
            RAISE EXCEPTION 'Ambiguous industry: %', company->>'industry';
        ELSIF matches = 1 THEN
            SELECT industry_id INTO category_id FROM public.industry
            WHERE lower(trim(name)) = lower(trim(company->>'industry'));
        ELSE
            category_id := (company->>'industry_id')::uuid;
            INSERT INTO public.industry (industry_id, name)
            VALUES (category_id, company->>'industry');
        END IF;
        INSERT INTO public.startup_industry (startup_id, industry_id)
        SELECT company_id, category_id
        WHERE NOT EXISTS (SELECT 1 FROM public.startup_industry
            WHERE startup_id = company_id AND industry_id = category_id);

        FOR job IN SELECT value FROM jsonb_array_elements(company->'jobs')
        LOOP
            IF EXISTS (SELECT 1 FROM public.job_listing
                WHERE job_id = (job->>'job_id')::uuid
                AND (startup_id IS DISTINCT FROM company_id
                    OR title IS DISTINCT FROM job->>'title'
                    OR description IS DISTINCT FROM job->>'description')) THEN
                RAISE EXCEPTION 'Existing job ID differs from demo fixture: %', job->>'job_id';
            END IF;
            INSERT INTO public.job_listing
                (job_id, startup_id, title, description, location, status,
                 date_posted, application_url, application_deadline)
            VALUES ((job->>'job_id')::uuid, company_id, job->>'title',
                    job->>'description', job->>'location', job->>'status',
                    CURRENT_DATE, NULL, NULL)
            ON CONFLICT (job_id) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$seed$;
COMMIT;

-- Expected: 10 rows, each with 3 demo openings. Existing real companies are unchanged.
SELECT s.startup_id, s.name, count(j.job_id) AS demo_job_count
FROM public.startup s
LEFT JOIN public.job_listing j ON j.startup_id = s.startup_id
WHERE s.startup_id IN ('e9936adc-553a-5b77-84ba-1834a7179480'::uuid, '5555b74b-0fcc-5cd2-b924-e943ede6b690'::uuid, 'f25e198c-f3d1-573c-8d7f-781c24e26ccd'::uuid, 'c56619f8-4d14-5d99-9338-d011ae60d918'::uuid, '691dce65-38cf-5a40-b291-05a8b23cd0f7'::uuid, '5b985288-d533-5f9b-8f25-e50b55951d78'::uuid, '770f5f1d-a439-59d8-a841-192ae4e571de'::uuid, '4223e848-eced-5439-b486-ca4d865fdf71'::uuid, '2f8366ca-4f34-5ea3-ac66-1c5c63209572'::uuid, '57d18876-4b3c-5943-af07-eadb1ab4c212'::uuid)
GROUP BY s.startup_id, s.name
ORDER BY s.name;
