#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addCredits(username, amount) {
  // Find user by username
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, username, credits')
    .eq('username', username)
    .single()

  if (userError || !user) {
    console.error('User not found:', username)
    console.error(userError)
    process.exit(1)
  }

  console.log(`Found user: ${user.username} (current credits: ${user.credits})`)

  // Update credits
  const newCredits = user.credits + amount
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: newCredits })
    .eq('id', user.id)

  if (updateError) {
    console.error('Failed to update credits:', updateError)
    process.exit(1)
  }

  console.log(`✅ Added ${amount} credits to ${username}`)
  console.log(`New balance: ${newCredits} credits`)
}

const username = process.argv[2]
const amount = parseInt(process.argv[3], 10)

if (!username || isNaN(amount)) {
  console.log('Usage: node scripts/add-credits.js <username> <amount>')
  console.log('Example: node scripts/add-credits.js Malhamaa 100')
  process.exit(1)
}

addCredits(username, amount)
