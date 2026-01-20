const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function resetGame() {
  const gameId = process.argv[2];
  const minutes = parseInt(process.argv[3]) || 1;

  if (!gameId) {
    console.log('Usage: node reset-game.js <game_id> [minutes]');
    console.log('Example: node reset-game.js abc123 5');
    return;
  }

  const newEndTime = Date.now() + (minutes * 60 * 1000);

  // Delete all clicks for this game
  const { error: clicksError } = await supabase
    .from('clicks')
    .delete()
    .eq('game_id', gameId);

  if (clicksError) {
    console.error('Error deleting clicks:', clicksError);
  } else {
    console.log('🗑️  Clicks history cleared');
  }

  // Reset game data
  const { error } = await supabase
    .from('games')
    .update({
      total_clicks: 0,
      last_click_username: null,
      last_click_user_id: null,
      last_click_at: null,
      end_time: newEndTime,
      status: minutes <= 1 ? 'final_phase' : 'active',
      winner_id: null,
    })
    .eq('id', gameId);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Game reset!');
  console.log(`Game ID: ${gameId}`);
  console.log(`Total Clicks: 0`);
  console.log(`Last Click Username: (cleared)`);
  console.log(`Clicks History: (cleared)`);
  console.log(`New end time: ${new Date(newEndTime).toLocaleTimeString()}`);
  console.log(`Status: ${minutes <= 1 ? 'final_phase' : 'active'}`);
  console.log(`URL: http://localhost:3000/game/${gameId}`);
}

resetGame();
