## 2026-01-30 - Critical Client-Side Secret Exposure
**Vulnerability:** The `VITE_SUPABASE_SERVICE_KEY` and `VITE_ADMIN_PASSWORD` are exposed in the client-side bundle.
**Learning:** These keys are used in `src/lib/supabase.ts` and `src/components/GamesMinutesManager.tsx` respectively. Since this is a client-side Vite application, any variable prefixed with `VITE_` is bundled and visible to anyone inspecting the code. The Service Key allows bypassing Row Level Security (RLS), granting full administrative access to the database. The Admin Password, while less critical if RLS was working, is also exposed, bypassing the intended UI restrictions.
**Prevention:**
1. Never expose Service Keys (role: `service_role`) to the client. Use them only in server-side environments (Supabase Edge Functions, Netlify Functions, or a backend server).
2. Use Supabase Auth for user authentication instead of a shared hardcoded password.
3. If a shared password is absolutely necessary (not recommended), verify it on the server side (e.g., via a Function) and return a session token, rather than comparing it in the browser.

## 2026-05-20 - RLS Bypass via Edge Function for Admin Writes
**Vulnerability:** The `video_projects` table was publicly writable (INSERT/UPDATE) due to permissive RLS policies, allowing any anonymous user to modify data.
**Learning:** In a client-side Supabase app without user authentication (using only shared secrets), you cannot effectively restrict writes using RLS if the client only has the anon key.
**Prevention:**
1. Revoke public write access in RLS policies.
2. Implement an Edge Function that accepts the shared secret (password), validates it server-side, and uses the Service Role key to bypass RLS for the write operation.
3. Update client services to route restricted operations through this Edge Function.
