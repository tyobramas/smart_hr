--
-- PostgreSQL database dump
--

\restrict skXPwlekDHjRfK4xSuSPhS7Om5ta7TfcSiDYDQnW2XUWcquGW9pNFMREOxAt1G6

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP POLICY IF EXISTS "User can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "User can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Candidate can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Candidate can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Candidate can update own application" ON public.applications;
DROP POLICY IF EXISTS "Candidate can insert own application" ON public.applications;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Admin can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin can update applications" ON public.applications;
DROP POLICY IF EXISTS "Admin can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin can delete jobs" ON public.jobs;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.langchain_pg_embedding DROP CONSTRAINT IF EXISTS langchain_pg_embedding_collection_id_fkey;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS jobs_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.applications DROP CONSTRAINT IF EXISTS applications_job_id_fkey;
ALTER TABLE IF EXISTS ONLY public.applications DROP CONSTRAINT IF EXISTS applications_candidate_id_fkey;
DROP INDEX IF EXISTS public.idx_jobs_slug;
DROP INDEX IF EXISTS public.idx_jobs_is_active;
DROP INDEX IF EXISTS public.idx_jobs_created_by;
DROP INDEX IF EXISTS public.idx_applications_status;
DROP INDEX IF EXISTS public.idx_applications_job_id;
DROP INDEX IF EXISTS public.idx_applications_created_at;
DROP INDEX IF EXISTS public.idx_applications_candidate_id;
DROP INDEX IF EXISTS public.cv_vectors_embedding_idx;
ALTER TABLE IF EXISTS ONLY public.applications DROP CONSTRAINT IF EXISTS unique_candidate_job;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.langchain_pg_embedding DROP CONSTRAINT IF EXISTS langchain_pg_embedding_pkey;
ALTER TABLE IF EXISTS ONLY public.langchain_pg_collection DROP CONSTRAINT IF EXISTS langchain_pg_collection_pkey;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS jobs_slug_key;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.cv_vectors DROP CONSTRAINT IF EXISTS cv_vectors_pkey;
ALTER TABLE IF EXISTS ONLY public.applications DROP CONSTRAINT IF EXISTS applications_pkey;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.langchain_pg_embedding;
DROP TABLE IF EXISTS public.langchain_pg_collection;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.cv_vectors;
DROP TABLE IF EXISTS public.applications;
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_my_profile_id();
DROP SCHEMA IF EXISTS public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: get_my_profile_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_my_profile_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT id
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;


ALTER FUNCTION public.get_my_profile_id() OWNER TO postgres;

--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE user_id = auth.uid()
          AND role = 'admin'
    );
$$;


ALTER FUNCTION public.is_admin() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    candidate_id uuid NOT NULL,
    job_id uuid NOT NULL,
    cv_storage_path text NOT NULL,
    cv_parsed_name text,
    status text DEFAULT 'pending'::text NOT NULL,
    cv_score numeric,
    cv_analysis_json jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    personality_result_json jsonb,
    personality_completed_at timestamp with time zone,
    interview_deadline timestamp with time zone,
    interview_started_at timestamp with time zone,
    interview_completed_at timestamp with time zone,
    interview_duration_seconds integer DEFAULT 0,
    interview_transcript_json jsonb,
    CONSTRAINT applications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'screened'::text, 'rejected'::text, 'invited_interview'::text, 'interview_in_progress'::text, 'interview_completed'::text, 'withdrawn_expired'::text])))
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- Name: cv_vectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cv_vectors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    candidate_id uuid NOT NULL,
    job_id uuid,
    content text NOT NULL,
    embedding public.vector(1536) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cv_vectors OWNER TO postgres;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    requirements text NOT NULL,
    location text NOT NULL,
    employment_type text NOT NULL,
    min_score_threshold numeric DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    interview_blueprints_json jsonb
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: COLUMN jobs.interview_blueprints_json; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.interview_blueprints_json IS 'Skrip wawancara hasil generate Hermes: array kompetensi berisi question_text, required_topics, prepared_probe. Null berarti belum pernah digenerate.';


--
-- Name: langchain_pg_collection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.langchain_pg_collection (
    name character varying,
    cmetadata json,
    uuid uuid NOT NULL
);


ALTER TABLE public.langchain_pg_collection OWNER TO postgres;

--
-- Name: langchain_pg_embedding; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.langchain_pg_embedding (
    collection_id uuid,
    embedding public.vector,
    document character varying,
    cmetadata json,
    custom_id character varying,
    uuid uuid NOT NULL
);


ALTER TABLE public.langchain_pg_embedding OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'candidate'::text])))
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (id, candidate_id, job_id, cv_storage_path, cv_parsed_name, status, cv_score, cv_analysis_json, created_at, personality_result_json, personality_completed_at, interview_deadline, interview_started_at, interview_completed_at, interview_duration_seconds, interview_transcript_json) FROM stdin;
33333333-0000-0000-0000-000000000002	11111111-0000-0000-0000-000000000003	22222222-0000-0000-0000-000000000002	cvs/siti_rahmawati_hr_resume.pdf	Siti Rahmawati, S.Psi	invited_interview	93.0	{"recommendation": "Kandidat unggulan, telah dijadwalkan interview user.", "skills_matched": ["Tech Sourcing", "ATS Management", "Behavioral Interview", "Communication"], "experience_years": 3}	2026-09-01 13:18:30.532972+00	\N	\N	\N	\N	\N	0	\N
33333333-0000-0000-0000-000000000003	11111111-0000-0000-0000-000000000004	22222222-0000-0000-0000-000000000001	cvs/dimas_aditya_resume.pdf	Dimas Aditya Pratama	pending	\N	\N	2026-09-01 13:18:30.532972+00	\N	\N	\N	\N	\N	0	\N
\.


--
-- Data for Name: cv_vectors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cv_vectors (id, candidate_id, job_id, content, embedding, created_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, title, slug, description, requirements, location, employment_type, min_score_threshold, is_active, created_by, created_at, interview_blueprints_json) FROM stdin;
22222222-0000-0000-0000-000000000001	Senior Full-Stack Engineer (Next.js + Postgres)	senior-fullstack-engineer	Kami mencari Senior Full-Stack Engineer berpengalaman untuk memimpin pengembangan platform SmartHR. Anda akan merancang arsitektur web modern, mengintegrasikan sistem LLM RAG, dan mengelola database relasional berskala besar.	- Minimal 4 tahun pengalaman menggunakan Next.js App Router, React, dan TypeScript.\n- Mahir PostgreSQL, relasi database, indexing, dan Row Level Security (RLS).\n- Pengalaman dengan Docker, cloud deployment, dan REST/GraphQL APIs.\n- Nilai tambah jika memiliki pengalaman integrasi model AI/LLM.	Jakarta (Hybrid)	Full-time	75	t	11111111-0000-0000-0000-000000000001	2026-09-01 13:18:30.532972+00	\N
22222222-0000-0000-0000-000000000002	Talent Acquisition & HR Specialist	talent-acquisition-hr-specialist	Bertanggung jawab atas seluruh proses siklus rekrutmen talenta teknologi, mulai dari sourcing, screening profil kandidat dengan bantuan sistem AI, wawancara HR, hingga proses offering.	- Pengalaman minimal 2 tahun sebagai Tech Recruiter / HR Generalist.\n- Memahami alur sourcing kandidat IT dan platform talent job boards.\n- Kemampuan komunikasi interpersonal yang luar biasa dan negosiasi.\n- Terbiasa menggunakan HRIS / ATS.	Jakarta Selatan (On-site)	Full-time	70	t	11111111-0000-0000-0000-000000000001	2026-09-01 13:18:30.532972+00	\N
22222222-0000-0000-0000-000000000003	DevOps & Cloud Platform Engineer	devops-cloud-platform-engineer	Mengelola infrastruktur cloud, automated CI/CD pipeline, monitoring sistem 24/7, dan memastikan availability serta keamanan database production.	- Mahir Linux system administration, Docker containerization, dan Kubernetes.\n- Pengalaman mengelola AWS / GCP infrastructure.\n- Pengalaman dengan database clustering, automated backup, dan security hardening.	Remote (Indonesia)	Remote	80	t	11111111-0000-0000-0000-000000000001	2026-09-01 13:18:30.532972+00	\N
8744e4de-cdd9-441f-bd69-8ab706cb2554	Senior Corporate Tax & Accounting Specialist	senior-tax-accounting-specialist	Kami mencari Senior Corporate Tax & Accounting Specialist berpengalaman untuk mengelola kepatuhan pajak perusahaan, rekonsiliasi fiskal tahunan, perencanaan pajak strategis, serta pelaporan SPT Masa dan Tahunan secara akurat sesuai regulasi perpajakan Indonesia.	• Pendidikan minimal S1 Akuntansi atau Perpajakan.\n• Pengalaman kerja minimal 3-5 tahun dalam bidang perpajakan dan akuntansi korporasi.\n• Memiliki Sertifikat Brevet Pajak A, B (Brevet C menjadi nilai tambah).\n• Menguasai regulasi perpajakan Indonesia: PPh 21/26, PPh 23, PPh 4 ayat 2, PPh Badan Pasal 25/29, serta PPN e-Faktur.\n• Mahir menggunakan aplikasi perpajakan resmi: e-Faktur Pajak, e-Bupot Unifikasi, e-SPT, dan DJP Online.\n• Berpengalaman dengan software akuntansi / ERP seperti SAP FICO, Accurate, atau Jurnal by Mekari.\n• Memiliki rekam jejak mendampingi pemeriksaan dan audit pajak korporasi.	Jakarta Pusat (On-site)	full_time	75	t	11111111-0000-0000-0000-000000000001	2026-08-19 06:57:29.010915+00	\N
bc0ece76-be65-4728-bafe-d9017b8e8bab	Kurir & Logistik Delivery Eksekutif (B2B)	kurir-logistik-delivery-eksekutif	Bertanggung jawab atas pengiriman dokumen penting dan paket barang bisnis (B2B) antar kantor klien di area Jabodetabek secara tepat waktu, aman, dan menjaga kerahasiaan dokumen perusahaan.	• Pendidikan minimal SMA/SMK sederajat.\n• Memiliki SIM C dan SIM A yang masih aktif dengan rekam jejak berkendara yang baik.\n• Memiliki kendaraan bermotor roda dua pribadi dalam kondisi prima dan surat-surat lengkap (STNK aktif).\n• Pengalaman minimal 1-2 tahun sebagai kurir ekspedisi, kurir dokumen korporasi, atau operasional logistik.\n• Menguasai rute jalan raya dan jalur alternatif di wilayah Jakarta dan sekitarnya (Jabodetabek).\n• Disiplin, jujur, teliti, bertanggung jawab tinggi terhadap ketepatan waktu pengiriman barang.	Jakarta & Jabodetabek	full_time	65	t	11111111-0000-0000-0000-000000000001	2026-08-19 06:57:29.010915+00	\N
74afa387-64ad-48db-8763-84113a4adb85	Executive Corporate Driver (Pengemudi Direksi)	executive-corporate-driver	Mencari Pengemudi Eksekutif profesional untuk melayani mobilitas jajaran Direksi dan tamu VIP perusahaan dengan standar keselamatan tertinggi, kesopanan, dan kenyamanan berkendara.	• Pendidikan minimal SMA/SMK sederajat.\n• Memiliki SIM A atau SIM B1 aktif dengan rekam jejak bebas kecelakaan (zero accident).\n• Pengalaman minimal 3-5 tahun sebagai Pengemudi Direksi, VIP Driver, atau Pengemudi Eksekutif Perusahaan.\n• Memahami etika pelayanan VIP, berpenampilan rapi, bersih, sopan, dan menjaga privasi/kerahasiaan penumpang.\n• Mahir mengemudikan berbagai jenis kendaraan mobil mewah (Sedan, SUV, MPV kelas premium baik transmisi matic maupun manual).\n• Memahami pemeliharaan dan pengecekan rutin mesin, rem, oli, serta kebersihan interior kendaraan.	Jakarta Selatan (On-site)	full_time	70	t	11111111-0000-0000-0000-000000000001	2026-08-19 06:57:29.010915+00	\N
6a8c16a9-7270-475b-9076-d8dea21a77c9	Staff Administrasi & General Affair (GA)	staff-administrasi-general-affair	Bertanggung jawab atas pengelolaan dokumen administrasi kantor, pengadaan perlengkapan kerja (office supplies), koordinasi fasilitas gedung, dan surat-menyurat resmi perusahaan.	• Pendidikan minimal D3 / S1 Manajemen, Administrasi Bisnis, atau jurusan relevan.\n• Pengalaman kerja minimal 1-2 tahun di bidang Administrasi Kantor atau General Affair.\n• Mahir mengoperasikan Microsoft Office (Word, Excel tingkat menengah untuk pembuatan tabel & rumus dasar, PowerPoint).\n• Memiliki kemampuan komunikasi yang baik, teliti dalam pengarsipan berkas (filing system), dan terorganisir.\n• Mampu berkoordinasi dengan vendor penyedia layanan operasional kantor (ATK, kebersihan, pemeliharaan AC/gedung).	Surabaya (On-site)	full_time	70	t	11111111-0000-0000-0000-000000000001	2026-08-19 06:57:29.010915+00	\N
d95052bb-b558-42d0-aaac-6b2b763b9ce3	Senior Flutter Developer	senior-flutter-developer	Kami mencari Senior Flutter Developer berpengalaman untuk memimpin pengembangan aplikasi mobile multiplatform skala besar dengan arsitektur clean dan state management modern (Bloc / Riverpod).	- Pengalaman minimal 3 tahun dengan Flutter & Dart\n- Menguasai State Management (Bloc / Riverpod / Provider)\n- Memahami arsitektur Clean Code, SOLID principles, dan Modular Architecture\n- Pengalaman integrasi REST API, WebSocket, dan Offline-first DB (Hive/Isar/SQLite)\n- Terbiasa dengan CI/CD deployment ke Google Play Store & Apple App Store\n- Memiliki portofolio aplikasi yang sudah dipublikasikan di store	Jakarta (Hybrid)	Full-Time	75	t	11111111-0000-0000-0000-000000000001	2026-08-21 09:05:31.466255+00	\N
\.


--
-- Data for Name: langchain_pg_collection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.langchain_pg_collection (name, cmetadata, uuid) FROM stdin;
cv_vectors	null	5ece4092-250a-4d78-b41f-c2cbb2be95f8
\.


--
-- Data for Name: langchain_pg_embedding; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.langchain_pg_embedding (collection_id, embedding, document, cmetadata, custom_id, uuid) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, user_id, full_name, role, created_at) FROM stdin;
11111111-0000-0000-0000-000000000001	a0000000-0000-0000-0000-000000000001	HR Manager & Recruiter	admin	2026-09-01 13:18:30.532972+00
11111111-0000-0000-0000-000000000002	c0000000-0000-0000-0000-000000000001	Budi Santoso, S.Kom	candidate	2026-09-01 13:18:30.532972+00
11111111-0000-0000-0000-000000000003	c0000000-0000-0000-0000-000000000002	Siti Rahmawati, S.Psi	candidate	2026-09-01 13:18:30.532972+00
11111111-0000-0000-0000-000000000004	c0000000-0000-0000-0000-000000000003	Dimas Aditya Pratama	candidate	2026-09-01 13:18:30.532972+00
\.


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: cv_vectors cv_vectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cv_vectors
    ADD CONSTRAINT cv_vectors_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_slug_key UNIQUE (slug);


--
-- Name: langchain_pg_collection langchain_pg_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.langchain_pg_collection
    ADD CONSTRAINT langchain_pg_collection_pkey PRIMARY KEY (uuid);


--
-- Name: langchain_pg_embedding langchain_pg_embedding_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.langchain_pg_embedding
    ADD CONSTRAINT langchain_pg_embedding_pkey PRIMARY KEY (uuid);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: applications unique_candidate_job; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT unique_candidate_job UNIQUE (candidate_id, job_id);


--
-- Name: cv_vectors_embedding_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cv_vectors_embedding_idx ON public.cv_vectors USING ivfflat (embedding) WITH (lists='100');


--
-- Name: idx_applications_candidate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_candidate_id ON public.applications USING btree (candidate_id);


--
-- Name: idx_applications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_created_at ON public.applications USING btree (created_at DESC);


--
-- Name: idx_applications_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_job_id ON public.applications USING btree (job_id);


--
-- Name: idx_applications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_status ON public.applications USING btree (status);


--
-- Name: idx_jobs_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_created_by ON public.jobs USING btree (created_by);


--
-- Name: idx_jobs_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_is_active ON public.jobs USING btree (is_active);


--
-- Name: idx_jobs_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_slug ON public.jobs USING btree (slug);


--
-- Name: applications applications_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: langchain_pg_embedding langchain_pg_embedding_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.langchain_pg_embedding
    ADD CONSTRAINT langchain_pg_embedding_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.langchain_pg_collection(uuid) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: jobs Admin can delete jobs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can delete jobs" ON public.jobs FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: jobs Admin can insert jobs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: applications Admin can update applications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can update applications" ON public.applications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: jobs Admin can update jobs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can update jobs" ON public.jobs FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: applications Admin can view all applications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can view all applications" ON public.applications FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: jobs Admin can view all jobs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can view all jobs" ON public.jobs FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: profiles Admin can view all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: applications Candidate can insert own application; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Candidate can insert own application" ON public.applications FOR INSERT TO authenticated WITH CHECK ((candidate_id = public.get_my_profile_id()));


--
-- Name: applications Candidate can update own application; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Candidate can update own application" ON public.applications FOR UPDATE TO authenticated USING ((candidate_id = public.get_my_profile_id())) WITH CHECK ((candidate_id = public.get_my_profile_id()));


--
-- Name: applications Candidate can view own applications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Candidate can view own applications" ON public.applications FOR SELECT TO authenticated USING ((candidate_id = public.get_my_profile_id()));


--
-- Name: profiles Candidate can view own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Candidate can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: jobs Public can view active jobs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can view active jobs" ON public.jobs FOR SELECT TO authenticated, anon USING ((is_active = true));


--
-- Name: profiles User can insert own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "User can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: profiles User can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "User can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: applications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

--
-- Name: cv_vectors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cv_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: jobs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION get_my_profile_id(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_my_profile_id() TO service_role;
GRANT ALL ON FUNCTION public.get_my_profile_id() TO authenticated;
GRANT ALL ON FUNCTION public.get_my_profile_id() TO anon;


--
-- Name: FUNCTION is_admin(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_admin() TO service_role;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin() TO anon;


--
-- Name: TABLE applications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.applications TO anon;
GRANT ALL ON TABLE public.applications TO authenticated;
GRANT ALL ON TABLE public.applications TO service_role;


--
-- Name: TABLE cv_vectors; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cv_vectors TO anon;
GRANT ALL ON TABLE public.cv_vectors TO authenticated;
GRANT ALL ON TABLE public.cv_vectors TO service_role;


--
-- Name: TABLE jobs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.jobs TO anon;
GRANT ALL ON TABLE public.jobs TO authenticated;
GRANT ALL ON TABLE public.jobs TO service_role;


--
-- Name: TABLE langchain_pg_collection; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.langchain_pg_collection TO anon;
GRANT ALL ON TABLE public.langchain_pg_collection TO authenticated;
GRANT ALL ON TABLE public.langchain_pg_collection TO service_role;


--
-- Name: TABLE langchain_pg_embedding; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.langchain_pg_embedding TO anon;
GRANT ALL ON TABLE public.langchain_pg_embedding TO authenticated;
GRANT ALL ON TABLE public.langchain_pg_embedding TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict skXPwlekDHjRfK4xSuSPhS7Om5ta7TfcSiDYDQnW2XUWcquGW9pNFMREOxAt1G6

