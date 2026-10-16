require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const db = require('../lib/db-cjs')
async function main() {
  const tables = ['users','attendance','correction_requests','notifications','hr_sync_log','audit_logs']
  for (const t of tables) { const [{ count }] = await db(t).count('* as count'); console.log(`  ${t}: ${count} rows`) }
}
main().catch(console.error).finally(() => db.destroy())
