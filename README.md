# ChemSITE — Private IIT-JAM Chemistry Study Platform (Version 1)

A private, focused study portal built for one student preparing for **IIT-JAM Chemistry 2028**, guided by one mentor/admin.

---

## 1. System Architecture

- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (calm academic focus aesthetic)
- **Backend & Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth (Private invitation only, no public sign-up)
- **Storage:** Supabase Storage (`study_materials` private bucket) with expiring signed URLs
- **Access Control:** PostgreSQL Row Level Security (RLS) enforcing strict role segregation (`admin` vs `student`)

---

## 2. Security & Access Model

- **No Public Sign-up:** The auth flow only accepts provisioned accounts.
- **Service Role Protection:** No server-side secrets or `service_role` keys are ever exposed to the client. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used.
- **Database RLS Policies:**
  - `units` & `topics`: Read-only for student; full control for admin.
  - `study_schedules`: Read-only for student; full control for admin.
  - `topic_completions`: Student can only insert/delete their own completion records.
  - `resources` & `topic_resources`: Read-only for student; full control for admin.
  - `syllabus_documents`: Read-only for student; upload/activation for admin.
- **Private Storage:** Files in `study_materials` cannot be read via public links. The client requests expiring signed URLs (1 hour validity) checked against user authorization.

---

## 3. Step-by-Step Supabase Setup

### Step 3.1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com/) and create a new project (e.g. `chemsite-iitjam`).
2. Note your **Project URL** and **anon / public key** from **Project Settings → API**.

### Step 3.2: Run the Database Migrations
1. Open the **SQL Editor** in your Supabase dashboard.
2. Open [`supabase/schema.sql`](file:///d:/ChemSITE/supabase/schema.sql) from this repository.
3. Copy and paste the entire script into the SQL Editor and click **Run**.
4. This script creates:
   - Types: `user_role` and `resource_type_enum`
   - Tables: `profiles`, `units`, `topics`, `study_schedules`, `topic_completions`, `resources`, `topic_resources`, `syllabus_documents`
   - Security functions: `is_admin()`, `is_authorized_user()`
   - All RLS policies on tables
   - Storage bucket: `study_materials` (private) and storage RLS policies
   - Auto-provisioning trigger: `on_auth_user_created`

### Step 3.3: Provision the Admin and Student Accounts
Under **Authentication → Users** in your Supabase Dashboard:
1. Click **Add User** → **Create User**.
2. **Admin Account:**
   - Email: `admin@yourdomain.com` (or your chosen email)
   - Password: Choose a strong password
   - Auto-confirm user: **Checked**
3. **Student Account:**
   - Email: `student@yourdomain.com` (your friend's email)
   - Password: Choose a strong password
   - Auto-confirm user: **Checked**
4. Update their roles in the **Table Editor → profiles**:
   - For the Admin user, change `role` to `'admin'`.
   - For the Student user, verify `role` is `'student'`.

---

## 4. Local Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

*Note: If `.env` is not configured, ChemSITE operates in an offline demonstration mode with interactive local storage, allowing instant verification of all workflows.*

---

## 5. Development and Building

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Run TypeScript verification and production bundle build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

---

## 6. Core Features in Version 1

- **Student Dashboard:**
  - Welcome banner with student name.
  - Today's assigned topics with individual completion checkboxes.
  - Overall progress indicators: total topics, completed topics, remaining topics.
  - Tabs for Today, Upcoming, and Past & Revision topics.
  - Topic popup to view attached study materials (videos, notes, DPPs, PYQs).
- **Curriculum & Topic Library:**
  - Hierarchical structure: Subject → Unit → Topic → Resources.
  - Search filter across units and topics.
  - Official syllabus PDF card with embedded reader.
- **Admin Management Panel:**
  - **Syllabus Manager:** Upload or replace the official syllabus PDF.
  - **Units Management:** Add, edit, reorder, and delete units.
  - **Topics Management:** Add, edit, reorder, and delete topics safely under units.
  - **Daily Planner:** Assign existing topics to calendar dates with custom guidance notes.
  - **Resource Library:** Upload PDFs or link external lecture videos; associate one resource with multiple topics without re-uploading.
  - **Student Progress Overview:** Track completed topics vs pending topics unit-by-unit.
