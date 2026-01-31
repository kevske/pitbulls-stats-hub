## 2024-05-23 - Admin Secrets Exposure in Client Bundle
**Vulnerability:** `VITE_SUPABASE_SERVICE_KEY` and `VITE_ADMIN_PASSWORD` are exposed in the client-side bundle.
**Learning:** Using `VITE_` prefix for sensitive secrets bundles them into the application code, making them readable by anyone. Security features relying on these are "security theater".
**Prevention:** Never prefix secrets with `VITE_` unless they are truly public (like `ANON_KEY`). Use server-side functions (Edge Functions) for privileged operations instead of client-side logic with service keys.
