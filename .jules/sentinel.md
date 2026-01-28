## 2025-05-27 - Client-Side Service Key Exposure
**Vulnerability:** The `src/lib/supabase.ts` file was importing `VITE_SUPABASE_SERVICE_KEY` and creating a `supabaseAdmin` client. In Vite applications, any environment variable prefixed with `VITE_` is statically replaced during the build process and included in the client-side bundle. This means the Service Role Key (which bypasses Row Level Security) would be publicly visible to anyone inspecting the application's source code or network traffic if the environment variable was set during build/dev.
**Learning:** Never import secrets in client-side code, even if intended for "server-side only" logic, because modern bundlers might include them if the file is part of the dependency graph. `src/` in a Vite app is entirely client-side.
**Prevention:**
1. Never prefix secrets with `VITE_`.
2. Do not use the Service Role Key in any code residing in `src/` for a client-side application.
3. Rely exclusively on Row Level Security (RLS) and the anonymous key for client-side operations.
