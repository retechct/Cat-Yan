const { neon } = require('@neondatabase/serverless');

let sqlClient;
let schemaReady = false;

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

async function ensureSchema() {
  if (schemaReady) return;
  const sql = getSql();
  await sql`
    create table if not exists beaulyx_settings (
      key text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;
  schemaReady = true;
}

async function getCatalog() {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    select data
    from beaulyx_settings
    where key = 'catalog'
    limit 1
  `;
  return rows[0]?.data || null;
}

async function saveCatalog(catalog) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    insert into beaulyx_settings (key, data, updated_at)
    values ('catalog', ${JSON.stringify(catalog)}::jsonb, now())
    on conflict (key)
    do update set data = excluded.data, updated_at = now()
  `;
}

module.exports = {
  getCatalog,
  saveCatalog,
};
