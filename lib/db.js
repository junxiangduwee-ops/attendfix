import knex from 'knex'

const globalForKnex = globalThis

export const db = globalForKnex.db ?? knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 0, max: 3 },
})

if (process.env.NODE_ENV !== 'production') globalForKnex.db = db
