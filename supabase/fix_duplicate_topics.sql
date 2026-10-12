-- ==============================================================================
-- ChemSITE — Fix Duplicate Topics & Units in Supabase
-- Run this script in the Supabase SQL Editor (Project → SQL Editor → New Query)
-- ==============================================================================
-- STEP 1: Show current duplicates so you can confirm the problem
-- ==============================================================================

-- Preview: duplicate topics by (unit_id, title)
SELECT
    t.title,
    u.title AS unit_title,
    COUNT(*) AS duplicate_count,
    array_agg(t.id ORDER BY t.created_at ASC) AS ids
FROM public.topics t
JOIN public.units u ON u.id = t.unit_id
GROUP BY t.title, u.title
HAVING COUNT(*) > 1
ORDER BY u.title, t.title;

-- ==============================================================================
-- STEP 2: Delete duplicate topics — keep the OLDEST copy (earliest created_at)
-- ==============================================================================

-- This CTE ranks duplicates per (unit_id, title) group by creation time.
-- rn = 1 means the oldest record; rn > 1 means extra copies to delete.
WITH ranked_topics AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY unit_id, title
            ORDER BY created_at ASC
        ) AS rn
    FROM public.topics
)
DELETE FROM public.topics
WHERE id IN (
    SELECT id FROM ranked_topics WHERE rn > 1
);

-- ==============================================================================
-- STEP 3: Similarly fix any duplicate units (by title)
-- ==============================================================================

WITH ranked_units AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY title
            ORDER BY created_at ASC
        ) AS rn
    FROM public.units
)
DELETE FROM public.units
WHERE id IN (
    SELECT id FROM ranked_units WHERE rn > 1
);

-- ==============================================================================
-- STEP 4: Add UNIQUE constraints to prevent this from happening again
-- ==============================================================================

-- Prevent duplicate topics within the same unit
ALTER TABLE public.topics
    DROP CONSTRAINT IF EXISTS uq_topics_unit_title;
ALTER TABLE public.topics
    ADD CONSTRAINT uq_topics_unit_title UNIQUE (unit_id, title);

-- Prevent duplicate unit titles
ALTER TABLE public.units
    DROP CONSTRAINT IF EXISTS uq_units_title;
ALTER TABLE public.units
    ADD CONSTRAINT uq_units_title UNIQUE (title);

-- ==============================================================================
-- STEP 5: Verify — should show 0 rows (no more duplicates)
-- ==============================================================================

SELECT
    t.title,
    u.title AS unit_title,
    COUNT(*) AS count
FROM public.topics t
JOIN public.units u ON u.id = t.unit_id
GROUP BY t.title, u.title
HAVING COUNT(*) > 1
ORDER BY u.title, t.title;

-- If this returns 0 rows, duplicates have been successfully removed.
-- ==============================================================================
