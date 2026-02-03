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

## 2026-05-25 - Timing Attack in Edge Function Authentication
**Vulnerability:** Admin password validation used insecure string comparison (`!==`), allowing timing attacks to guess the password.
**Learning:** Even in server-side Edge Functions, standard string comparison terminates early on mismatch, leaking information about the valid password prefix.
**Prevention:** Use constant-time string comparison (e.g., manually implementing a loop that checks all characters or using `crypto.timingSafeEqual`) for all secret validations.

## 2026-06-15 - Plaintext Password Persistence in LocalStorage
**Vulnerability:** The admin password was stored in `localStorage` to allow implicit authentication for nested components (VideoEditor) and page refreshes.
**Learning:** `localStorage` is accessible to any script on the same origin, making the plaintext password vulnerable to XSS attacks. Convenience features like "remember me" or implicit session continuity should not rely on storing raw secrets in persistent client storage.
**Prevention:**
1. Store sensitive secrets only in memory (React State, Context).
2. Pass secrets explicitly between components using React Router state (`location.state`) or secure Context providers.
3. Accept that page refreshes will clear the secret (session end) as a security feature, not a bug, unless using proper session-based auth (e.g. Supabase Auth) with secure HTTP-only cookies.
