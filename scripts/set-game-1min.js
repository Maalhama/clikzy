const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function setGameTo1Min() {
  // Get first active game
  const { data: games, error: fetchError } = await supabase
    .from('games')
    .select('id, item_id, status')
    .in('status', ['active', 'final_phase'])
    .limit(1);

  if (fetchError) {
    console.error('Error fetching games:', fetchError);
    return;
  }

  if (!games || games.length === 0) {
    console.log('No active games found');
    return;
  }

  const game = games[0];
  const newEndTime = Date.now() + 60000; // 1 minute from now

  const { error: updateError } = await supabase
    .from('games')
    .update({
      end_time: newEndTime,
      status: 'final_phase'
    })
    .eq('id', game.id);

  if (updateError) {
    console.error('Error updating game:', updateError);
    return;
  }

  console.log('✅ Game updated!');
  console.log('Game ID:', game.id);
  console.log('New end time:', new Date(newEndTime).toLocaleTimeString());
  console.log('URL: http://localhost:3000/game/' + game.id);
}

setGameTo1Min();
