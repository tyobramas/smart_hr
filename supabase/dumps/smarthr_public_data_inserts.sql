--
-- PostgreSQL database dump
--

\restrict yQyyqYEvGsOtqbKdGvxgMVoFUbTGLOLbOlxLDE6NGovUnm8IywajzEzzQZ5Ke5W

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

--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.profiles (id, user_id, full_name, role, created_at) VALUES ('11111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'HR Manager & Recruiter', 'admin', '2026-09-01 13:18:30.532972+00');
INSERT INTO public.profiles (id, user_id, full_name, role, created_at) VALUES ('11111111-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Budi Santoso, S.Kom', 'candidate', '2026-09-01 13:18:30.532972+00');
INSERT INTO public.profiles (id, user_id, full_name, role, created_at) VALUES ('11111111-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Siti Rahmawati, S.Psi', 'candidate', '2026-09-01 13:18:30.532972+00');
INSERT INTO public.profiles (id, user_id, full_name, role, created_at) VALUES ('11111111-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'Dimas Aditya Pratama', 'candidate', '2026-09-01 13:18:30.532972+00');


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.jobs (id, title, slug, description, requirements, location, employment_type, min_score_threshold, is_active, created_by, created_at, interview_blueprints_json) VALUES ('22222222-0000-0000-0000-000000000001', 'Senior Full-Stack Engineer (Next.js + Postgres)', 'senior-fullstack-engineer', 'Kami mencari Senior Full-Stack Engineer berpengalaman untuk memimpin pengembangan platform SmartHR. Anda akan merancang arsitektur web modern, mengintegrasikan sistem LLM RAG, dan mengelola database relasional berskala besar.', '- Minimal 4 tahun pengalaman menggunakan Next.js App Router, React, dan TypeScript.
- Mahir PostgreSQL, relasi database, indexing, dan Row Level Security (RLS).
- Pengalaman dengan Docker, cloud deployment, dan REST/GraphQL APIs.
- Nilai tambah jika memiliki pengalaman integrasi model AI/LLM.', 'Jakarta (Hybrid)', 'Full-time', 75, true, '11111111-0000-0000-0000-000000000001', '2026-09-01 13:18:30.532972+00', NULL);
INSERT INTO public.jobs (id, title, slug, description, requirements, location, employment_type, min_score_threshold, is_active, created_by, created_at, interview_blueprints_json) VALUES ('22222222-0000-0000-0000-000000000002', 'Talent Acquisition & HR Specialist', 'talent-acquisition-hr-specialist', 'Bertanggung jawab atas seluruh proses siklus rekrutmen talenta teknologi, mulai dari sourcing, screening profil kandidat dengan bantuan sistem AI, wawancara HR, hingga proses offering.', '- Pengalaman minimal 2 tahun sebagai Tech Recruiter / HR Generalist.
- Memahami alur sourcing kandidat IT dan platform talent job boards.
- Kemampuan komunikasi interpersonal yang luar biasa dan negosiasi.
- Terbiasa menggunakan HRIS / ATS.', 'Jakarta Selatan (On-site)', 'Full-time', 70, true, '11111111-0000-0000-0000-000000000001', '2026-09-01 13:18:30.532972+00', NULL);
INSERT INTO public.jobs (id, title, slug, description, requirements, location, employment_type, min_score_threshold, is_active, created_by, created_at, interview_blueprints_json) VALUES ('22222222-0000-0000-0000-000000000003', 'DevOps & Cloud Platform Engineer', 'devops-cloud-platform-engineer', 'Mengelola infrastruktur cloud, automated CI/CD pipeline, monitoring sistem 24/7, dan memastikan availability serta keamanan database production.', '- Mahir Linux system administration, Docker containerization, dan Kubernetes.
- Pengalaman mengelola AWS / GCP infrastructure.
- Pengalaman dengan database clustering, automated backup, dan security hardening.', 'Remote (Indonesia)', 'Remote', 80, true, '11111111-0000-0000-0000-000000000001', '2026-09-01 13:18:30.532972+00', NULL);
INSERT INTO public.jobs (id, title, slug, description, requirements, location, employment_type, min_score_threshold, is_active, created_by, created_at, interview_blueprints_json) VALUES ('8744e4de-cdd9-441f-bd69-8ab706cb2554', 'Senior Corporate Tax & Accounting Specialist', 'senior-tax-accounting-specialist', 'Kami mencari Senior Corporate Tax & Accounting Specialist berpengalaman untuk mengelola kepatuhan pajak perusahaan, rekonsiliasi fiskal tahunan, perencanaan pajak strategis, serta pelaporan SPT Masa dan Tahunan secara akurat sesuai regulasi perpajakan Indonesia.', '• Pendidikan minimal S1 Akuntansi atau Perpajakan.
• Pengalaman kerja minimal 3-5 tahun dalam bidang perpajakan dan akuntansi korporasi.
• Memiliki Sertifikat Brevet Pajak A, B (Brevet C menjadi nilai tambah).
• Menguasai regulasi perpajakan Indonesia: PPh 21/26, PPh 23, PPh 4 ayat 2, PPh Badan Pasal 25/29, serta PPN e-Faktur.
• Mahir menggunakan aplikasi perpajakan resmi: e-Faktur Pajak, e-Bupot Unifikasi, e-SPT, dan DJP Online.
• Berpengalaman dengan software akuntansi / ERP seperti SAP FICO, Accurate, atau Jurnal by Mekari.
• Memiliki rekam jejak mendampingi pemeriksaan dan audit pajak korporasi.', 'Jakarta Pusat (On-site)', 'full_time', 75, true, '11111111-0000-0000-0000-000000000001', '2026-08-19 06:57:29.010915+00', NULL);
INSERT INTO public.jobs (id, title, slug, description, requirements, location, employment_type, min_score_threshold, is_active, created_by, created_at, interview_blueprints_json) VALUES ('bc0ece76-be65-4728-bafe-d9017b8e8bab', 'Kurir & Logistik Delivery Eksekutif (B2B)', 'kurir-logistik-delivery-eksekutif', 'Bertanggung jawab atas pengiriman dokumen penting dan paket barang bisnis (B2B) antar kantor klien di area Jabodetabek secara tepat waktu, aman, dan menjaga kerahasiaan dokumen perusahaan.', '• Pendidikan minimal SMA/SMK sederajat.
• Memiliki SIM C dan SIM A yang masih aktif dengan rekam jejak berkendara yang baik.
• Memiliki kendaraan bermotor roda dua pribadi dalam kondisi prima dan surat-surat lengkap (STNK aktif).
• Pengalaman minimal 1-2 tahun sebagai kurir ekspedisi, kurir dokumen korporasi, atau operasional logistik.
• Menguasai rute jalan raya dan jalur alternatif di wilayah Jakarta dan sekitarnya (Jabodetabek).
• Disiplin, jujur, teliti, bertanggung jawab tinggi terhadap ketepatan waktu pengiriman barang.', 'Jakarta & Jabodetabek', 'full_time', 65, true, '11111111-0000-0000-0000-000000000001', '2026-08-19 06:57:29.010915+00', NULL);
INSERT INTO public.jobs (id, title, slug, description, requirements, location, employment_type, min_score_threshold, is_active, created_by, created_at, interview_blueprints_json) VALUES ('74afa387-64ad-48db-8763-84113a4adb85', 'Executive Corporate Driver (Pengemudi Direksi)', 'executive-corporate-driver', 'Mencari Pengemudi Eksekutif profesional untuk melayani mobilitas jajaran Direksi dan tamu VIP perusahaan dengan standar keselamatan tertinggi, kesopanan, dan kenyamanan berkendara.', '• Pendidikan minimal SMA/SMK sederajat.
• Memiliki SIM A atau SIM B1 aktif dengan rekam jejak bebas kecelakaan (zero accident).
• Pengalaman minimal 3-5 tahun sebagai Pengemudi Direksi, VIP Driver, atau Pengemudi Eksekutif Perusahaan.
• Memahami etika pelayanan VIP, berpenampilan rapi, bersih, sopan, dan menjaga privasi/kerahasiaan penumpang.
• Mahir mengemudikan berbagai jenis kendaraan mobil mewah (Sedan, SUV, MPV kelas premium baik transmisi matic maupun manual).
• Memahami pemeliharaan dan pengecekan rutin mesin, rem, oli, serta kebersihan interior kendaraan.', 'Jakarta Selatan (On-site)', 'full_time', 70, true, '11111111-0000-0000-0000-000000000001', '2026-08-19 06:57:29.010915+00', NULL);
INSERT INTO public.jobs (id, title, slug, description, requirements, location, employment_type, min_score_threshold, is_active, created_by, created_at, interview_blueprints_json) VALUES ('6a8c16a9-7270-475b-9076-d8dea21a77c9', 'Staff Administrasi & General Affair (GA)', 'staff-administrasi-general-affair', 'Bertanggung jawab atas pengelolaan dokumen administrasi kantor, pengadaan perlengkapan kerja (office supplies), koordinasi fasilitas gedung, dan surat-menyurat resmi perusahaan.', '• Pendidikan minimal D3 / S1 Manajemen, Administrasi Bisnis, atau jurusan relevan.
• Pengalaman kerja minimal 1-2 tahun di bidang Administrasi Kantor atau General Affair.
• Mahir mengoperasikan Microsoft Office (Word, Excel tingkat menengah untuk pembuatan tabel & rumus dasar, PowerPoint).
• Memiliki kemampuan komunikasi yang baik, teliti dalam pengarsipan berkas (filing system), dan terorganisir.
• Mampu berkoordinasi dengan vendor penyedia layanan operasional kantor (ATK, kebersihan, pemeliharaan AC/gedung).', 'Surabaya (On-site)', 'full_time', 70, true, '11111111-0000-0000-0000-000000000001', '2026-08-19 06:57:29.010915+00', NULL);
INSERT INTO public.jobs (id, title, slug, description, requirements, location, employment_type, min_score_threshold, is_active, created_by, created_at, interview_blueprints_json) VALUES ('d95052bb-b558-42d0-aaac-6b2b763b9ce3', 'Senior Flutter Developer', 'senior-flutter-developer', 'Kami mencari Senior Flutter Developer berpengalaman untuk memimpin pengembangan aplikasi mobile multiplatform skala besar dengan arsitektur clean dan state management modern (Bloc / Riverpod).', '- Pengalaman minimal 3 tahun dengan Flutter & Dart
- Menguasai State Management (Bloc / Riverpod / Provider)
- Memahami arsitektur Clean Code, SOLID principles, dan Modular Architecture
- Pengalaman integrasi REST API, WebSocket, dan Offline-first DB (Hive/Isar/SQLite)
- Terbiasa dengan CI/CD deployment ke Google Play Store & Apple App Store
- Memiliki portofolio aplikasi yang sudah dipublikasikan di store', 'Jakarta (Hybrid)', 'Full-Time', 75, true, '11111111-0000-0000-0000-000000000001', '2026-08-21 09:05:31.466255+00', NULL);


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.applications (id, candidate_id, job_id, cv_storage_path, cv_parsed_name, status, cv_score, cv_analysis_json, created_at, personality_result_json, personality_completed_at, interview_deadline, interview_started_at, interview_completed_at, interview_duration_seconds, interview_transcript_json) VALUES ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'cvs/siti_rahmawati_hr_resume.pdf', 'Siti Rahmawati, S.Psi', 'invited_interview', 93.0, '{"recommendation": "Kandidat unggulan, telah dijadwalkan interview user.", "skills_matched": ["Tech Sourcing", "ATS Management", "Behavioral Interview", "Communication"], "experience_years": 3}', '2026-09-01 13:18:30.532972+00', NULL, NULL, NULL, NULL, NULL, 0, NULL);
INSERT INTO public.applications (id, candidate_id, job_id, cv_storage_path, cv_parsed_name, status, cv_score, cv_analysis_json, created_at, personality_result_json, personality_completed_at, interview_deadline, interview_started_at, interview_completed_at, interview_duration_seconds, interview_transcript_json) VALUES ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'cvs/dimas_aditya_resume.pdf', 'Dimas Aditya Pratama', 'pending', NULL, NULL, '2026-09-01 13:18:30.532972+00', NULL, NULL, NULL, NULL, NULL, 0, NULL);


--
-- Data for Name: cv_vectors; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: langchain_pg_collection; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.langchain_pg_collection (name, cmetadata, uuid) VALUES ('cv_vectors', 'null', '5ece4092-250a-4d78-b41f-c2cbb2be95f8');


--
-- Data for Name: langchain_pg_embedding; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- PostgreSQL database dump complete
--

\unrestrict yQyyqYEvGsOtqbKdGvxgMVoFUbTGLOLbOlxLDE6NGovUnm8IywajzEzzQZ5Ke5W

