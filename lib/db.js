// Tiny document store: Postgres (Neon) when DATABASE_URL is set, otherwise a local JSON file.
import fs from 'fs';
import path from 'path';

// Vercel's Neon integration can add a prefix to the variable name (e.g. STORAGE_DATABASE_URL), so look for any Postgres URL.
function findDbEnv() {
  const e = process.env;
  for (const k of ['DATABASE_URL', 'POSTGRES_URL', 'STORAGE_DATABASE_URL', 'STORAGE_URL', 'STORAGE_POSTGRES_URL']) if ((e[k] || '').trim()) return k;
  const all = Object.keys(e).filter((k) => /^postgres(ql)?:\/\//i.test((e[k] || '').trim()));
  return all.find((k) => !/UNPOOLED|NON_POOLING|NO_SSL|PRISMA/i.test(k)) || all[0] || '';
}
const ENV_NAME = findDbEnv();
const URL = ENV_NAME ? process.env[ENV_NAME].trim() : '';
export const dbSource = () => ENV_NAME;
const FILE = process.env.VERCEL ? '/tmp/twerkdivas.json' : path.join(process.cwd(), '.data', 'db.json');
let sql = null;
let ready = null;

async function init() {
  if (!URL) return;
  const { neon } = await import('@neondatabase/serverless');
  // Next.js caches server-side fetch() calls, and the Neon driver talks over fetch: without no-store, pages show stale query results forever.
  sql = neon(URL, { fetchOptions: { cache: 'no-store' } });
  await sql`create table if not exists records (
    collection text not null, id text not null, data jsonb not null,
    updated_at timestamptz not null default now(), primary key (collection, id))`;
}
function ensure() { if (!ready) ready = init(); return ready; }

function readFile() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; }
}
function writeFile(db) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db));
}

export const usingPostgres = () => !!URL;
export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export async function list(col) {
  await ensure();
  if (sql) {
    const rows = await sql`select data from records where collection = ${col}`;
    return rows.map((r) => r.data);
  }
  return Object.values(readFile()[col] || {});
}
export async function get(col, id) {
  await ensure();
  if (sql) {
    const rows = await sql`select data from records where collection = ${col} and id = ${id}`;
    return rows[0]?.data || null;
  }
  return (readFile()[col] || {})[id] || null;
}
export async function put(col, id, data) {
  await ensure();
  const doc = { ...data, id };
  if (sql) {
    await sql`insert into records (collection, id, data) values (${col}, ${id}, ${JSON.stringify(doc)}::jsonb)
      on conflict (collection, id) do update set data = excluded.data, updated_at = now()`;
  } else {
    const db = readFile();
    (db[col] ||= {})[id] = doc;
    writeFile(db);
  }
  return doc;
}
export async function create(col, data) { return put(col, data.id || uid(), data); }
export async function patch(col, id, changes) {
  const cur = (await get(col, id)) || {};
  return put(col, id, { ...cur, ...changes });
}
export async function del(col, id) {
  await ensure();
  if (sql) { await sql`delete from records where collection = ${col} and id = ${id}`; return; }
  const db = readFile();
  if (db[col]) delete db[col][id];
  writeFile(db);
}
export async function replaceAll(col, items) {
  await ensure();
  if (sql) {
    await sql`delete from records where collection = ${col}`;
    for (const it of items) await put(col, it.id || uid(), it);
    return;
  }
  const db = readFile();
  db[col] = {};
  for (const it of items) { const id = it.id || uid(); db[col][id] = { ...it, id }; }
  writeFile(db);
}
// Bulk helpers: ONE query for any number of rows (hundreds of single-row calls time out on Vercel).
export async function putMany(col, items) {
  await ensure();
  // De-dupe by id (last one wins): Postgres refuses to upsert the same row twice in one statement.
  const docs = [...new Map(items.map((it) => { const id = it.id || uid(); return [id, { ...it, id }]; })).values()];
  if (!docs.length) return docs;
  if (sql) {
    for (let i = 0; i < docs.length; i += 500) {
      const chunk = JSON.stringify(docs.slice(i, i + 500));
      await sql`insert into records (collection, id, data)
        select ${col}::text, x->>'id', x from jsonb_array_elements(${chunk}::jsonb) as x
        on conflict (collection, id) do update set data = excluded.data, updated_at = now()`;
    }
  } else {
    const db = readFile(); const c = (db[col] ||= {});
    for (const d of docs) c[d.id] = d;
    writeFile(db);
  }
  return docs;
}
export async function delMany(col, ids) {
  await ensure();
  if (!ids.length) return;
  if (sql) { await sql`delete from records where collection = ${col} and id = any(${ids}::text[])`; return; }
  const db = readFile(); for (const id of ids) if (db[col]) delete db[col][id]; writeFile(db);
}
export async function delSample(col) {
  await ensure();
  if (sql) { await sql`delete from records where collection = ${col} and data->>'sample' = 'true'`; return; }
  const db = readFile(); for (const [id, v] of Object.entries(db[col] || {})) if (v.sample) delete db[col][id]; writeFile(db);
}
export async function delCollection(col) {
  await ensure();
  if (sql) { await sql`delete from records where collection = ${col}`; return; }
  const db = readFile(); db[col] = {}; writeFile(db);
}
export async function clearCollection(col) { return replaceAll(col, []); }

export async function dbHealth() {
  if (!URL) return { ok: false, mode: 'file', error: 'No Postgres connection string found in the environment.' };
  try { await ensure(); const rows = await sql`select count(*)::int as n from records`; return { ok: true, mode: 'postgres', source: ENV_NAME, records: rows[0].n }; }
  catch (e) { return { ok: false, mode: 'postgres', source: ENV_NAME, error: e.message }; }
}
