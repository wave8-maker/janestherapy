const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
function load(file, mocks = {}) {
  const filename = path.resolve(file);
  const mod = new Module(filename, module);
  mod.paths = module.paths;
  const originalRequire = mod.require.bind(mod);
  mod.require = (name) =>
    Object.prototype.hasOwnProperty.call(mocks, name)
      ? mocks[name]
      : originalRequire(name);
  mod._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    filename,
  );
  return mod.exports;
}
const { validateProfile, validateSession, validateNote, matchesClient } = load(
  "app/lib/client-types.ts",
);
test("manual profile needs only a name; rejects missing names and invalid dates", () => {
  assert.equal(validateProfile({ name: " Jane " }).name, "Jane");
  assert.throws(() => validateProfile({ name: "  " }));
  assert.throws(() =>
    validateProfile({ name: "Jane", birthday: "2026-02-30" }),
  );
  assert.throws(() => validateProfile({ name: "Jane", email: "broken" }));
});
test("massage can contain just a date and notes, but validates duration and content", () => {
  const note = validateSession({
    date: "2026-09-28",
    notes: "Shoulders felt better",
  });
  assert.equal(note.notes, "Shoulders felt better");
  assert.equal(note.duration, "");
  assert.throws(() => validateSession({ date: "2026-13-01", notes: "test" }));
  assert.throws(() =>
    validateSession({ date: "2026-09-28", duration: "-1", notes: "test" }),
  );
  assert.throws(() => validateSession({ date: "2026-09-28" }));
});
test("notes cannot be empty and pin must be a boolean", () => {
  assert.throws(() => validateNote({ text: "   " }));
  assert.throws(() => validateNote({ text: "test", pinned: "false" }));
  assert.deepEqual(validateNote({ text: " Prefers quiet ", pinned: true }), {
    text: "Prefers quiet",
    pinned: true,
  });
});
test("search ignores phone punctuation and email case", () => {
  const client = {
    name: "Jane Example",
    phone: "(408) 555-1234",
    email: "Jane@Example.com",
  };
  assert.ok(matchesClient(client, "4085551234"));
  assert.ok(matchesClient(client, "jane@example.COM"));
  assert.ok(matchesClient(client, "example"));
  assert.equal(matchesClient(client, "99999"), false);
});

const os = require("node:os");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "jane-clients-test-"));
const originalCwd = process.cwd();
process.chdir(temporary);
const store = load(path.join(originalCwd, "app/lib/client-storage.ts"));
process.chdir(originalCwd);
const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
const originalVercel = process.env.VERCEL;
const { after } = require("node:test");
after(() => {
  fs.rmSync(temporary, { recursive: true, force: true });
  if (originalToken) process.env.BLOB_READ_WRITE_TOKEN = originalToken;
  if (originalVercel) process.env.VERCEL = originalVercel;
});
test("local storage persists, rejects stale edits and preserves concurrent additions", async () => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.VERCEL;
  await store.writeRecord("profiles/test-client", {
    name: "Test",
    sessions: [],
  });
  const initial = await store.readRecord("profiles/test-client");
  assert.equal(initial.value.name, "Test");
  await assert.rejects(
    store.writeRecord("profiles/test-client", { name: "Overwrite" }),
    store.RecordConflict,
  );
  await store.writeRecord(
    "profiles/test-client",
    { name: "Updated", sessions: ["one"] },
    initial.version,
  );
  await assert.rejects(
    store.writeRecord(
      "profiles/test-client",
      { name: "Stale" },
      initial.version,
    ),
    store.RecordConflict,
  );
  const current = await store.readRecord("profiles/test-client");
  const writes = await Promise.allSettled([
    store.writeRecord(
      "profiles/test-client",
      { name: "A", sessions: ["one", "two"] },
      current.version,
    ),
    store.writeRecord(
      "profiles/test-client",
      { name: "B", sessions: ["one", "three"] },
      current.version,
    ),
  ]);
  assert.equal(writes.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    (await store.readRecord("profiles/test-client")).value.sessions.length,
    2,
  );
  assert.equal((await store.listRecords("profiles")).length, 1);
  await assert.rejects(store.readRecord("profiles/../../secrets"));
});

test("admin API protects records and supports manual records and immutable intake links", async () => {
  let authenticated = false;
  const intake = {
    id: "intake-test",
    name: "Original signed name",
    signatureDataUrl: "signature",
  };
  const types = load("app/lib/client-types.ts");
  const routes = load("app/api/admin/clients/route.ts", {
    "@/app/lib/admin-auth": { isAdminAuthenticated: async () => authenticated },
    "@/app/lib/intake-storage": {
      getIntake: async (id) => (id === intake.id ? intake : null),
    },
    "@/app/lib/client-types": types,
    "@/app/lib/client-storage": store,
  });
  const request = (method, body, query = "") =>
    new Request(`http://localhost/api/admin/clients${query}`, {
      method,
      ...(body
        ? {
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
          }
        : {}),
    });
  for (const method of ["GET", "POST", "PATCH"])
    assert.equal((await routes[method](request(method))).status, 401);
  authenticated = true;
  assert.equal(
    (
      await routes.POST(
        request("POST", { id: "api-client", profile: { name: "API client" } }),
      )
    ).status,
    201,
  );
  assert.equal(
    (
      await routes.POST(
        request("POST", { id: "api-client", profile: { name: "Duplicate" } }),
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await routes.POST(
        request("POST", { id: "../bad", profile: { name: "Bad" } }),
      )
    ).status,
    400,
  );
  let current = (
    await (await routes.GET(request("GET", null, "?id=api-client"))).json()
  ).client;
  assert.equal(current.sessions.length, 0);
  const save = await routes.PATCH(
    request("PATCH", {
      id: "api-client",
      revision: current.revision,
      action: "session",
      recordId: "session-one",
      data: { date: "2026-09-28", notes: "Feeling better" },
    }),
  );
  assert.equal(save.status, 200);
  current = (await save.json()).client;
  assert.equal(current.sessions.length, 1);
  const stamp = current.sessions[0].createdAt;
  assert.equal(
    (
      await routes.PATCH(
        request("PATCH", {
          id: "api-client",
          revision: 1,
          action: "note",
          recordId: "note-one",
          data: { text: "stale" },
        }),
      )
    ).status,
    409,
  );
  current = (
    await (
      await routes.PATCH(
        request("PATCH", {
          id: "api-client",
          revision: current.revision,
          action: "session",
          recordId: "session-one",
          data: { date: "2026-09-28", notes: "Edited" },
        }),
      )
    ).json()
  ).client;
  assert.equal(current.sessions.length, 1);
  assert.equal(current.sessions[0].createdAt, stamp);
  current = (
    await (
      await routes.PATCH(
        request("PATCH", {
          id: "api-client",
          revision: current.revision,
          action: "note",
          recordId: "note-one",
          data: { text: "Prefers quiet", pinned: true },
        }),
      )
    ).json()
  ).client;
  assert.equal(current.notes[0].pinned, true);
  assert.equal(
    (
      await routes.PATCH(
        request("PATCH", {
          id: "api-client",
          action: "linkIntake",
          intakeId: intake.id,
        }),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await routes.PATCH(
        request("PATCH", {
          id: "api-client",
          action: "linkIntake",
          intakeId: intake.id,
        }),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await routes.PATCH(
        request("PATCH", {
          id: "test-client",
          action: "linkIntake",
          intakeId: intake.id,
        }),
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await routes.PATCH(
        request("PATCH", {
          id: "api-client",
          action: "linkIntake",
          intakeId: "nonexistent",
        }),
      )
    ).status,
    404,
  );
  const detail = await (
    await routes.GET(request("GET", null, "?id=api-client"))
  ).json();
  assert.equal(detail.links.length, 1);
  assert.equal(intake.name, "Original signed name");
  const listing = await (await routes.GET(request("GET"))).json();
  const summary = listing.clients.find((c) => c.id === "api-client");
  assert.equal(summary.sessionCount, 1);
  assert.equal(summary.lastVisit, "2026-09-28");
  assert.equal(summary.notes, undefined);
  assert.equal(summary.sessions, undefined);
});

test('private Blob reads bypass cache, list every page, and use conditional writes', async () => {
  const calls=[];
  const blobStore=load('app/lib/client-storage.ts',{'@vercel/blob':{
    get:async(key,options)=>{calls.push(['get',key,options]);return {stream:new Response(JSON.stringify({id:key})).body,blob:{etag:'version-1'}};},
    put:async(key,value,options)=>{calls.push(['put',key,options]);if(options.ifMatch==='stale')throw new Error('Precondition failed');},
    list:async(options)=>{calls.push(['list',options]);return options.cursor?{blobs:[{pathname:'clients/profiles/b.json'}],hasMore:false}:{blobs:[{pathname:'clients/profiles/a.json'}],hasMore:true,cursor:'page-2'};},
  }});
  process.env.BLOB_READ_WRITE_TOKEN='test-only-mock';
  try {
    assert.equal((await blobStore.listRecords('profiles')).length,2);
    assert.equal(calls.filter(c=>c[0]==='list').length,2);
    assert.ok(calls.filter(c=>c[0]==='get').every(c=>c[2].access==='private'&&c[2].useCache===false));
    await blobStore.writeRecord('profiles/a',{name:'Changed'},'version-1');
    const options=calls.find(c=>c[0]==='put')[2];
    assert.equal(options.ifMatch,'version-1');assert.equal(options.allowOverwrite,true);assert.equal(options.access,'private');
    await assert.rejects(blobStore.writeRecord('profiles/a',{},'stale'),blobStore.RecordConflict);
    await blobStore.writeRecord('profiles/new',{});
    assert.equal(calls.at(-1)[2].allowOverwrite,false);
  } finally {delete process.env.BLOB_READ_WRITE_TOKEN;}
});
