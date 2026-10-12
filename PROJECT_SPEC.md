# IIT-JAM Chemistry Study Platform — Version 1 Specification

## 1. Project Objective & Architecture Overview
A private, single-student, single-admin IIT-JAM Chemistry study platform built for focused exam preparation.
- **Admin**: Manages syllabus, units, topics, schedules, external lecture links, and learning resource PDFs.
- **Student**: Checks daily study schedule, marks topics complete/incomplete, accesses linked syllabus and learning resources.
- **Strict Scope**: Single student, no public sign-up, no automated AI rescheduling, no video hosting, no timer/activity tracking.

## 2. Technology Stack
- **Frontend**: React 18 / 19 + Vite + TypeScript
- **Styling**: Tailwind CSS, Lucide React icons
- **State Management**: Simple React state, custom hooks, and Supabase client
- **Backend / DB / Auth / Storage**: Supabase (PostgreSQL, Supabase Auth, Supabase Storage with signed URLs, RLS security policies)
- **Deployment & Version Control**: Git / GitHub, Vercel / Netlify / Vite static build compatible

## 3. Database Schema Design (PostgreSQL)

```sql
-- Role type enum or check constraint
CREATE TYPE user_role AS ENUM ('admin', 'student');

-- Profiles / User Roles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units (Subject -> Unit)
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics (Unit -> Topic)
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Schedules (Calendar assignments)
CREATE TABLE study_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic Completions (Decoupled from schedule dates)
CREATE TABLE topic_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_topic_completion UNIQUE (topic_id, user_id)
);

-- Resources
CREATE TYPE resource_type AS ENUM (
    'lecture_video',
    'book',
    'notes',
    'dpp',
    'pyq',
    'test',
    'answer_key',
    'other'
);

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    resource_type resource_type NOT NULL,
    external_url TEXT,
    storage_path TEXT,
    file_name TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic Resources (Many-to-Many junction)
CREATE TABLE topic_resources (
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (topic_id, resource_id)
);

-- Syllabus Documents
CREATE TABLE syllabus_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'IIT-JAM Chemistry Syllabus',
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Storage Bucket:
- Name: `study_materials` (private)
- Files stored with paths like:
  - `syllabus/{filename}`
  - `resources/{uuid}_{filename}`
- Access via Supabase signed URLs (`createSignedUrl`) with expiring tokens (e.g. 60 minutes) for authorized users.

## 4. Implementation Steps
1. **Foundation**: Vite + React + TypeScript + Tailwind CSS setup. Supabase client setup with `.env` and `.env.example`.
2. **Database SQL Script**: Comprehensive SQL migration file including schema, RLS policies, trigger helpers, and test seed instructions.
3. **Auth & Routing**: Role-aware authentication context, Login view, route guards for Admin vs Student.
4. **Student Dashboard**: Daily plan (today, upcoming, past), manual completion toggle, syllabus viewer, topic resource browser.
5. **Admin Dashboard**:
   - Syllabus manager (upload/replace PDF)
   - Unit & Topic hierarchy manager (create, edit, reorder, delete)
   - Planner / Schedule manager (assign topic to dates)
   - Resource library & associations (upload PDFs, attach external video URLs, map to topics)
   - Student progress overview
6. **Validation & Verification**: Production build verification, type-safety checks, documentation.
