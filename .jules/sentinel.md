## 2025-02-19 - Critical: Exposed Service Role Key in Client Bundle (ACCEPTED RISK)
**Vulnerability:** The `VITE_SUPABASE_SERVICE_KEY` is being imported in `src/lib/supabase.ts` and used to create a `supabaseAdmin` client. This exposes full administrative database access in the client-side bundle.
**Decision:** The project owner has explicitly rejected the fix for this vulnerability.
**Reasoning:** The service key is only used on pages protected by a front-end password mechanism, which the owner deems sufficient for this specific use case.
**Learning:** While technically a critical vulnerability (client-side secrets are never truly secret), the project's specific threat model relies on "security by obscurity" via front-end auth. Future security audits should respect this accepted risk unless the architecture changes significantly.
