-- =================================================================
-- master.sql (Complete Version)
-- Defines the COMPLETE database schema for the KnowledgeLink application.
-- Version: 2.0.0
-- =================================================================

-- Step 1: Drop existing objects to ensure a clean slate (SAFE CLEANUP)
-- (This is safe to run on a new database)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.commitments CASCADE;
DROP TABLE IF EXISTS public.profile_skills CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.skill_type CASCADE;
DROP TYPE IF EXISTS public.commitment_status CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.find_or_create_skill(TEXT) CASCADE;

---

-- Step 2: Create custom types
CREATE TYPE public.skill_type AS ENUM ('TEACHABLE', 'LEARNABLE');
CREATE TYPE public.commitment_status AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED');

---

-- Step 3: Create tables

-- profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- skills
CREATE TABLE public.skills (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- profile_skills
CREATE TABLE public.profile_skills (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    type skill_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(profile_id, skill_id, type)
);

-- commitments
CREATE TABLE public.commitments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status commitment_status NOT NULL DEFAULT 'PENDING',
    goal TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_different_users CHECK (requester_id <> addressee_id)
);

-- reviews
CREATE TABLE public.reviews (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    commitment_id BIGINT NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(commitment_id, reviewer_id)
);

-- messages
CREATE TABLE public.messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    commitment_id BIGINT NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

---

-- Step 4: Set up Row Level Security (RLS)

-- profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- skills RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view skills" ON public.skills FOR SELECT USING (true);

-- profile_skills RLS
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view profile_skills" ON public.profile_skills FOR SELECT USING (true);
CREATE POLICY "Allow users to manage their own skills" ON public.profile_skills FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- commitments RLS
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view their own commitments" ON public.commitments FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Allow users to create commitments" ON public.commitments FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Allow addressees to update commitment status" ON public.commitments FOR UPDATE USING (auth.uid() = addressee_id) WITH CHECK (auth.uid() = addressee_id);

-- reviews RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow users to insert reviews for their commitments" ON public.reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.commitments c WHERE c.id = reviews.commitment_id AND (c.requester_id = auth.uid() OR c.addressee_id = auth.uid())));

-- messages RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view messages in their commitments" ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.commitments c WHERE c.id = messages.commitment_id AND (c.requester_id = auth.uid() OR c.addressee_id = auth.uid())));
CREATE POLICY "Allow users to send messages in their active commitments" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.commitments c WHERE c.id = messages.commitment_id AND c.status = 'ACTIVE' AND (c.requester_id = auth.uid() OR c.addressee_id = auth.uid())));

---

-- Step 5: Create functions and triggers

-- handle_new_user function and trigger (for auto-creating profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (new.id, new.raw_user_meta_data->>'username');
    RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- find_or_create_skill function (for RPC)
CREATE OR REPLACE FUNCTION public.find_or_create_skill(skill_name TEXT)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    skill_id BIGINT;
BEGIN
    SELECT id INTO skill_id FROM public.skills WHERE lower(trim(name)) = lower(trim(skill_name));
    IF skill_id IS NULL THEN
        INSERT INTO public.skills (name) VALUES (trim(skill_name)) RETURNING id INTO skill_id;
    END IF;
    RETURN skill_id;
END;
$$;

---

-- Step 6: Set up realtime publications
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- =================================================================
-- End of master.sql
-- =================================================================