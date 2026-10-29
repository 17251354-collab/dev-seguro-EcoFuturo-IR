const SUPABASE_URL = 'https://plruznhbkoyqlrzswsmt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscnV6bmhia295cWxyenN3c210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMjc5OTYsImV4cCI6MjA5MzYwMzk5Nn0.kaBoeCYdnXaQWpreHvqq62uxK9wu1iXR7TvqIbhuMaY'

const URL = SUPABASE_URL + '/rest/v1'
const H = {
  'apikey': ANON_KEY,
  'Authorization': 'Bearer ' + ANON_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
}

async function main() {
  console.log('=== Resetando hist\u00F3rico de atividades ===\n')

  // 1. Desatrelar moedas das convers\u00F5es (usar id_movimento como PK)
  console.log('1. Desatrelando moedas das convers\u00F5es...')
  let r = await fetch(URL + '/moeda?id_movimento=gt.0', {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ id_conversao: null })
  })
  console.log('   moeda (set null id_conversao): ' + r.status)

  // 2-4. Deletar em ordem
  const tables = ['conversao_moedas', 'emissao_co2', 'atividade']
  for (const t of tables) {
    r = await fetch(URL + '/' + t, { method: 'DELETE', headers: H })
    console.log('   ' + t + ': ' + r.status)
  }

  console.log('\n=== Reset conclu\u00EDdo ===')
}
main().catch(err => console.error('Erro:', err))
