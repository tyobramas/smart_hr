-- ====================================================================
-- SEED DATA: AUTH USERS, PROFILES, JOBS & APPLICATIONS
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. DELETE EXISTING SAMPLE USERS (TO ENSURE CLEAN SEED)
DELETE FROM auth.users WHERE email IN (
  'admin@smarthr.com',
  'budi.santoso@gmail.com',
  'siti.rahma@gmail.com',
  'dimas.aditya@gmail.com'
);

-- 1.1 Admin User (admin@smarthr.com / admin123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change, reauthentication_token, phone_change_token, phone_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'admin@smarthr.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"HR Manager & Recruiter"}',
  now(), now(),
  '', '', '', '', '', '', '', ''
);

-- 1.2 Candidate 1: Budi Santoso (budi.santoso@gmail.com / candidate123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change, reauthentication_token, phone_change_token, phone_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'budi.santoso@gmail.com',
  crypt('candidate123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Budi Santoso"}',
  now(), now(),
  '', '', '', '', '', '', '', ''
);

-- 1.3 Candidate 2: Siti Rahmawati (siti.rahma@gmail.com / candidate123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change, reauthentication_token, phone_change_token, phone_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated',
  'siti.rahma@gmail.com',
  crypt('candidate123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Siti Rahmawati"}',
  now(), now(),
  '', '', '', '', '', '', '', ''
);

-- 1.4 Candidate 3: Dimas Aditya Pratama (dimas.aditya@gmail.com / candidate123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change, reauthentication_token, phone_change_token, phone_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000003',
  'authenticated', 'authenticated',
  'dimas.aditya@gmail.com',
  crypt('candidate123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dimas Aditya Pratama"}',
  now(), now(),
  '', '', '', '', '', '', '', ''
);

-- 2. INSERT PROFILES
INSERT INTO public.profiles (id, user_id, full_name, role) VALUES
  ('11111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'HR Manager & Recruiter', 'admin'),
  ('11111111-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Budi Santoso, S.Kom', 'candidate'),
  ('11111111-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Siti Rahmawati, S.Psi', 'candidate'),
  ('11111111-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'Dimas Aditya Pratama', 'candidate')
ON CONFLICT (user_id) DO UPDATE 
SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- 3. INSERT JOBS
INSERT INTO public.jobs (
  id, title, slug, description, requirements, location, employment_type, min_score_threshold, is_active, created_by
) VALUES
  (
    '22222222-0000-0000-0000-000000000001',
    'Senior Full-Stack Engineer (Next.js + Postgres)',
    'senior-fullstack-engineer',
    'Kami mencari Senior Full-Stack Engineer berpengalaman untuk memimpin pengembangan platform SmartHR. Anda akan merancang arsitektur web modern, mengintegrasikan sistem LLM RAG, dan mengelola database relasional berskala besar.',
    '- Minimal 4 tahun pengalaman menggunakan Next.js App Router, React, dan TypeScript.
- Mahir PostgreSQL, relasi database, indexing, dan Row Level Security (RLS).
- Pengalaman dengan Docker, cloud deployment, dan REST/GraphQL APIs.
- Nilai tambah jika memiliki pengalaman integrasi model AI/LLM.',
    'Jakarta (Hybrid)',
    'Full-time',
    75,
    true,
    '11111111-0000-0000-0000-000000000001'
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    'Talent Acquisition & HR Specialist',
    'talent-acquisition-hr-specialist',
    'Bertanggung jawab atas seluruh proses siklus rekrutmen talenta teknologi, mulai dari sourcing, screening profil kandidat dengan bantuan sistem AI, wawancara HR, hingga proses offering.',
    '- Pengalaman minimal 2 tahun sebagai Tech Recruiter / HR Generalist.
- Memahami alur sourcing kandidat IT dan platform talent job boards.
- Kemampuan komunikasi interpersonal yang luar biasa dan negosiasi.
- Terbiasa menggunakan HRIS / ATS.',
    'Jakarta Selatan (On-site)',
    'Full-time',
    70,
    true,
    '11111111-0000-0000-0000-000000000001'
  ),
  (
    '22222222-0000-0000-0000-000000000003',
    'DevOps & Cloud Platform Engineer',
    'devops-cloud-platform-engineer',
    'Mengelola infrastruktur cloud, automated CI/CD pipeline, monitoring sistem 24/7, dan memastikan availability serta keamanan database production.',
    '- Mahir Linux system administration, Docker containerization, dan Kubernetes.
- Pengalaman mengelola AWS / GCP infrastructure.
- Pengalaman dengan database clustering, automated backup, dan security hardening.',
    'Remote (Indonesia)',
    'Remote',
    80,
    true,
    '11111111-0000-0000-0000-000000000001'
  )
ON CONFLICT (slug) DO UPDATE 
SET title = EXCLUDED.title, description = EXCLUDED.description, requirements = EXCLUDED.requirements;

-- 4. INSERT APPLICATIONS (Candidates applying to jobs with CVs)
INSERT INTO public.applications (
  id, candidate_id, job_id, cv_storage_path, cv_parsed_name, status, cv_score, cv_analysis_json
) VALUES
  (
    '33333333-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000002', -- Budi Santoso
    '22222222-0000-0000-0000-000000000001', -- Senior Full-Stack
    'cvs/budi_santoso_senior_fullstack.pdf',
    'Budi Santoso, S.Kom',
    'screened',
    88.5,
    '{"skills_matched": ["Next.js", "PostgreSQL", "TypeScript", "Docker", "RLS"], "experience_years": 5, "recommendation": "Sangat cocok untuk posisi Senior Full-stack Engineer."}'::jsonb
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000003', -- Siti Rahmawati
    '22222222-0000-0000-0000-000000000002', -- HR Specialist
    'cvs/siti_rahmawati_hr_resume.pdf',
    'Siti Rahmawati, S.Psi',
    'invited_interview',
    93.0,
    '{"skills_matched": ["Tech Sourcing", "ATS Management", "Behavioral Interview", "Communication"], "experience_years": 3, "recommendation": "Kandidat unggulan, telah dijadwalkan interview user."}'::jsonb
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000004', -- Dimas Aditya
    '22222222-0000-0000-0000-000000000001', -- Senior Full-Stack
    'cvs/dimas_aditya_resume.pdf',
    'Dimas Aditya Pratama',
    'pending',
    NULL,
    NULL
  )
ON CONFLICT (candidate_id, job_id) DO UPDATE 
SET status = EXCLUDED.status, cv_score = EXCLUDED.cv_score, cv_analysis_json = EXCLUDED.cv_analysis_json;
