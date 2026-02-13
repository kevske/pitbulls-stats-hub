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

        // Input validation
        if (!gameNumber || (typeof gameNumber !== 'string' && typeof gameNumber !== 'number')) {
            return new Response(
                JSON.stringify({ error: 'Bad Request', message: 'Invalid gameNumber format' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Prevent injection in .or() filter
        const gameNumberStr = String(gameNumber)
        if (!/^[a-zA-Z0-9_-]+$/.test(gameNumberStr)) {
            return new Response(
                JSON.stringify({ error: 'Bad Request', message: 'Invalid gameNumber format' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!Array.isArray(playerSeconds)) {
             return new Response(
                JSON.stringify({ error: 'Bad Request', message: 'Invalid playerSeconds format' }),
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

        // Bulk optimization: Fetch existing data first
        const { data: existingBoxScores, error: boxScoreError } = await supabaseAdmin
            .from('box_scores')
            .select('player_slug, player_first_name, player_last_name')
            .eq('game_id', realGameId)
            .eq('team_id', tsvNeuenstadtTeamId)

        if (boxScoreError) {
             console.error('Error fetching box scores:', boxScoreError)
             return new Response(
                JSON.stringify({ error: 'Database error', message: boxScoreError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const playerSlugs = playerSeconds.map((p: any) => p.playerId)
        const { data: existingPlayers, error: playerInfoError } = await supabaseAdmin
            .from('player_info')
            .select('player_slug, first_name, last_name')
            .in('player_slug', playerSlugs)

        if (playerInfoError) {
             console.error('Error fetching player info:', playerInfoError)
             // Non-fatal, we can continue without info
        }

        // Create lookups
        const existingBoxScoreMap = new Set(existingBoxScores?.filter((r: any) => r.player_slug).map((r: any) => r.player_slug))
        const existingNullSlugMap = new Map()
        existingBoxScores?.filter((r: any) => !r.player_slug).forEach((r: any) => {
            const key = `${r.player_first_name} ${r.player_last_name}`.toLowerCase()
            existingNullSlugMap.set(key, r)
        })

        const existingPlayerInfoMap = new Map()
        existingPlayers?.forEach((p: any) => existingPlayerInfoMap.set(p.player_slug, p))

        const updatesToUpsert: any[] = []
        const updatesToLink: any[] = []
        const newPlayersToInsert: any[] = []
        const processedSlugs = new Set() // Track to prevent duplicates in batch

        // Process inputs
        for (const { playerId, seconds } of playerSeconds) {
            const decimalMinutes = Math.round((seconds / 60) * 100) / 100

            // Direct match by slug
            if (existingBoxScoreMap.has(playerId)) {
                updatesToUpsert.push({
                    game_id: realGameId,
                    team_id: tsvNeuenstadtTeamId,
                    player_slug: playerId,
                    minutes_played: decimalMinutes
                })
                continue
            }

            // Derive name
            let derivedFirstName = 'Unknown'
            let derivedLastName = 'Player'

            if (existingPlayerInfoMap.has(playerId)) {
                 const info = existingPlayerInfoMap.get(playerId)
                 derivedFirstName = info.first_name || 'Unknown'
                 derivedLastName = info.last_name || 'Player'
            } else {
                 const nameParts = playerId.split('-')
                 derivedFirstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Unknown'
                 derivedLastName = nameParts.slice(1).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Player'
            }

            const nameKey = `${derivedFirstName} ${derivedLastName}`.toLowerCase()

            if (existingNullSlugMap.has(nameKey)) {
                 // Link update: Must update specific row
                 updatesToLink.push({
                     query: {
                         game_id: realGameId,
                         team_id: tsvNeuenstadtTeamId,
                         player_first_name: existingNullSlugMap.get(nameKey).player_first_name,
                         player_last_name: existingNullSlugMap.get(nameKey).player_last_name
                     },
                     update: {
                         minutes_played: decimalMinutes,
                         player_slug: playerId
                     }
                 })
            } else {
                 // Insert
                 if (!existingPlayerInfoMap.has(playerId) && !processedSlugs.has(playerId)) {
                     newPlayersToInsert.push({
                         player_slug: playerId,
                         first_name: derivedFirstName,
                         last_name: derivedLastName,
                         is_active: true
                     })
                     processedSlugs.add(playerId)
                 }

                 updatesToUpsert.push({
                     game_id: realGameId,
                     team_id: tsvNeuenstadtTeamId,
                     player_slug: playerId,
                     player_first_name: derivedFirstName,
                     player_last_name: derivedLastName,
                     minutes_played: decimalMinutes,
                     points: 0
                 })
            }
        }

        // Execute Batches
        let success = true
        let errors: string[] = []

        if (newPlayersToInsert.length > 0) {
            const { error } = await supabaseAdmin.from('player_info').upsert(newPlayersToInsert)
            if (error) {
                console.error('Error inserting new players:', error)
                errors.push(`New players insert error: ${error.message}`)
            }
        }

        if (updatesToLink.length > 0) {
            await Promise.all(updatesToLink.map(async (item: any) => {
                const { error } = await supabaseAdmin.from('box_scores')
                    .update(item.update)
                    .eq('game_id', item.query.game_id)
                    .eq('team_id', item.query.team_id)
                    .eq('player_first_name', item.query.player_first_name)
                    .eq('player_last_name', item.query.player_last_name)
                    .is('player_slug', null)

                if (error) {
                    console.error(`Error linking player ${item.update.player_slug}:`, error)
                    success = false
                    errors.push(`Link error for ${item.update.player_slug}: ${error.message}`)
                }
            }))
        }

        if (updatesToUpsert.length > 0) {
            const { error } = await supabaseAdmin.from('box_scores').upsert(updatesToUpsert)
            if (error) {
                console.error('Error upserting box scores:', error)
                success = false
                errors.push(`Upsert error: ${error.message}`)
            }
        }

        if (errors.length > 0) {
             return new Response(
                JSON.stringify({
                    success: false,
                    message: `Encountered errors: ${errors.join(', ')}`,
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Processed ${playerSeconds.length} players`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge function error:', error)
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
