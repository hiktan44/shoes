import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const userId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const functions = [
  'public.add_credits(uuid,integer,numeric,text,text,text)',
  'public.deduct_credits(uuid,integer,text)',
];

before(async () => {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create role public_only;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public to anon, authenticated, service_role, public_only;
  `);
  const directory = new URL('../supabase/migrations/', import.meta.url);
  for (const filename of ['0002_credits.sql', '0003_admin.sql', '0004_suspend.sql']) {
    await db.exec(await readFile(new URL(filename, directory), 'utf8'));
  }
  await db.exec(`insert into auth.users values ('${userId}'), ('${otherId}');`);
  // Eski geçişlerin varsayılan PUBLIC izniyle bulguyu yeniden üret.
  const vulnerable = await db.query('select has_function_privilege($1, $2, $3) as allowed',
    ['anon', functions[0], 'EXECUTE']);
  assert.equal(vulnerable.rows[0].allowed, true);
  const patches = (await readdir(directory)).filter(name => name.endsWith('_secure_credit_function_permissions.sql'));
  assert.equal(patches.length, 1);
  await db.exec(await readFile(new URL(patches[0], directory), 'utf8'));
});
after(() => db.close());

async function asRole(role, sql) {
  await db.exec(`set role ${role};`);
  try { return await db.query(sql); }
  finally { await db.exec('reset role;'); }
}

for (const role of ['anon', 'authenticated', 'public_only']) {
  test(`${role} kendisinin veya başka kullanıcının kredisini ekleyemez/düşüremez`, async () => {
    for (const id of [userId, otherId]) {
      await assert.rejects(asRole(role,
        `select public.add_credits('${id}', 100, 10, 'test', 'test', 'denied_${role}_${id}');`),
        error => error.code === '42501');
      await assert.rejects(asRole(role,
        `select public.deduct_credits('${id}', 1, 'test');`),
        error => error.code === '42501');
    }
    const rows = (await db.query('select credits from public.profiles order by id')).rows;
    assert.deepEqual(rows.map(row => row.credits), [10, 10]);
  });
}

test('yalnız güvenilir sunucu rolüne kredi işlevi çalıştırma izni verilir', async () => {
  for (const role of ['anon', 'authenticated', 'public_only', 'service_role']) {
    for (const name of functions) {
      const result = await db.query('select has_function_privilege($1, $2, $3) as allowed',
        [role, name, 'EXECUTE']);
      assert.equal(result.rows[0].allowed, role === 'service_role');
    }
  }
});

test('sunucu kredi ekler; aynı ödeme ikinci kez eklenmez; kredi kullanımı çalışır', async () => {
  const add = `select public.add_credits('${userId}', 5, 10, 'test', 'test', 'paid_once') as result;`;
  assert.equal((await asRole('service_role', add)).rows[0].result.balance, 15);
  const duplicate = (await asRole('service_role', add)).rows[0].result;
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.balance, 15);
  const usage = (await asRole('service_role',
    `select public.deduct_credits('${userId}', 2, 'studio') as result;`)).rows[0].result;
  assert.deepEqual(usage, { ok: true, balance: 13 });
});

test('askıya alınmış kullanıcı ve yetersiz bakiye sunucu yolunda da reddedilir', async () => {
  await db.exec(`update public.profiles set suspended = true where id = '${otherId}';`);
  const blocked = (await asRole('service_role',
    `select public.deduct_credits('${otherId}', 1, 'studio') as result;`)).rows[0].result;
  assert.equal(blocked.error, 'suspended');
  const insufficient = (await asRole('service_role',
    `select public.deduct_credits('${userId}', 100, 'studio') as result;`)).rows[0].result;
  assert.equal(insufficient.error, 'insufficient');
});

test('SECURITY DEFINER işlevlerinin arama yolu sabittir; trigger istemciye kapalıdır', async () => {
  const rows = (await db.query(`select proname, proconfig from pg_proc
    where oid in ('public.add_credits(uuid,integer,numeric,text,text,text)'::regprocedure,
      'public.deduct_credits(uuid,integer,text)'::regprocedure, 'public.handle_new_user()'::regprocedure)`)).rows;
  assert.equal(rows.length, 3);
  for (const row of rows) assert.ok(row.proconfig.includes('search_path=""'));
  for (const role of ['anon', 'authenticated']) {
    const result = await db.query('select has_function_privilege($1, $2, $3) as allowed',
      [role, 'public.handle_new_user()', 'EXECUTE']);
    assert.equal(result.rows[0].allowed, false);
  }
});

test('izin düzeltmesi yeniden uygulanabilir ve yeni üye triggerı çalışır', async () => {
  const directory = new URL('../supabase/migrations/', import.meta.url);
  const filename = (await readdir(directory)).find(name => name.endsWith('_secure_credit_function_permissions.sql'));
  await db.exec(await readFile(new URL(filename, directory), 'utf8'));
  await db.exec("insert into auth.users values ('33333333-3333-4333-8333-333333333333');");
  const result = await db.query("select credits from public.profiles where id = '33333333-3333-4333-8333-333333333333'");
  assert.equal(result.rows[0].credits, 10);
});
