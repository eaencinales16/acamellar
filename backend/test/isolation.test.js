// Integration test: verifies per-user data isolation across the real route modules.
// Mounts the actual routers with a fake auth middleware that sets req.userId from a
// header, runs a two-user scenario, and asserts neither user can see the other's data.
// Runs against a throwaway temp database. Exits non-zero on any failure (gates the build).

const os = require('os');
const path = require('path');
process.env.DB_PATH = path.join(os.tmpdir(), `acamellar-test-${Date.now()}.db`);

const express = require('express');

const app = express();
app.use(express.json());
// Fake auth: the test sends the user id in a header instead of an Auth0 session.
app.use((req, res, next) => { req.userId = req.headers['x-test-user']; next(); });

app.use('/api/applications', require('../routes/applications'));
app.use('/api/connections', require('../routes/connections'));
app.use('/api/profile', require('../routes/profile'));
app.use('/api/goals', require('../routes/goals'));
app.use('/api/interviews', require('../routes/interviews'));
app.use('/api/reminders', require('../routes/reminders'));
app.use('/api/style-examples', require('../routes/styleExamples'));

let failures = 0;
function check(cond, label) {
  if (cond) { console.log(`  ✓ ${label}`); }
  else { console.error(`  ✗ FAIL: ${label}`); failures++; }
}

async function main() {
  const server = app.listen(0);
  const port = server.address().port;
  const BASE = `http://127.0.0.1:${port}`;

  const req = async (method, p, user, body) => {
    const r = await fetch(BASE + p, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-test-user': user },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    const text = await r.text();
    try { json = JSON.parse(text); } catch { json = text; }
    return { status: r.status, body: json };
  };

  const ALICE = 'auth0|alice', BOB = 'auth0|bob';

  console.log('Applications isolation:');
  const aApp = await req('POST', '/api/applications', ALICE, { company: 'Acme', position: 'Engineer' });
  check(aApp.status === 201, 'Alice creates an application');
  const aAppId = aApp.body.id;
  const bApp = await req('POST', '/api/applications', BOB, { company: 'Globex', position: 'Designer' });
  const bAppId = bApp.body.id;

  check((await req('GET', '/api/applications', ALICE)).body.length === 1, 'Alice sees only her 1 application');
  check((await req('GET', '/api/applications', BOB)).body.length === 1, 'Bob sees only his 1 application');
  check((await req('GET', `/api/applications/${aAppId}`, BOB)).status === 404, "Bob cannot read Alice's application by id");
  check((await req('GET', `/api/applications/${bAppId}`, ALICE)).status === 404, "Alice cannot read Bob's application by id");
  check((await req('PUT', `/api/applications/${aAppId}`, BOB, { company: 'Hacked' })).status === 404, "Bob cannot edit Alice's application");
  await req('DELETE', `/api/applications/${aAppId}`, BOB);
  check((await req('GET', `/api/applications/${aAppId}`, ALICE)).status === 200, "Bob's delete did not remove Alice's application");

  console.log('Profile isolation:');
  await req('PUT', '/api/profile', ALICE, { name: 'Alice', resume: 'Alice resume' });
  check((await req('GET', '/api/profile', ALICE)).body.name === 'Alice', 'Alice profile saved');
  check(!(await req('GET', '/api/profile', BOB)).body.name, "Bob's profile is empty (not Alice's)");

  console.log('Connections isolation:');
  await req('POST', '/api/connections', ALICE, { name: 'Alice Contact' });
  check((await req('GET', '/api/connections', ALICE)).body.length === 1, 'Alice sees her 1 connection');
  check((await req('GET', '/api/connections', BOB)).body.length === 0, 'Bob sees no connections');

  console.log('Goals isolation:');
  await req('POST', '/api/goals', ALICE, { week_start: '2026-06-15', applications_target: 5, connections_target: 3 });
  await req('POST', '/api/goals', BOB, { week_start: '2026-06-15', applications_target: 9, connections_target: 9 });
  check((await req('GET', '/api/goals', ALICE)).body.length === 1, 'Alice sees only her goal for the week');
  check((await req('GET', '/api/goals/week?week_start=2026-06-15', ALICE)).body.applications_target === 5, "Alice's goal target is hers (5), not Bob's");
  check((await req('GET', '/api/goals/week?week_start=2026-06-15', BOB)).body.applications_target === 9, "Bob's goal target is his (9)");

  console.log('Interviews isolation:');
  const aIv = await req('POST', '/api/interviews', ALICE, { application_id: aAppId, round: 'Phone' });
  check(aIv.status === 201, 'Alice adds an interview to her application');
  check((await req('POST', '/api/interviews', BOB, { application_id: aAppId, round: 'Sneaky' })).status === 404, "Bob cannot add an interview to Alice's application");
  check((await req('GET', '/api/interviews', BOB)).body.length === 0, 'Bob sees no interviews');
  check((await req('GET', '/api/interviews', ALICE)).body.length === 1, 'Alice sees her 1 interview');

  console.log('Reminders isolation:');
  await req('POST', '/api/reminders', ALICE, { title: 'Follow up', message: 'do it', scheduled_at: '2026-06-20T09:00' });
  check((await req('GET', '/api/reminders', ALICE)).body.length === 1, 'Alice sees her reminder');
  check((await req('GET', '/api/reminders', BOB)).body.length === 0, 'Bob sees no reminders');

  console.log('Style examples isolation:');
  await req('POST', '/api/style-examples', ALICE, { doc_type: 'resume', content: 'sample' });
  check((await req('GET', '/api/style-examples', ALICE)).body.length === 1, 'Alice sees her voice sample');
  check((await req('GET', '/api/style-examples', BOB)).body.length === 0, 'Bob sees no voice samples');

  server.close();
  console.log('');
  if (failures === 0) { console.log('✅ All isolation tests passed'); process.exit(0); }
  else { console.error(`❌ ${failures} isolation test(s) FAILED`); process.exit(1); }
}

main().catch(e => { console.error('Test crashed:', e); process.exit(1); });
