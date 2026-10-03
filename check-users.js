const URL = 'https://plruznhbkoyqlrzswsmt.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscnV6bmhia295cWxyenN3c210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMjc5OTYsImV4cCI6MjA5MzYwMzk5Nn0.kaBoeCYdnXaQWpreHvqq62uxK9wu1iXR7TvqIbhuMaY'
const H = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY }

async function main() {
  const params = new URLSearchParams({
    select: 'id_usuario,nome,email,tipo_usuario,qtd_moeda',
    order: 'qtd_moeda.desc.nullslast',
    limit: 30
  })
  const r = await fetch(URL + '/rest/v1/usuario?' + params, { headers: H })
  const users = await r.json()
  console.log('Total usuarios:', users.length)
  for (const u of users) {
    console.log('  #' + u.id_usuario + ' ' + u.nome + ' | ' + u.email + ' | ' + u.tipo_usuario + ' | ' + u.qtd_moeda + ' moedas')
  }
}
main().catch(console.error)
