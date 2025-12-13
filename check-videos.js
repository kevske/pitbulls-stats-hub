// Simple script to check the video mapping
// Run this in the browser console on the videos page

(async function() {
  console.log('=== CHECKING VIDEO MAPPING ===');
  
  // Get the games data from the StatsContext
  // We need to access the React component state, so let's check the network requests instead
  
  // Check what games are being displayed
  const gameCards = document.querySelectorAll('[class*="game"]');
  console.log(`Found ${gameCards.length} game cards on the page`);
  
  gameCards.forEach((card, index) => {
    console.log(`Game ${index + 1}:`, card.textContent.substring(0, 100) + '...');
  });
  
  // Check if there are any video links in the page
  const videoLinks = document.querySelectorAll('a[href*="youtube"]');
  console.log(`Found ${videoLinks.length} YouTube links`);
  
  // Check the page title and content
  console.log('Page title:', document.title);
  console.log('Current URL:', window.location.href);
})();
