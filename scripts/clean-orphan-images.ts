import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const PRODUCTS_DIR = path.join(process.cwd(), 'public/products')

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  // Get all product names from DB
  const { data: products } = await supabase.from('items').select('name')
  const validSlugs = new Set(products?.map(p => slugify(p.name) + '-neon.png') || [])

  // Get all neon images
  const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('-neon.png'))

  let deleted = 0
  for (const file of files) {
    if (!validSlugs.has(file)) {
      fs.unlinkSync(path.join(PRODUCTS_DIR, file))
      console.log('🗑️  ' + file)
      deleted++
    }
  }

  console.log('\n✅ ' + deleted + ' images orphelines supprimées')
  console.log('📦 ' + (files.length - deleted) + ' images restantes')
}

main()
