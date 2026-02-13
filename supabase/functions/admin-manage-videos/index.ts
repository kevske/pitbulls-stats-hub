// Supabase Edge Function for admin video management
// This keeps the service role key secure on the server-side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { action, payload, adminPassword } = body

        if (!action || typeof action !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Invalid Request', message: 'Action is required and must be a string' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!payload || typeof payload !== 'object') {
            return new Response(
                JSON.stringify({ error: 'Invalid Request', message: 'Payload is required and must be an object' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate payload content
        const { gameNumber, videoIndex, videoId, playlistId } = payload;

        // Validate gameNumber (alphanumeric, allow string or number)
        const gameNumberStr = String(gameNumber);
        if ((typeof gameNumber !== 'string' && typeof gameNumber !== 'number') || !/^[a-zA-Z0-9_-]+$/.test(gameNumberStr)) {
            return new Response(
                JSON.stringify({ error: 'Bad Request', message: 'Invalid gameNumber format' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate videoIndex (non-negative integer)
        if (typeof videoIndex !== 'number' || videoIndex < 0 || !Number.isInteger(videoIndex)) {
            return new Response(
                JSON.stringify({ error: 'Bad Request', message: 'Invalid videoIndex format' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate videoId (string, regex)
        // Allow empty string if playlistId is present (handled by logic), but if provided must be valid
        if (typeof videoId !== 'string' || (videoId.length > 0 && !/^[a-zA-Z0-9_-]{11}$/.test(videoId))) {
            return new Response(
                JSON.stringify({ error: 'Bad Request', message: 'Invalid videoId format' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate playlistId (optional, string, regex)
        if (playlistId && (typeof playlistId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(playlistId))) {
            return new Response(
                JSON.stringify({ error: 'Bad Request', message: 'Invalid playlistId format' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate admin password server-side
        const expectedPassword = Deno.env.get('ADMIN_PASSWORD')
        if (!expectedPassword) {
            console.error('Configuration error: ADMIN_PASSWORD environment variable is missing or empty')
            return new Response(
                JSON.stringify({ error: 'Configuration error', message: 'Server is not properly configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!adminPassword || !await secureCompare(adminPassword, expectedPassword)) {
            console.log('Auth failed: password mismatch')
            return new Response(
                JSON.stringify({ error: 'Unauthorized', message: 'Invalid admin password' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create admin client with service role key (server-side only)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase configuration')
            return new Response(
                JSON.stringify({ error: 'Configuration error', message: 'Server is not properly configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        if (action === 'add_video') {
            // payload: { gameNumber, videoIndex, videoId, playlistId, events, players, metadata, timestamp, lastModified, version }
            const { gameNumber, videoIndex, videoId, playlistId, events, players, metadata, timestamp, lastModified } = payload

            const dbPayload = {
                game_number: gameNumber.toString(),
                tsv_game_number: gameNumber,
                video_index: videoIndex,
                video_id: videoId,
                playlist_id: playlistId || null,
                data: { events, players, metadata },
                updated_at: lastModified || new Date().toISOString()
            }

            const { data: savedProject, error } = await supabaseAdmin
                .from('video_projects')
                .upsert(dbPayload, {
                    onConflict: 'tsv_game_number,video_index',
                    ignoreDuplicates: false
                })
                .select()
                .single()

            if (error) throw error

            return new Response(
                JSON.stringify({ success: true, id: savedProject.id }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        } else if (action === 'save_project') {
            // Same as add_video essentially, but conceptually different if we want to restrict fields
            // For now, reuse the payload logic
            const { gameNumber, videoIndex, videoId, playlistId, events, players, metadata, timestamp, lastModified } = payload

             const dbPayload = {
                game_number: gameNumber.toString(),
                tsv_game_number: gameNumber,
                video_index: videoIndex,
                video_id: videoId,
                playlist_id: playlistId || null,
                data: { events, players, metadata },
                updated_at: lastModified || new Date().toISOString()
            }

            const { data: savedProject, error } = await supabaseAdmin
                .from('video_projects')
                .upsert(dbPayload, {
                    onConflict: 'tsv_game_number,video_index',
                    ignoreDuplicates: false
                })
                .select()
                .single()

            if (error) throw error

            return new Response(
                JSON.stringify({ success: true, id: savedProject.id }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        } else {
             return new Response(
                JSON.stringify({ error: 'Invalid action', message: `Unknown action: ${action}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

    } catch (error) {
        console.error('Edge function error:', error)
        // Return a generic error message to prevent information leakage
        return new Response(
            JSON.stringify({ error: 'Server error', message: 'An internal error occurred' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

/**
 * Constant-time string comparison using SHA-256 hashing to prevent timing attacks.
 */
async function secureCompare(a: string, b: string): Promise<boolean> {
    const encoder = new TextEncoder()
    const aBuf = encoder.encode(a)
    const bBuf = encoder.encode(b)

    // Use SHA-256 to hash the inputs
    const aHash = await crypto.subtle.digest('SHA-256', aBuf)
    const bHash = await crypto.subtle.digest('SHA-256', bBuf)

    const aHashArr = new Uint8Array(aHash)
    const bHashArr = new Uint8Array(bHash)

    // Compare hashes in constant time
    let result = 0
    for (let i = 0; i < aHashArr.length; i++) {
        result |= aHashArr[i] ^ bHashArr[i]
    }

    return result === 0
}
