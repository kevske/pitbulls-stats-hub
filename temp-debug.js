// Add this to the browser console on the videos page to debug
console.log('=== VIDEO DEBUG ===');
fetch('/api/games') // This might not work, but let's try to get the data
  .then(r => r.json())
  .then(data => {
    console.log('Games data:', data);
  })
  .catch(() => {
    console.log('API endpoint not available, checking DOM...');
    // Check if there's any game data in the page
    const gameElements = document.querySelectorAll('[data-game-number]');
    console.log('Game elements found:', gameElements.length);
    gameElements.forEach(el => {
      console.log('Game element:', el.getAttribute('data-game-number'), el.textContent);
    });
  });
