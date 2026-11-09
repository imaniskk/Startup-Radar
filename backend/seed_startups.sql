-- Run the entire file in the team's Supabase SQL Editor using an authorized account.
-- Imports 50 sourced YC startups, 8 primary industries, and 50 industry links.
-- No schema changes, funding claims, job listings, updates, or deletes.
-- Source URLs and retrieval dates remain in src/data/startups_seed.json.
-- One transaction: any validation/constraint failure rolls back this entire import.
BEGIN;
DO $seed$
DECLARE
    company jsonb;
    startup_key uuid;
    industry_key uuid;
    matches integer;
BEGIN
    FOR company IN SELECT value FROM jsonb_array_elements($data$
[
  {
    "name": "AgileMD",
    "description": "Predictive analytics and clinical pathways for hospitals ",
    "location": "San Francisco, CA, USA; Remote",
    "website": "https://agilemd.com",
    "industry": "Healthcare",
    "startup_id": "916953ab-922a-5856-9142-c7583e99b7ec",
    "industry_id": "4e0a87f4-29e1-5432-9444-617a47d9ffd8"
  },
  {
    "name": "Alchemy",
    "description": "Nanotechnology-enabled coatings for automotive and defence sectors",
    "location": "Waterloo, ON, Canada",
    "website": "http://www.alchemynano.com",
    "industry": "Industrials",
    "startup_id": "02dbb16f-eb41-5312-96ca-7e6c7cbb0817",
    "industry_id": "5cf1c3a9-305c-5303-96e5-cb1da4492abe"
  },
  {
    "name": "AnyList",
    "description": "One app for stress-free shopping, cooking, and meal planning.",
    "location": "Missoula, MT, USA; Remote",
    "website": "https://www.anylist.com",
    "industry": "Consumer",
    "startup_id": "6cb9af38-f762-5b2c-8ed4-5fb58c12ebb7",
    "industry_id": "7e0ef537-f7dd-572b-9484-3e43dc5352f9"
  },
  {
    "name": "Apollo",
    "description": "Apollo helps engineering teams accelerate delivery",
    "location": "San Francisco, CA, USA; Remote",
    "website": "http://apollographql.com/",
    "industry": "B2B",
    "startup_id": "85ff9a5a-3b13-55c1-a7d4-54ea64a613ab",
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "name": "Bright",
    "description": "Sunrun for the developing world",
    "location": "New York City, NY, USA; Mexico City, CDMX, Mexico; Remote",
    "website": "https://www.thinkbright.mx",
    "industry": "Industrials",
    "startup_id": "eb0d1b33-550e-5648-a01f-d4213c32f6ef",
    "industry_id": "5cf1c3a9-305c-5303-96e5-cb1da4492abe"
  },
  {
    "name": "Buxfer",
    "description": "Buxfer helps you make better spending decisions by making it easy to…",
    "location": "San Francisco, CA, USA; Santa Clara, CA, USA",
    "website": "https://www.buxfer.com",
    "industry": "Fintech",
    "startup_id": "c892ff0f-fded-5bca-bef9-23ef1bdac29c",
    "industry_id": "868136d4-e587-5593-8221-9f804bf4e6ae"
  },
  {
    "name": "CircuitHub",
    "description": "On-Demand Electronics Manufacturing",
    "location": "London, England, United Kingdom",
    "website": "https://circuithub.com",
    "industry": "Industrials",
    "startup_id": "1c48f37e-aea3-5043-b34c-d1dbe5278f0c",
    "industry_id": "5cf1c3a9-305c-5303-96e5-cb1da4492abe"
  },
  {
    "name": "CleverDeck",
    "description": "Collaborate with an artist to commission original artwork you'll live…",
    "location": "San Francisco, CA, USA; Istanbul, Istanbul, Turkey",
    "website": "http://cleverdeck.com",
    "industry": "Education",
    "startup_id": "edd009b5-f737-52c2-8a40-70942b396ed0",
    "industry_id": "c7c01e44-5e92-5118-9f18-ad8ef772bf0a"
  },
  {
    "name": "DemocracyOS",
    "description": "Online space for deliberation, policy making and democratic…",
    "location": "Buenos Aires, CABA, Argentina",
    "website": "http://www.democracyos.org",
    "industry": "Government",
    "startup_id": "1e7b065c-9683-5460-8410-0e1c795d648e",
    "industry_id": "4a9b03e3-8c65-57df-be9c-3b6fdc5757b5"
  },
  {
    "name": "Eligible",
    "description": "Insurance Billing APIs for Healthcare Businesses ",
    "location": "New York City, NY, USA; Brooklyn, NY, USA",
    "website": "https://eligible.com",
    "industry": "Healthcare",
    "startup_id": "40c9b3da-0002-5bb3-9b4c-280130bdc986",
    "industry_id": "4e0a87f4-29e1-5432-9444-617a47d9ffd8"
  },
  {
    "name": "Experiment",
    "description": "crowdfunding platform for science",
    "location": "Honolulu, HI, USA; Remote",
    "website": "http://experiment.com",
    "industry": "Healthcare",
    "startup_id": "7976e0a0-cb10-5fbe-8fa2-963d20b24d8e",
    "industry_id": "4e0a87f4-29e1-5432-9444-617a47d9ffd8"
  },
  {
    "name": "FundersClub",
    "description": "Online VC",
    "location": "San Francisco, CA, USA; Remote",
    "website": "https://fundersclub.com/",
    "industry": "Fintech",
    "startup_id": "ce44a438-82c3-5619-ad05-70dda0056bde",
    "industry_id": "868136d4-e587-5593-8221-9f804bf4e6ae"
  },
  {
    "name": "GBatteries",
    "description": "Enabling li-ion batteries to charge ultra fast without compromising…",
    "location": "Ottawa, ON, Canada",
    "website": "https://www.gbatteries.com",
    "industry": "Industrials",
    "startup_id": "9db36e0a-df0e-5717-81ca-9a41b7ee4f3c",
    "industry_id": "5cf1c3a9-305c-5303-96e5-cb1da4492abe"
  },
  {
    "name": "GOAT Group",
    "description": "Platform for the greatest products from the past, present and future.",
    "location": "Los Angeles, CA, USA",
    "website": "https://www.goatgroup.com/",
    "industry": "Consumer",
    "startup_id": "13a5ee0d-7c1d-5a48-acae-81bc40b09015",
    "industry_id": "7e0ef537-f7dd-572b-9484-3e43dc5352f9"
  },
  {
    "name": "Gusto",
    "description": "Provides growing businesses with everything to take care of their team",
    "location": "San Francisco, CA, USA",
    "website": "https://gusto.com",
    "industry": "B2B",
    "startup_id": "54d54266-4d6a-5040-88a0-1128dd6b0ab1",
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "name": "HackerRank",
    "description": "Change the world to value skills over pedigree",
    "location": "San Francisco, CA, USA",
    "website": "http://hackerrank.com",
    "industry": "B2B",
    "startup_id": "3fb71e5a-dbed-5205-8340-c61782d8714b",
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "name": "HealthSherpa",
    "description": "Private sector Healthcare.gov. ",
    "location": "Sacramento, CA, USA; Remote",
    "website": "https://healthsherpa.com",
    "industry": "Healthcare",
    "startup_id": "db428ac5-1f17-54d7-aaf6-a642c9bb3aae",
    "industry_id": "4e0a87f4-29e1-5432-9444-617a47d9ffd8"
  },
  {
    "name": "Helion Energy",
    "description": "Building the world's first fusion power plant",
    "location": "Seattle, WA, USA; Everett, WA, USA",
    "website": "http://helionenergy.com",
    "industry": "Industrials",
    "startup_id": "42620bce-0717-5e66-9d94-990769bec75d",
    "industry_id": "5cf1c3a9-305c-5303-96e5-cb1da4492abe"
  },
  {
    "name": "HireArt",
    "description": "Gives businesses everything needed to hire & manage W2 contractors.",
    "location": "New York City, NY, USA; New York, NY, USA",
    "website": "http://hireart.com",
    "industry": "B2B",
    "startup_id": "4d0097e6-c9dd-5e52-895e-7dc65734c8b8",
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "name": "Human Dx",
    "description": "The Human Diagnosis Project.",
    "location": "San Francisco, CA, USA",
    "website": "http://humandx.org",
    "industry": "Healthcare",
    "startup_id": "90c865ac-acae-5265-9b1a-25eeb35b5f1f",
    "industry_id": "4e0a87f4-29e1-5432-9444-617a47d9ffd8"
  },
  {
    "name": "Instapainting",
    "description": "Custom-made artwork from artists e-commerce marketplace.",
    "location": "Tokyo, Tokyo, Japan; San Francisco, CA, USA; Remote",
    "website": "http://instapainting.com",
    "industry": "Consumer",
    "startup_id": "93e6a033-7291-5954-987d-e0e764b57ae5",
    "industry_id": "7e0ef537-f7dd-572b-9484-3e43dc5352f9"
  },
  {
    "name": "LeadGenius",
    "description": "LeadGenius is an account-based marketing and lead generation…",
    "location": "San Francisco, CA, USA; Berkeley, CA, USA",
    "website": "http://leadgenius.com",
    "industry": "B2B",
    "startup_id": "f1ed626b-f933-54a4-bb0b-f6194de7ef05",
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "name": "Lingt",
    "description": "Lingt provided a web-based platform for learning languages leveraging…",
    "location": "San Francisco, CA, USA",
    "website": "https://www.lingt.com/",
    "industry": "Education",
    "startup_id": "05bc5d54-8d85-59e0-87f6-e73e925f4199",
    "industry_id": "c7c01e44-5e92-5118-9f18-ad8ef772bf0a"
  },
  {
    "name": "Medigram",
    "description": "We are making a HIPAA-compliant, Groupme app for doctors to…",
    "location": "Los Gatos, CA, USA",
    "website": "http://medigram.com",
    "industry": "Healthcare",
    "startup_id": "17dadbdb-601d-57b3-82b0-e7dc365cc0dd",
    "industry_id": "4e0a87f4-29e1-5432-9444-617a47d9ffd8"
  },
  {
    "name": "Medmonk",
    "description": "A tool for pharmacists to find funding for patients who are unable to…",
    "location": "Milpitas, CA, USA",
    "website": "http://medmonk.com",
    "industry": "Healthcare",
    "startup_id": "3ac81c53-18ab-5c4c-affe-128732b0f7f6",
    "industry_id": "4e0a87f4-29e1-5432-9444-617a47d9ffd8"
  },
  {
    "name": "Mino Games",
    "description": "Mobile games company",
    "location": "San Francisco, CA, USA; Montreal, QC, Canada",
    "website": "http://minomonsters.com",
    "industry": "Consumer",
    "startup_id": "0c77e757-0fe6-562b-ae43-df903824b4a8",
    "industry_id": "7e0ef537-f7dd-572b-9484-3e43dc5352f9"
  },
  {
    "name": "OneSignal",
    "description": "Engage customers through personalized omni-channel messaging",
    "location": "San Francisco, CA, USA",
    "website": "https://onesignal.com",
    "industry": "B2B",
    "startup_id": "47a98f13-1544-5449-875b-75e191803e98",
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "name": "Panorama Education",
    "description": "Improving education for every student.",
    "location": "Los Angeles, CA, USA",
    "website": "https://www.panoramaed.com/",
    "industry": "Education",
    "startup_id": "f3bbafa0-f987-5aba-8e9e-480dd5cb04a4",
    "industry_id": "c7c01e44-5e92-5118-9f18-ad8ef772bf0a"
  },
  {
    "name": "Per Vices",
    "description": "Building Mission Critical Software Defined Radio products.",
    "location": "Toronto, ON, Canada",
    "website": "https://www.pervices.com",
    "industry": "Industrials",
    "startup_id": "68c5bb88-e32f-5d1e-9c52-7ca11f6e53a4",
    "industry_id": "5cf1c3a9-305c-5303-96e5-cb1da4492abe"
  },
  {
    "name": "Quartzy",
    "description": "Marketplace for life science supplies.",
    "location": "San Francisco, CA, USA; Hayward, CA, USA",
    "website": "https://www.quartzy.com",
    "industry": "Healthcare",
    "startup_id": "99d05c7c-fd7b-5f9a-bfa5-201e6587b60d",
    "industry_id": "4e0a87f4-29e1-5432-9444-617a47d9ffd8"
  },
  {
    "name": "Recurse Center",
    "description": "The retreat where curious programmers recharge and grow",
    "location": "New York City, NY, USA",
    "website": "https://www.recurse.com",
    "industry": "Education",
    "startup_id": "49683a73-cbb8-56b9-87cd-67def0f534c3",
    "industry_id": "c7c01e44-5e92-5118-9f18-ad8ef772bf0a"
  },
  {
    "name": "RentHop",
    "description": "Apartment rental marketplace",
    "location": "New York City, NY, USA; New York, NY, USA",
    "website": "http://renthop.com",
    "industry": "Real Estate and Construction",
    "startup_id": "c0321d37-71b0-5758-bc44-435e43cd9a93",
    "industry_id": "82ac084b-9a62-52be-8708-a25afd177208"
  },
  {
    "name": "Rescale",
    "description": "High Performance Computing Built for the Cloud",
    "location": "San Francisco, CA, USA",
    "website": "https://rescale.com",
    "industry": "B2B",
    "startup_id": "b7b94cef-a5fe-5733-abaf-2eabbafd8a32",
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "name": "Screenleap",
    "description": "One-click screen sharing with installation-free viewing on all devices",
    "location": "San Francisco, CA, USA; San Carlos, CA, USA; Remote",
    "website": "https://screenleap.com",
    "industry": "B2B",
    "startup_id": "8ea3d347-8d03-5548-b01b-6c1247f673c7",
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "name": "Shoptiques",
    "description": "Shoptiques.com lets you shop the world's best local boutiques online.",
    "location": "New York City, NY, USA; New York, NY, USA",
    "website": "http://shoptiques.com",
    "industry": "Consumer",
    "startup_id": "7c078d39-f1a1-5cc1-b43b-f957ad2479af",
    "industry_id": "7e0ef537-f7dd-572b-9484-3e43dc5352f9"
  },
  {
    "name": "Sift",
    "description": "The Leader in Digital Trust & Safety",
    "location": "San Francisco, CA, USA",
    "website": "https://sift.com/",
    "industry": "B2B",
    "startup_id": "a2fdfec2-d9b0-5d3b-9537-758dc9f51832",
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "name": "SmartAsset",
    "description": "Marketplace connecting consumers to financial advisors",
    "location": "Austin, TX, USA; Remote",
    "website": "http://smartasset.com",
    "industry": "Fintech",
    "startup_id": "b12cbeb9-d930-5fac-bfdf-3820092bfe17",
    "industry_id": "868136d4-e587-5593-8221-9f804bf4e6ae"
  },
  {
    "name": "Snapdocs",
    "description": "digital mortgage closing",
    "location": "Portland, OR, USA; San Francisco, CA, USA",
    "website": "http://snapdocs.com",
    "industry": "Real Estate and Construction",
    "startup_id": "91b5617b-fed9-5267-bcbd-bee652eac6ab",
    "industry_id": "82ac084b-9a62-52be-8708-a25afd177208"
  },
  {
    "name": "Storyworth",
    "description": "Record your family stories and print them in beautiful keepsake books.",
    "location": "Kailua, HI, USA; Stockholm, Stockholm County, Sweden; Remote",
    "website": "https://www.storyworth.com",
    "industry": "Consumer",
    "startup_id": "b8fb9232-2e9f-5d28-a7ba-de4f6dda4d28",
    "industry_id": "7e0ef537-f7dd-572b-9484-3e43dc5352f9"
  },
  {
    "name": "Streak",
    "description": "Streak transforms Gmail into a powerful CRM",
    "location": "San Francisco, CA, USA; Remote",
    "website": "http://streak.com",
    "industry": "B2B",
    "startup_id": "eea9d201-998e-59d7-92ef-fb4dfe40ae71",
    "industry_id": "7a9c538f-2859-5e29-9b2e-5828805e5deb"
  },
  {
    "name": "Stripe",
    "description": "Economic infrastructure for the internet.",
    "location": "San Francisco, CA, USA",
    "website": "http://stripe.com",
    "industry": "Fintech",
    "startup_id": "0c2614b8-ab8a-50e9-b099-753a80e8c0b4",
    "industry_id": "868136d4-e587-5593-8221-9f804bf4e6ae"
  },
  {
    "name": "SunFarmer",
    "description": "Reliable and affordable solar energy in developing countries.",
    "location": "Kathmandu, Central Development Region, Nepal",
    "website": "http://sunfarmer.org",
    "industry": "Industrials",
    "startup_id": "d2dd5551-cace-5c67-96fa-f8f903b7a54b",
    "industry_id": "5cf1c3a9-305c-5303-96e5-cb1da4492abe"
  },
  {
    "name": "Token Transit",
    "description": "Complete fare payment platform for public transportation",
    "location": "San Francisco, CA, USA",
    "website": "https://tokentransit.com",
    "industry": "Government",
    "startup_id": "e8d4d4ca-ef83-5dd8-b387-2b9e41544bbc",
    "industry_id": "4a9b03e3-8c65-57df-be9c-3b6fdc5757b5"
  },
  {
    "name": "Tremendous",
    "description": "How businesses send money to people at scale. Fast, free, global.",
    "location": "New York City, NY, USA; Remote",
    "website": "https://www.tremendous.com",
    "industry": "Fintech",
    "startup_id": "0f5d9de7-f0a7-5981-b812-73fd5ec265d7",
    "industry_id": "868136d4-e587-5593-8221-9f804bf4e6ae"
  },
  {
    "name": "True Link",
    "description": "Financial Services for Financial Caregivers. ",
    "location": "New York City, NY, USA; San Francisco, CA, USA; Remote",
    "website": "https://www.truelinkfinancial.com/",
    "industry": "Fintech",
    "startup_id": "e6e7d4ec-225d-56a5-b066-9a49ee5d0b10",
    "industry_id": "868136d4-e587-5593-8221-9f804bf4e6ae"
  },
  {
    "name": "Wefunder",
    "description": "We're Robinhood for pre-IPO startups. Everyone can invest $100.",
    "location": "San Francisco, CA, USA",
    "website": "http://wefunder.com",
    "industry": "Fintech",
    "startup_id": "e4f78b6a-f0b2-5df9-aa13-627f1ac87714",
    "industry_id": "868136d4-e587-5593-8221-9f804bf4e6ae"
  },
  {
    "name": "You Got Listings",
    "description": "All-in-one apartment Marketing Platform for brokerages and landlords.",
    "location": "Remote",
    "website": "http://www.yougotlistings.com",
    "industry": "Real Estate and Construction",
    "startup_id": "f6fac7f5-5ac4-5625-b324-4c6a100cc840",
    "industry_id": "82ac084b-9a62-52be-8708-a25afd177208"
  },
  {
    "name": "Zeitview",
    "description": "Inspection software for renewable energy & sustainable infrastructure",
    "location": "Los Angeles, CA, USA; Santa Monica, CA, USA; Remote",
    "website": "https://www.zeitview.com/",
    "industry": "Industrials",
    "startup_id": "8e2c2dcb-9ebe-5085-85aa-a88b583ffcf6",
    "industry_id": "5cf1c3a9-305c-5303-96e5-cb1da4492abe"
  },
  {
    "name": "Zenysis",
    "description": "Building powerful data analysis software for developing countries.",
    "location": "San Francisco, CA, USA",
    "website": "http://www.zenysis.com",
    "industry": "Government",
    "startup_id": "7b5f8281-2105-5946-a73a-37c8aff95e0e",
    "industry_id": "4a9b03e3-8c65-57df-be9c-3b6fdc5757b5"
  },
  {
    "name": "Zidisha",
    "description": "Direct P2P lending across the international wealth divide.",
    "location": "Sterling, VA, USA; Remote",
    "website": "https://www.zidisha.org",
    "industry": "Fintech",
    "startup_id": "82e30563-751a-53c6-b21c-363f2b365178",
    "industry_id": "868136d4-e587-5593-8221-9f804bf4e6ae"
  }
]
$data$::jsonb)
    LOOP
        SELECT count(*) INTO matches FROM public.startup
        WHERE lower(trim(name)) = lower(trim(company->>'name'));
        IF matches > 1 THEN
            RAISE EXCEPTION 'Ambiguous existing startup: %', company->>'name';
        ELSIF matches = 1 THEN
            SELECT startup_id INTO startup_key FROM public.startup
            WHERE lower(trim(name)) = lower(trim(company->>'name'));
            IF NOT EXISTS (
                SELECT 1 FROM public.startup
                WHERE startup_id = startup_key
                AND lower(rtrim(website, '/')) = lower(rtrim(company->>'website', '/'))
            ) THEN
                RAISE EXCEPTION 'Existing startup website differs: %', company->>'name';
            END IF;
        ELSE
            startup_key := (company->>'startup_id')::uuid;
            INSERT INTO public.startup (startup_id, name, description, location, website, funding_round)
            VALUES (startup_key, company->>'name', company->>'description',
                    company->>'location', company->>'website', NULL);
        END IF;

        SELECT count(*) INTO matches FROM public.industry
        WHERE lower(trim(name)) = lower(trim(company->>'industry'));
        IF matches > 1 THEN
            RAISE EXCEPTION 'Ambiguous existing industry: %', company->>'industry';
        ELSIF matches = 1 THEN
            SELECT industry_id INTO industry_key FROM public.industry
            WHERE lower(trim(name)) = lower(trim(company->>'industry'));
        ELSE
            industry_key := (company->>'industry_id')::uuid;
            INSERT INTO public.industry (industry_id, name)
            VALUES (industry_key, company->>'industry');
        END IF;

        INSERT INTO public.startup_industry (startup_id, industry_id)
        SELECT startup_key, industry_key
        WHERE NOT EXISTS (
            SELECT 1 FROM public.startup_industry
            WHERE startup_id = startup_key AND industry_id = industry_key
        );
    END LOOP;
END;
$seed$;
COMMIT;

-- This result verifies the owner can read the imported records; it does not
-- verify anonymous API visibility. Test GET /startups separately with your key.
SELECT s.name, s.website, s.funding_round, i.name AS industry
FROM public.startup s
JOIN public.startup_industry si ON si.startup_id = s.startup_id
JOIN public.industry i ON i.industry_id = si.industry_id
WHERE s.name IN ('AgileMD', 'Alchemy', 'AnyList', 'Apollo', 'Bright', 'Buxfer', 'CircuitHub', 'CleverDeck', 'DemocracyOS', 'Eligible', 'Experiment', 'FundersClub', 'GBatteries', 'GOAT Group', 'Gusto', 'HackerRank', 'HealthSherpa', 'Helion Energy', 'HireArt', 'Human Dx', 'Instapainting', 'LeadGenius', 'Lingt', 'Medigram', 'Medmonk', 'Mino Games', 'OneSignal', 'Panorama Education', 'Per Vices', 'Quartzy', 'Recurse Center', 'RentHop', 'Rescale', 'Screenleap', 'Shoptiques', 'Sift', 'SmartAsset', 'Snapdocs', 'Storyworth', 'Streak', 'Stripe', 'SunFarmer', 'Token Transit', 'Tremendous', 'True Link', 'Wefunder', 'You Got Listings', 'Zeitview', 'Zenysis', 'Zidisha')
ORDER BY s.name;
