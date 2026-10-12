-- ==============================================================================
-- IIT-JAM Chemistry Study Platform — Supabase Schema & Security Migration
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & ROLES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_type_enum AS ENUM (
        'lecture_video',
        'book',
        'notes',
        'dpp',
        'pyq',
        'test',
        'answer_key',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. UNITS (Subject -> Unit)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TOPICS (Unit -> Topic)
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ordering & parent queries
CREATE INDEX IF NOT EXISTS idx_topics_unit_order ON public.topics(unit_id, order_index ASC);

-- 6. STUDY SCHEDULES (Calendar plan)
CREATE TABLE IF NOT EXISTS public.study_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_schedules_date ON public.study_schedules(scheduled_date ASC);
CREATE INDEX IF NOT EXISTS idx_study_schedules_topic ON public.study_schedules(topic_id);

-- 7. TOPIC COMPLETIONS (Decoupled from schedule dates)
CREATE TABLE IF NOT EXISTS public.topic_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_topic_completion UNIQUE (topic_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_completions_user_topic ON public.topic_completions(user_id, topic_id);

-- 8. RESOURCES
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    resource_type resource_type_enum NOT NULL,
    external_url TEXT,
    storage_path TEXT,
    file_name TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TOPIC RESOURCES (Many-to-Many Association)
CREATE TABLE IF NOT EXISTS public.topic_resources (
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (topic_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_topic_resources_topic ON public.topic_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_resources_resource ON public.topic_resources(resource_id);

-- 10. SYLLABUS DOCUMENTS
CREATE TABLE IF NOT EXISTS public.syllabus_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'IIT-JAM Chemistry Syllabus',
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. SECURITY & HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_authorized_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
    );
$$;

-- 12. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_documents ENABLE ROW LEVEL SECURITY;

-- 13. POLICIES: PROFILES
DROP POLICY IF EXISTS "Users can view own profile or Admin can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or Admin can view all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile name" ON public.profiles;
CREATE POLICY "Users can update own profile name"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 14. POLICIES: UNITS & TOPICS
DROP POLICY IF EXISTS "Authorized users can read units" ON public.units;
CREATE POLICY "Authorized users can read units"
    ON public.units FOR SELECT
    USING (public.is_authorized_user());

DROP POLICY IF EXISTS "Admin full control on units" ON public.units;
CREATE POLICY "Admin full control on units"
    ON public.units FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authorized users can read topics" ON public.topics;
CREATE POLICY "Authorized users can read topics"
    ON public.topics FOR SELECT
    USING (public.is_authorized_user());

DROP POLICY IF EXISTS "Admin full control on topics" ON public.topics;
CREATE POLICY "Admin full control on topics"
    ON public.topics FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 15. POLICIES: STUDY SCHEDULES
DROP POLICY IF EXISTS "Authorized users can view schedules" ON public.study_schedules;
CREATE POLICY "Authorized users can view schedules"
    ON public.study_schedules FOR SELECT
    USING (public.is_authorized_user());

DROP POLICY IF EXISTS "Admin full control on schedules" ON public.study_schedules;
CREATE POLICY "Admin full control on schedules"
    ON public.study_schedules FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 16. POLICIES: TOPIC COMPLETIONS
DROP POLICY IF EXISTS "Users can read own completions and admin reads all" ON public.topic_completions;
CREATE POLICY "Users can read own completions and admin reads all"
    ON public.topic_completions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can mark own topic complete" ON public.topic_completions;
CREATE POLICY "Users can mark own topic complete"
    ON public.topic_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can undo own topic complete" ON public.topic_completions;
CREATE POLICY "Users can undo own topic complete"
    ON public.topic_completions FOR DELETE
    USING (auth.uid() = user_id);

-- 17. POLICIES: RESOURCES & TOPIC_RESOURCES
DROP POLICY IF EXISTS "Authorized users can read resources" ON public.resources;
CREATE POLICY "Authorized users can read resources"
    ON public.resources FOR SELECT
    USING (public.is_authorized_user());

DROP POLICY IF EXISTS "Admin full control on resources" ON public.resources;
CREATE POLICY "Admin full control on resources"
    ON public.resources FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authorized users can read topic_resources" ON public.topic_resources;
CREATE POLICY "Authorized users can read topic_resources"
    ON public.topic_resources FOR SELECT
    USING (public.is_authorized_user());

DROP POLICY IF EXISTS "Admin full control on topic_resources" ON public.topic_resources;
CREATE POLICY "Admin full control on topic_resources"
    ON public.topic_resources FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 18. POLICIES: SYLLABUS DOCUMENTS
DROP POLICY IF EXISTS "Authorized users can read syllabus" ON public.syllabus_documents;
CREATE POLICY "Authorized users can read syllabus"
    ON public.syllabus_documents FOR SELECT
    USING (public.is_authorized_user());

DROP POLICY IF EXISTS "Admin full control on syllabus" ON public.syllabus_documents;
CREATE POLICY "Admin full control on syllabus"
    ON public.syllabus_documents FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 19. AUTOMATIC USER PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
        new.id,
        new.email,
        COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'student'),
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 20. STORAGE BUCKET CREATION & POLICIES
-- Create the private bucket 'study_materials'
INSERT INTO storage.buckets (id, name, public)
VALUES ('study_materials', 'study_materials', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage RLS: Authorized users can download/read objects via signed URLs
DROP POLICY IF EXISTS "Authorized users can view files" ON storage.objects;
CREATE POLICY "Authorized users can view files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'study_materials' AND public.is_authorized_user());

-- Storage RLS: Admin can insert/upload files
DROP POLICY IF EXISTS "Admin can upload files" ON storage.objects;
CREATE POLICY "Admin can upload files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'study_materials' AND public.is_admin());

-- Storage RLS: Admin can update files
DROP POLICY IF EXISTS "Admin can update files" ON storage.objects;
CREATE POLICY "Admin can update files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'study_materials' AND public.is_admin());

-- Storage RLS: Admin can delete files
DROP POLICY IF EXISTS "Admin can delete files" ON storage.objects;
CREATE POLICY "Admin can delete files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'study_materials' AND public.is_admin());
