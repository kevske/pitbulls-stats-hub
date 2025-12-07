import { PlayerStats } from '../src/types/stats';
import { promises as fs } from 'fs';
import path from 'path';

// Function to generate a URL-friendly slug from a player name
function generatePlayerSlug(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}-${lastName.toLowerCase()}`
    .replace(/[^a-z0-9-]/g, '-') // Replace special characters with hyphens
    .replace(/-+/g, '-')         // Replace multiple hyphens with a single one
    .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens
}

// Function to create player folders
async function createPlayerFolders(players: PlayerStats[]) {
  const playersDir = path.join(process.cwd(), 'public', 'players');
  
  try {
    // Ensure the players directory exists
    await fs.mkdir(playersDir, { recursive: true });
    
    // Create a folder for each player
    for (const player of players) {
      const playerSlug = generatePlayerSlug(player.firstName, player.lastName);
      const playerDir = path.join(playersDir, playerSlug);
      
      try {
        await fs.mkdir(playerDir, { recursive: true });
        console.log(`✅ Created folder for ${player.firstName} ${player.lastName}: ${playerDir}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          console.error(`❌ Error creating folder for ${player.firstName} ${player.lastName}:`, error);
        } else {
          console.log(`ℹ️  Folder already exists for ${player.firstName} ${player.lastName}`);
        }
      }
    }
    
    console.log('\n🎉 Player folders created successfully!');
  } catch (error) {
    console.error('❌ Error creating player folders:', error);
    process.exit(1);
  }
}

// This script is meant to be run with ts-node
// It will use the StatsContext to get the list of players
// and create a folder for each one in the public/players directory

// Import the StatsProvider and fetchAllData
import { StatsProvider } from '../src/contexts/StatsContext';
import { fetchAllData } from '../src/data/api/statsService';
import React from 'react';
import { renderToString } from 'react-dom/server';

async function main() {
  try {
    console.log('🔍 Fetching player data...');
    const { playerTotals } = await fetchAllData();
    
    if (playerTotals.length === 0) {
      console.warn('⚠️  No players found in the database');
      return;
    }
    
    console.log(`📋 Found ${playerTotals.length} players`);
    await createPlayerFolders(playerTotals);
  } catch (error) {
    console.error('❌ Error in main function:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
