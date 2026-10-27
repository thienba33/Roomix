import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminAuthClient } from '../src/services/admin-auth.ts';

const token = { accessToken: 'core-issued-token', tokenType: 'Bearer', expiresIn: 3600 };
const admin = {
  id: '10000000-0000-4000-8000-000000000005', username: 'admin',
  fullName: 'Admin Test', email: 'admin@example.test', role: 'ADMIN', status: 'ACTIVE',
};
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
const enrollment = { authSessionId: 'session-from-core-12345', purpose: 'ENROLL', expiresAt: 90 };
const session = { accessToken: token.accessToken, expiresAt: 3601000, user: admin, method: 'PASSWORD' };
const loginTicket = {
  authSessionId: 'login-session-from-core-12345', purpose: 'LOGIN', expiresAt: 90,
  completionToken: 'secret-from-core-'.repeat(3),
};

function setup(responses, extra = {}) {
  const calls = [];
  const client = createAdminAuthClient({
    baseUrl: 'http://gateway.test/', clock: () => 1000,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      const response = responses.shift();
      if (response instanceof Error) throw response;
      if (!response) throw new Error('Unexpected request');
      return response;
    }, ...extra,
  });
  return { client, calls };
}

test('password login calls only Core and confirms Admin through authenticated profile', async () => {
  const { client, calls } = setup([json({ data: token }), json({ data: admin })]);
  const result = await client.login(' admin ', ' password with spaces ');
  assert.equal(result.user.id, admin.id);
  assert.equal(result.method, 'PASSWORD');
  assert.equal(result.expiresAt, 3601000);
  assert.deepEqual(calls.map((call) => call.url), [
    'http://gateway.test/api/auth/login', 'http://gateway.test/api/users/me',
  ]);
  assert.deepEqual(JSON.parse(calls[0].options.body), { username: 'admin', password: ' password with spaces ' });
  assert.equal(calls[1].options.headers.Authorization, `Bearer ${token.accessToken}`);
  assert.equal(calls[0].options.headers['X-Service-Token'], undefined);
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.redirect, 'error');
});

test('accepts direct Core DTO response', async () => {
  const { client } = setup([json(token), json(admin)]);
  assert.equal((await client.login('admin', 'password')).user.role, 'ADMIN');
});

test('rejects non-Admin, locked and pending accounts even after password success', async () => {
  for (const patch of [{ role: 'TENANT' }, { status: 'LOCKED' }, { status: 'PENDING_VERIFICATION' }]) {
    const { client } = setup([json(token), json({ ...admin, ...patch })]);
    await assert.rejects(client.login('admin', 'password'), { code: 'ADMIN_REQUIRED' });
  }
});

test('never accepts mock token or missing, expired or invalid token metadata', async () => {
  for (const patch of [
    { accessToken: 'mock-only-demo' }, { accessToken: '' }, { expiresIn: 0 },
    { expiresIn: -1 }, { expiresIn: '3600' }, { expiresIn: 1e100 }, { tokenType: 'Other' },
  ]) {
    const { client, calls } = setup([json({ ...token, ...patch })]);
    await assert.rejects(client.login('admin', 'password'), { code: 'INVALID_RESPONSE' });
    assert.equal(calls.length, 1);
  }
});

test('requires complete authoritative profile instead of trusting login user', async () => {
  const { client } = setup([json({ ...token, user: admin }), json({ ...admin, id: null })]);
  await assert.rejects(client.login('admin', 'password'), { code: 'INVALID_RESPONSE' });
});

test('401, 403, 404, 429 and 503 are reported without fallback to mock', async () => {
  for (const [status, code] of [[401, 'UNAUTHORIZED'], [403, 'FORBIDDEN'], [404, 'API_NOT_READY'],
    [429, 'RATE_LIMITED'], [503, 'CORE_UNAVAILABLE']]) {
    const { client, calls } = setup([json({ message: 'private server detail' }, status)]);
    await assert.rejects(client.login('admin', 'password'), (error) => {
      assert.equal(error.code, code);
      assert.ok(!error.message.includes('private server detail'));
      return true;
    });
    assert.equal(calls.length, 1);
  }
});

test('failed profile authentication does not create an Admin session', async () => {
  const { client } = setup([json(token), json({}, 401)]);
  await assert.rejects(client.login('admin', 'password'), { code: 'UNAUTHORIZED' });
});

test('HTML, empty envelope and explicit application failure are rejected', async () => {
  for (const response of [new Response('<html>gateway error</html>'), json({ data: null }),
    json({ success: false, data: token }), json([])]) {
    const { client } = setup([response]);
    await assert.rejects(client.login('admin', 'password'), { code: 'INVALID_RESPONSE' });
  }
});

test('network error does not expose password or underlying exception', async () => {
  const { client } = setup([new Error('private-password')]);
  await assert.rejects(client.login('admin', 'private-password'), (error) => {
    assert.equal(error.code, 'NETWORK_ERROR');
    assert.ok(!error.message.includes('private-password'));
    return true;
  });
});

test('timeout aborts request and reports a retryable connection problem', async () => {
  const { client } = setup([], {
    timeoutMs: 5,
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }),
  });
  await assert.rejects(client.login('admin', 'password'), { code: 'TIMEOUT' });
});

test('token that expires during profile request is rejected', async () => {
  let now = 1000;
  const { client } = setup([], {
    clock: () => now,
    fetchImpl: async (url) => {
      if (url.endsWith('/login')) return json({ ...token, expiresIn: 1 });
      now = 2001;
      return json(admin);
    },
  });
  await assert.rejects(client.login('admin', 'password'), { code: 'INVALID_RESPONSE' });
});

test('enrollment requests Core session with JWT but never sends browser-supplied Admin ID', async () => {
  const { client, calls } = setup([json({ data: enrollment })]);
  assert.deepEqual(await client.createEnrollment(session), enrollment);
  assert.equal(calls[0].url, 'http://gateway.test/api/auth/face/sessions');
  assert.deepEqual(JSON.parse(calls[0].options.body), { purpose: 'ENROLL' });
  assert.equal(calls[0].options.headers.Authorization, `Bearer ${token.accessToken}`);
  assert.equal(calls[0].options.headers['X-Service-Token'], undefined);
});

test('enrollment rejects expired, non-password, locked and mock sessions before network', async () => {
  for (const patch of [{ expiresAt: 999 }, { method: 'FACE' }, { accessToken: 'mock-only-demo' },
    { user: { ...admin, role: 'TENANT' } }, { user: { ...admin, status: 'LOCKED' } }]) {
    const { client, calls } = setup([]);
    await assert.rejects(client.createEnrollment({ ...session, ...patch }), { code: 'PASSWORD_LOGIN_REQUIRED' });
    assert.equal(calls.length, 0);
  }
});

test('enrollment rejects wrong purpose, invalid session ID and invalid expiry from Core', async () => {
  for (const patch of [{ purpose: 'LOGIN' }, { authSessionId: 'short' }, { authSessionId: 'a'.repeat(129) },
    { expiresAt: 0 }, { expiresAt: '90' }, { expiresAt: 1e100 }]) {
    const { client } = setup([json({ ...enrollment, ...patch })]);
    await assert.rejects(client.createEnrollment(session), { code: 'INVALID_RESPONSE' });
  }
});

test('missing enrollment endpoint is reported rather than creating a local session', async () => {
  const { client } = setup([json({}, 404)]);
  await assert.rejects(client.createEnrollment(session), { code: 'API_NOT_READY' });
});

test('enrollment rejects JWT that expires while Core creates session', async () => {
  let now = 1000;
  const { client } = setup([], {
    clock: () => now,
    fetchImpl: async () => { now = session.expiresAt; return json(enrollment); },
  });
  await assert.rejects(client.createEnrollment(session), { code: 'INVALID_RESPONSE' });
});

test('stopping enrollment cancels in-flight Core request', async () => {
  const controller = new AbortController();
  const { client } = setup([], {
    fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      controller.abort();
    }),
  });
  await assert.rejects(client.createEnrollment(session, controller.signal), { name: 'AbortError' });
});

test('already stopped enrollment sends no Core request', async () => {
  const controller = new AbortController();
  controller.abort();
  const { client, calls } = setup([]);
  await assert.rejects(client.createEnrollment(session, controller.signal), { name: 'AbortError' });
  assert.equal(calls.length, 0);
});

test('face login creates anonymous LOGIN session without username, Admin ID, password or JWT', async () => {
  const { client, calls } = setup([json({ data: loginTicket })]);
  assert.deepEqual(await client.createFaceLogin(), loginTicket);
  assert.equal(calls[0].url, 'http://gateway.test/api/auth/face/sessions');
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(calls[0].options.body), { purpose: 'LOGIN' });
});

test('face login refuses missing browser binding secret, expired session or wrong purpose', async () => {
  for (const patch of [{ completionToken: undefined }, { completionToken: 'short' },
    { completionToken: 'a'.repeat(257) }, { purpose: 'ENROLL' }, { expiresAt: 0 },
    { expiresAt: '90' }, { expiresAt: 1e100 }, { authSessionId: 'short' }]) {
    const { client } = setup([json({ ...loginTicket, ...patch })]);
    await assert.rejects(client.createFaceLogin(), { code: 'INVALID_RESPONSE' });
  }
});

test('face completion sends secret only to Core and validates JWT through /me', async () => {
  const { client, calls } = setup([json({ data: token }), json({ data: admin })]);
  const result = await client.completeFaceLogin(loginTicket, 'SUCCEEDED');
  assert.equal(result.method, 'FACE');
  assert.equal(result.user.id, admin.id);
  assert.equal(calls[0].url, 'http://gateway.test/api/auth/face/complete');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    authSessionId: loginTicket.authSessionId, completionToken: loginTicket.completionToken,
  });
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(calls[1].options.headers.Authorization, `Bearer ${token.accessToken}`);
});

test('failed or unfinished Face result never triggers JWT completion', async () => {
  for (const status of ['FAILED', 'IN_PROGRESS', 'UNKNOWN']) {
    const { client, calls } = setup([]);
    await assert.rejects(client.completeFaceLogin(loginTicket, status), { code: 'FACE_NOT_VERIFIED' });
    assert.equal(calls.length, 0);
  }
});

test('face completion rejects expired tickets before network', async () => {
  const { client, calls } = setup([]);
  await assert.rejects(client.completeFaceLogin({ ...loginTicket, expiresAt: 0 }, 'SUCCEEDED'), { code: 'INVALID_RESPONSE' });
  assert.equal(calls.length, 0);
});

test('face completion still rejects non-Admin or locked profiles', async () => {
  for (const patch of [{ role: 'TENANT' }, { status: 'LOCKED' }]) {
    const { client } = setup([json(token), json({ ...admin, ...patch })]);
    await assert.rejects(client.completeFaceLogin(loginTicket, 'SUCCEEDED'), { code: 'ADMIN_REQUIRED' });
  }
});

test('Face success cannot substitute for Core JWT or bypass unavailable Core', async () => {
  for (const response of [json({ status: 'SUCCEEDED' }), json({}, 503), json({ ...token, accessToken: 'mock-only-fake' })]) {
    const { client } = setup([response]);
    await assert.rejects(client.completeFaceLogin(loginTicket, 'SUCCEEDED'));
  }
});

test('retry after failed completion keeps the original Core ticket', async () => {
  const { client, calls } = setup([new Error('response lost'), json(token), json(admin)]);
  await assert.rejects(client.completeFaceLogin(loginTicket, 'SUCCEEDED'), { code: 'NETWORK_ERROR' });
  await client.completeFaceLogin(loginTicket, 'SUCCEEDED');
  assert.equal(calls[0].options.body, calls[1].options.body);
  assert.equal(calls.filter((call) => call.url.endsWith('/sessions')).length, 0);
});

test('stopped face login does not create or complete a Core session', async () => {
  const controller = new AbortController();
  controller.abort();
  const { client, calls } = setup([]);
  await assert.rejects(client.createFaceLogin(controller.signal), { name: 'AbortError' });
  await assert.rejects(client.completeFaceLogin(loginTicket, 'SUCCEEDED', controller.signal), { name: 'AbortError' });
  assert.equal(calls.length, 0);
});

test('cancelled profile request cannot finish face login after JWT has been received', async () => {
  const controller = new AbortController();
  const { client } = setup([], {
    fetchImpl: async (url) => {
      if (url.endsWith('/complete')) return json(token);
      controller.abort();
      return json(admin);
    },
  });
  await assert.rejects(client.completeFaceLogin(loginTicket, 'SUCCEEDED', controller.signal), { name: 'AbortError' });
});
