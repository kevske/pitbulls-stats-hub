# Sentinel Journal

## 2025-05-15 - Service Role Key Exposure
**Vulnerability:** The Supabase Service Role Key (`VITE_SUPABASE_SERVICE_KEY`) was accessible in the client-side bundle. This key bypasses Row Level Security (RLS), effectively granting full database access to any user.
**Learning:** Using `VITE_` prefix on environment variables automatically exposes them to the browser. Even if guarded by logic (like `if (isAdmin)`), the secret itself is present in the static JS files.
**Prevention:**
1. Never prefix secrets with `VITE_`, `NEXT_PUBLIC_`, etc.
2. Never initialize privileged clients (like `supabase-admin`) in frontend code.
3. Move privileged operations to server-side functions (Edge Functions, API routes) where secrets are safe.
