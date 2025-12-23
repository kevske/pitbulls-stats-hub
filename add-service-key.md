# Add Supabase Service Role Key

To fix the minutes save issue, you need to add the Supabase Service Role Key to your environment variables.

## Steps:

1. **Get your Service Role Key** from Supabase Dashboard:
   - Go to Project Settings → API
   - Copy the `service_role` key (NOT the `anon` key)

2. **Add to your environment variables**:
   
   **For development (.env file):**
   ```env
   VITE_SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```
   
   **For production:**
   - Add the same variable to your hosting platform's environment variables

3. **Restart your development server** after adding the key

## Security Note:
The service role key bypasses RLS and should be kept secure. It's only used for admin operations like updating minutes.

## Test:
After adding the key and restarting, try saving minutes again. The console should show:
- "Service role client created for admin operations"
- "Using service role client (bypasses RLS)"
- Successful updates with `dataLength: 1` instead of `dataLength: 0`
