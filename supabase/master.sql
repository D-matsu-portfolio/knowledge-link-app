--
-- =============================================
-- master.sql
--
-- Description: Master SQL script for the KnowledgeLink application.
--              Defines the complete database schema.
-- Author:      Your Name/Gemini
-- Version:     1.0.0
-- Created:     2025-10-22
--
-- =============================================
--

-- ==== EXTENSIONS (if needed) ====
-- No extensions required for this initial schema.

---

-- ==== TABLES ====

-- ---------------------------------------------------------------------
-- Table: profiles
-- Description: Stores user profile information, linked to auth.users.
-- ---------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS (Row Level Security) Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles.
CREATE POLICY "Allow all users to view profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Policy: Users can insert their own profile.
CREATE POLICY "Allow users to insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile.
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

---

-- ---------------------------------------------------------------------
-- Table: skills
-- Description: Master list of all available skills.
-- ---------------------------------------------------------------------
CREATE TABLE public.skills (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Policy: All users can view all skills.
CREATE POLICY "Allow all users to view skills"
ON public.skills
FOR SELECT
USING (true);

-- Note: For simplicity, initially, only service_role can insert/update skills.
-- This can be changed later to allow users to add new skills.

---

-- ---------------------------------------------------------------------
-- Table: profile_skills
-- Description: Junction table linking profiles and skills.
--              Indicates whether a skill is teachable or learnable for a user.
-- ---------------------------------------------------------------------
CREATE TYPE public.skill_type AS ENUM ('TEACHABLE', 'LEARNABLE');

CREATE TABLE public.profile_skills (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    type skill_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(profile_id, skill_id, type) -- Ensures a user can't have the same skill type twice
);

-- RLS Policies for profile_skills
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;

-- Policy: All users can view all profile-skill links.
CREATE POLICY "Allow all users to view profile_skills"
ON public.profile_skills
FOR SELECT
USING (true);

-- Policy: Users can manage their own skill links.
CREATE POLICY "Allow users to manage their own skills"
ON public.profile_skills
FOR ALL -- Covers INSERT, UPDATE, DELETE
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

---

-- ---------------------------------------------------------------------
-- Table: commitments
-- Description: Stores partnership commitments between users.
-- ---------------------------------------------------------------------
CREATE TYPE public.commitment_status AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED');

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

-- RLS Policies for commitments
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view commitments they are part of.
CREATE POLICY "Allow users to view their own commitments"
ON public.commitments
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Policy: Users can create commitments.
CREATE POLICY "Allow users to create commitments"
ON public.commitments
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Policy: Addressees can update the status of a commitment (e.g., to accept/reject).
CREATE POLICY "Allow addressees to update commitment status"
ON public.commitments
FOR UPDATE
USING (auth.uid() = addressee_id)
WITH CHECK (auth.uid() = addressee_id);

---

-- ==== FUNCTIONS ====

-- ---------------------------------------------------------------------
-- Function: public.handle_new_user
-- Description: Automatically creates a profile for a new user upon registration.
-- Triggered by: A trigger on the auth.users table.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (new.id, new.raw_user_meta_data->>'username');
    RETURN new;
END;
$$;

-- Trigger for handle_new_user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

--
-- =============================================
-- End of master.sql
-- =============================================
--