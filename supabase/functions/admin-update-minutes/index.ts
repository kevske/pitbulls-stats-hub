// Supabase Edge Function for admin minutes updates
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
        const { gameNumber, playerSeconds, adminPassword } = await req.json()

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

        // Get game data to find the real game ID and TSV team ID
        const { data: gameData, error: gameError } = await supabaseAdmin
            .from('games')
            .select('game_id, game_date, home_team_name, away_team_name, home_team_id, away_team_id')
            .or(`game_id.eq.${gameNumber},tsv_game_number.eq.${gameNumber}`)
            .limit(1)
            .maybeSingle()

        if (gameError) {
            console.error('Error fetching game:', gameError)
            return new Response(
                JSON.stringify({ error: 'Database error', message: gameError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!gameData) {
            return new Response(
                JSON.stringify({ error: 'Not found', message: `Game ${gameNumber} not found` }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const realGameId = gameData.game_id
        const isTSVNeuenstadtHome = gameData.home_team_name?.toLowerCase().includes('neuenstadt')
        const tsvNeuenstadtTeamId = isTSVNeuenstadtHome ? gameData.home_team_id : gameData.away_team_id

        if (!tsvNeuenstadtTeamId) {
            return new Response(
                JSON.stringify({ error: 'Configuration error', message: 'Could not determine team ID' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Update each player's minutes
        const results = []
        for (const { playerId, seconds } of playerSeconds) {
            const decimalMinutes = Math.round((seconds / 60) * 100) / 100

            // Try updating by player_slug first
            const { data: updateData, error: updateError } = await supabaseAdmin
                .from('box_scores')
                .update({ minutes_played: decimalMinutes })
                .eq('game_id', realGameId)
                .eq('team_id', tsvNeuenstadtTeamId)
                .eq('player_slug', playerId)
                .select()

            if (updateError) {
                console.error(`Error updating player ${playerId}:`, updateError)
                results.push({ playerId, success: false, error: updateError.message })
                continue
            }

            if (!updateData || updateData.length === 0) {
                // Try update by name match
                const nameParts = playerId.split('-')
                const derivedFirstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Unknown'
                const derivedLastName = nameParts.slice(1).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Player'

                // Get better names from player_info if available
                const { data: existingPlayerInfo } = await supabaseAdmin
                    .from('player_info')
                    .select('first_name, last_name')
                    .eq('player_slug', playerId)
                    .maybeSingle()

                const searchFirstName = existingPlayerInfo?.first_name || derivedFirstName
                const searchLastName = existingPlayerInfo?.last_name || derivedLastName

                // Try updating by name match
                const { data: nameUpdateData, error: nameUpdateError } = await supabaseAdmin
                    .from('box_scores')
                    .update({
                        minutes_played: decimalMinutes,
                        player_slug: playerId
                    })
                    .eq('game_id', realGameId)
                    .eq('team_id', tsvNeuenstadtTeamId)
                    .ilike('player_first_name', searchFirstName)
                    .ilike('player_last_name', searchLastName)
                    .is('player_slug', null)
                    .select()

                if (nameUpdateError) {
                    console.error(`Name-based update failed for ${playerId}:`, nameUpdateError)
                }

                if (nameUpdateData && nameUpdateData.length > 0) {
                    results.push({ playerId, success: true, method: 'name-match' })
                } else {
                    // Try inserting new row
                    // First ensure player exists in player_info
                    const { data: playerInfo } = await supabaseAdmin
                        .from('player_info')
                        .select('first_name, last_name, player_slug')
                        .eq('player_slug', playerId)
                        .maybeSingle()

                    if (!playerInfo) {
                        // Create player in player_info
                        const { error: createPlayerError } = await supabaseAdmin
                            .from('player_info')
                            .insert({
                                player_slug: playerId,
                                first_name: derivedFirstName,
                                last_name: derivedLastName,
                                is_active: true
                            })

                        if (createPlayerError) {
                            console.error('Error creating player:', createPlayerError)
                        }
                    }

                    const { data: finalPlayerInfo } = await supabaseAdmin
                        .from('player_info')
                        .select('first_name, last_name')
                        .eq('player_slug', playerId)
                        .maybeSingle()

                    const { error: insertError } = await supabaseAdmin
                        .from('box_scores')
                        .insert({
                            game_id: realGameId,
                            team_id: tsvNeuenstadtTeamId,
                            player_slug: playerId,
                            player_first_name: finalPlayerInfo?.first_name || derivedFirstName,
                            player_last_name: finalPlayerInfo?.last_name || derivedLastName,
                            minutes_played: decimalMinutes,
                            points: 0
                        })

                    if (insertError) {
                        console.error(`Insert failed for ${playerId}:`, insertError)
                        results.push({ playerId, success: false, error: insertError.message })
                    } else {
                        results.push({ playerId, success: true, method: 'insert' })
                    }
                }
            } else {
                results.push({ playerId, success: true, method: 'slug-match' })
            }
        }

        const failedCount = results.filter(r => !r.success).length
        if (failedCount > 0) {
            console.log(`${failedCount} of ${results.length} updates failed`)
        }

        return new Response(
            JSON.stringify({
                success: failedCount === 0,
                message: `Updated ${results.length - failedCount} of ${results.length} players`,
                results
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

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
