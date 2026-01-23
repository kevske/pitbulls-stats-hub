## 2025-02-18 - Exposed Service Role Key

**Vulnerability:** The Supabase Service Role Key was being imported via `VITE_SUPABASE_SERVICE_KEY` and used to create an admin client in `src/lib/supabase.ts`. This exposed the key (which bypasses RLS) to the client-side bundle, allowing anyone with the key to have full administrative access to the database.

**Learning:** Prefixing environment variables with `VITE_` automatically exposes them to the client. Service keys must NEVER be prefixed with `VITE_` or used in client-side code.

**Prevention:** Ensure that sensitive keys (like service role keys) are only accessed in server-side environments (e.g., Supabase Edge Functions, Node.js scripts) and never imported in client-side React code. Use RLS policies to handle authorization instead of bypassing it on the client.
