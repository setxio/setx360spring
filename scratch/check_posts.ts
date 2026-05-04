import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

async function checkSchema() {
  const { data, error } = await supabase.from('posts').select('*').limit(1)
  if (error) console.error(error)
  else console.log('Columns:', Object.keys(data[0] || {}))
}

checkSchema()
