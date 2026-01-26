## 2026-01-26 - Critical: Service Key Exposure in Client Bundle
**Vulnerability:** The Supabase Service Role Key (`VITE_SUPABASE_SERVICE_KEY`) was included in the client-side bundle via `import.meta.env`.
**Learning:** Variables prefixed with `VITE_` are embedded into the built application. Even if "protected" by a client-side password check, the key is accessible to anyone who inspects the source code or network traffic, granting full administrative access to the database (bypassing RLS).
**Prevention:** Never expose Service Role Keys in client-side code. Use Row Level Security (RLS) with the anonymous/public key, or proxy administrative actions through a secure backend (e.g., Supabase Edge Functions) where the Service Key is kept secret.
