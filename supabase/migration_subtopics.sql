-- ==============================================================================
-- IIT-JAM Chemistry: Subtopics Table & Migration
-- ==============================================================================

-- 1. Create subtopics table
CREATE TABLE IF NOT EXISTS public.subtopics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subtopics_topic_order ON public.subtopics(topic_id, order_index ASC);

-- 2. Create subtopic completions table
CREATE TABLE IF NOT EXISTS public.subtopic_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subtopic_id UUID NOT NULL REFERENCES public.subtopics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_subtopic_completion UNIQUE (subtopic_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_subtopic_completions_user ON public.subtopic_completions(user_id, subtopic_id);

-- 3. Enable RLS
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopic_completions ENABLE ROW LEVEL SECURITY;

-- 4. Policies for subtopics
DROP POLICY IF EXISTS "Authorized users can read subtopics" ON public.subtopics;
CREATE POLICY "Authorized users can read subtopics"
    ON public.subtopics FOR SELECT
    USING (public.is_authorized_user());

DROP POLICY IF EXISTS "Admin full control on subtopics" ON public.subtopics;
CREATE POLICY "Admin full control on subtopics"
    ON public.subtopics FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Policies for subtopic completions
DROP POLICY IF EXISTS "Users can read own subtopic completions and admin reads all" ON public.subtopic_completions;
CREATE POLICY "Users can read own subtopic completions and admin reads all"
    ON public.subtopic_completions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can mark own subtopic complete" ON public.subtopic_completions;
CREATE POLICY "Users can mark own subtopic complete"
    ON public.subtopic_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can undo own subtopic complete" ON public.subtopic_completions;
CREATE POLICY "Users can undo own subtopic complete"
    ON public.subtopic_completions FOR DELETE
    USING (auth.uid() = user_id);
