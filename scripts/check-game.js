const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkGame() {
  const gameId = process.argv[2];

  if (!gameId) {
    // Get all active games
    const { data: games, error } = await supabase
      .from('games')
      .select('id, status, total_clicks, last_click_username, end_time')
      .in('status', ['active', 'final_phase'])
      .order('end_time', { ascending: true });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('\n📊 Active Games in Database:\n');
    games.forEach(game => {
      console.log(`ID: ${game.id}`);
      console.log(`  Status: ${game.status}`);
      console.log(`  Total Clicks: ${game.total_clicks}`);
      console.log(`  Last Click Username: ${game.last_click_username || '(none)'}`);
      console.log(`  End Time: ${new Date(game.end_time).toLocaleTimeString()}`);
      console.log('');
    });
    return;
  }

  // Check specific game
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📊 Game Details:\n');
  console.log(`ID: ${game.id}`);
  console.log(`Status: ${game.status}`);
  console.log(`Total Clicks: ${game.total_clicks}`);
  console.log(`Last Click Username: ${game.last_click_username || '(none)'}`);
  console.log(`Last Click User ID: ${game.last_click_user_id || '(none)'}`);
  console.log(`End Time: ${new Date(game.end_time).toLocaleTimeString()}`);
  console.log(`Winner ID: ${game.winner_id || '(none)'}`);
}

checkGame();
