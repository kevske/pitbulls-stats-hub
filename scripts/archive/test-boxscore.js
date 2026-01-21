// Simple test to verify our boxscore logic
// This can be run in the browser console

console.log('Testing boxscore logic...');

// Test the logic we implemented
const testGame = {
  home_team_name: 'TSV Neuenstadt',
  away_team_name: 'Other Team',
  home_team_id: 'team-123',
  away_team_id: 'team-456'
};

// Simulate our logic
const isTSVNeuenstadtHome = testGame.home_team_name.toLowerCase().includes('neuenstadt');
const tsvNeuenstadtTeamId = isTSVNeuenstadtHome ? testGame.home_team_id : testGame.away_team_id;

console.log('Test game:', testGame);
console.log('Is TSV Neuenstadt home?', isTSVNeuenstadtHome);
console.log('TSV Neuenstadt team ID:', tsvNeuenstadtTeamId);

// Test with away team
const testGameAway = {
  home_team_name: 'Other Team',
  away_team_name: 'TSV Neuenstadt',
  home_team_id: 'team-123',
  away_team_id: 'team-456'
};

const isTSVNeuenstadtHomeAway = testGameAway.home_team_name.toLowerCase().includes('neuenstadt');
const tsvNeuenstadtTeamIdAway = isTSVNeuenstadtHomeAway ? testGameAway.home_team_id : testGameAway.away_team_id;

console.log('Test game (away):', testGameAway);
console.log('Is TSV Neuenstadt home?', isTSVNeuenstadtHomeAway);
console.log('TSV Neuenstadt team ID:', tsvNeuenstadtTeamIdAway);

console.log('Boxscore logic test completed!');
