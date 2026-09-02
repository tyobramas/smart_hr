


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";

CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "public";

ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."get_my_profile_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT id
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;


ALTER FUNCTION "public"."get_my_profile_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE user_id = auth.uid()
          AND role = 'admin'
    );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "job_id" "uuid" NOT NULL,
    "cv_storage_path" "text" NOT NULL,
    "cv_parsed_name" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "cv_score" numeric,
    "cv_analysis_json" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "personality_result_json" "jsonb",
    "personality_completed_at" timestamp with time zone,
    "interview_deadline" timestamp with time zone,
    "interview_started_at" timestamp with time zone,
    "interview_completed_at" timestamp with time zone,
    "interview_duration_seconds" integer DEFAULT 0,
    "interview_transcript_json" "jsonb",
    CONSTRAINT "applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'screened'::"text", 'rejected'::"text", 'invited_interview'::"text", 'interview_in_progress'::"text", 'interview_completed'::"text", 'withdrawn_expired'::"text"])))
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cv_vectors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "job_id" "uuid",
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(1536) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cv_vectors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "requirements" "text" NOT NULL,
    "location" "text" NOT NULL,
    "employment_type" "text" NOT NULL,
    "min_score_threshold" numeric DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."langchain_pg_collection" (
    "name" character varying,
    "cmetadata" json,
    "uuid" "uuid" NOT NULL
);


ALTER TABLE "public"."langchain_pg_collection" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."langchain_pg_embedding" (
    "collection_id" "uuid",
    "embedding" "public"."vector",
    "document" character varying,
    "cmetadata" json,
    "custom_id" character varying,
    "uuid" "uuid" NOT NULL
);


ALTER TABLE "public"."langchain_pg_embedding" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'candidate'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cv_vectors"
    ADD CONSTRAINT "cv_vectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."langchain_pg_collection"
    ADD CONSTRAINT "langchain_pg_collection_pkey" PRIMARY KEY ("uuid");



ALTER TABLE ONLY "public"."langchain_pg_embedding"
    ADD CONSTRAINT "langchain_pg_embedding_pkey" PRIMARY KEY ("uuid");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "unique_candidate_job" UNIQUE ("candidate_id", "job_id");



CREATE INDEX "cv_vectors_embedding_idx" ON "public"."cv_vectors" USING "ivfflat" ("embedding") WITH ("lists"='100');



CREATE INDEX "idx_applications_candidate_id" ON "public"."applications" USING "btree" ("candidate_id");



CREATE INDEX "idx_applications_created_at" ON "public"."applications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_applications_job_id" ON "public"."applications" USING "btree" ("job_id");



CREATE INDEX "idx_applications_status" ON "public"."applications" USING "btree" ("status");



CREATE INDEX "idx_jobs_created_by" ON "public"."jobs" USING "btree" ("created_by");



CREATE INDEX "idx_jobs_is_active" ON "public"."jobs" USING "btree" ("is_active");



CREATE INDEX "idx_jobs_slug" ON "public"."jobs" USING "btree" ("slug");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."langchain_pg_embedding"
    ADD CONSTRAINT "langchain_pg_embedding_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."langchain_pg_collection"("uuid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can delete jobs" ON "public"."jobs" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can insert jobs" ON "public"."jobs" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin can update applications" ON "public"."applications" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin can update jobs" ON "public"."jobs" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin can view all applications" ON "public"."applications" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can view all jobs" ON "public"."jobs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Candidate can insert own application" ON "public"."applications" FOR INSERT TO "authenticated" WITH CHECK (("candidate_id" = "public"."get_my_profile_id"()));



CREATE POLICY "Candidate can update own application" ON "public"."applications" FOR UPDATE TO "authenticated" USING (("candidate_id" = "public"."get_my_profile_id"())) WITH CHECK (("candidate_id" = "public"."get_my_profile_id"()));



CREATE POLICY "Candidate can view own applications" ON "public"."applications" FOR SELECT TO "authenticated" USING (("candidate_id" = "public"."get_my_profile_id"()));



CREATE POLICY "Candidate can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Public can view active jobs" ON "public"."jobs" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "User can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "User can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cv_vectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_profile_id"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_my_profile_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_profile_id"() TO "anon";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."cv_vectors" TO "anon";
GRANT ALL ON TABLE "public"."cv_vectors" TO "authenticated";
GRANT ALL ON TABLE "public"."cv_vectors" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."langchain_pg_collection" TO "anon";
GRANT ALL ON TABLE "public"."langchain_pg_collection" TO "authenticated";
GRANT ALL ON TABLE "public"."langchain_pg_collection" TO "service_role";



GRANT ALL ON TABLE "public"."langchain_pg_embedding" TO "anon";
GRANT ALL ON TABLE "public"."langchain_pg_embedding" TO "authenticated";
GRANT ALL ON TABLE "public"."langchain_pg_embedding" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







