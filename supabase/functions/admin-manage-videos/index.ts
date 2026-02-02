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
        const { action, payload, adminPassword } = await req.json()

        // Validate admin password server-side
        const expectedPassword = Deno.env.get('ADMIN_PASSWORD') || ''
        if (!secureCompare(adminPassword || '', expectedPassword)) {
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
        return new Response(
            JSON.stringify({ error: 'Server error', message: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function secureCompare(a: string, b: string): boolean {
    const encoder = new TextEncoder()
    const aBuf = encoder.encode(a)
    const bBuf = encoder.encode(b)

    if (aBuf.byteLength !== bBuf.byteLength) {
        return false
    }

    let result = 0
    for (let i = 0; i < aBuf.byteLength; i++) {
        result |= aBuf[i] ^ bBuf[i]
    }

    return result === 0
}
