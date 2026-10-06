import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerPWA } from "../src/pwa.js";
import { stampServiceWorker } from "../build/pwaPlugin.js";

class Target extends EventEmitter {
  addEventListener(type, fn) { this.on(type, fn); }
  append(...nodes) { this.children ??= []; this.children.push(...nodes); }
  setAttribute() {}
}
async function setup({ elapsed = 0, interaction = false, waiting = true } = {}) {
  const sent = [], sw = new Target(), reg = new Target(), doc = new Target(), win = new Target();
  let reloads = 0, updates = 0, clock = 0;
  const worker = { postMessage: (message) => sent.push(message) };
  reg.waiting = waiting ? worker : null;
  reg.update = async () => { updates++; };
  sw.controller = {};
  sw.register = async (url, options) => { assert.equal(url, "/SAB-TOOLS/sw.js"); assert.equal(options.updateViaCache, "none"); return reg; };
  doc.body = new Target(); doc.readyState = "complete"; doc.visibilityState = "visible";
  doc.createElement = () => new Target();
  win.location = { reload: () => { reloads++; } }; win.confirm = () => true;
  registerPWA({ win, nav: { serviceWorker: sw }, doc, base: "/SAB-TOOLS/", now: () => clock });
  clock = elapsed;
  if (interaction) doc.emit("input");
  await new Promise((resolve) => setImmediate(resolve));
  return { sent, sw, reg, doc, win, worker, reloads: () => reloads, updates: () => updates };
}
test("launch actively checks and activates a waiting worker without HTTP cache", async () => {
  const s = await setup();
  assert.equal(s.updates(), 1); assert.deepEqual(s.sent, [{ type: "ACTIVATE_UPDATE", explicit: false }]);
  s.sw.emit("controllerchange"); s.sw.emit("controllerchange"); assert.equal(s.reloads(), 1);
});
test("interaction/slow startup defers updates to an explicit button", async () => {
  for (const options of [{ interaction: true }, { elapsed: 11000 }]) {
    const s = await setup(options);
    assert.equal(s.sent.length, 0); assert.equal(s.doc.body.children.length, 1);
    const button = s.doc.body.children[0].children[1];
    s.win.confirm = () => false; button.emit("click"); assert.equal(s.sent.length, 0);
    s.win.confirm = () => true; button.emit("click");
    assert.equal(s.sent[0].explicit, true);
    s.sw.emit("controllerchange"); assert.equal(s.reloads(), 1);
  }
});
test("typing during activation does not cause an automatic reload", async () => {
  const s = await setup(); s.reg.waiting = null; s.doc.emit("input"); s.sw.emit("controllerchange");
  assert.equal(s.reloads(), 0); assert.equal(s.doc.body.children.length, 1);
  s.doc.body.children[0].children[1].emit("click"); assert.equal(s.reloads(), 1);
});
test("background resume/online updates only prompt, and another tab is protected", async () => {
  const s = await setup({ waiting: false });
  s.win.emit("online"); s.doc.emit("visibilitychange");
  assert.equal(s.updates(), 3);
  s.reg.waiting = s.worker; s.reg.installing = new Target(); s.reg.installing.state = "installed";
  s.reg.emit("updatefound"); s.reg.installing.emit("statechange");
  assert.equal(s.sent.length, 0); assert.equal(s.doc.body.children.length, 1);
  const launch = await setup(); launch.sw.emit("message", { data: { type: "UPDATE_NEEDS_CONFIRMATION" } });
  assert.equal(launch.doc.body.children.length, 1);
  launch.sw.emit("controllerchange"); assert.equal(launch.reloads(), 0);
});
test("build stamps every shell asset and changes worker when any built content changes", () => {
  const dir = mkdtempSync(join(tmpdir(), "sab-pwa-"));
  try {
    const template = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
    mkdirSync(join(dir, "assets")); writeFileSync(join(dir, "index.html"), "A");
    writeFileSync(join(dir, "assets", "index-hash.js"), "bundle A"); writeFileSync(join(dir, "sw.js"), template);
    const a = stampServiceWorker(dir); assert.deepEqual(a.files, ["assets/index-hash.js", "index.html"]);
    assert.ok(!readFileSync(join(dir, "sw.js"), "utf8").includes("__BUILD_VERSION__"));
    writeFileSync(join(dir, "index.html"), "B"); writeFileSync(join(dir, "sw.js"), template);
    const b = stampServiceWorker(dir); assert.notEqual(a.version, b.version);
    writeFileSync(join(dir, "sw.js"), template); assert.equal(stampServiceWorker(dir).version, b.version);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("worker scopes caching, protects other windows, and retires legacy marker", async () => {
  const { runInNewContext } = await import("node:vm");
  const events = {}, deleted = [];
  let skips = 0, windows = [{}, {}], waited;
  const self = { registration: { scope: "https://example.test/SAB-TOOLS/" }, location: { origin: "https://example.test" },
    addEventListener: (type, callback) => { events[type] = callback; },
    skipWaiting: async () => { skips++; }, clients: { matchAll: async () => windows, claim: async () => {} } };
  runInNewContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), { self, URL, Request, Response, fetch: async () => new Response("shell"),
    caches: { keys: async () => ["another-app-cache", "sab-tools-shell-v11", "sab-tools-shell-previous"],
      delete: async (key) => { deleted.push(key); }, open: async () => ({ put: async () => {} }) } });
  events.install({ waitUntil: (promise) => { waited = promise; } }); await waited;
  assert.equal(skips, 1);
  let prompted = false;
  events.message({ data: { type: "ACTIVATE_UPDATE", explicit: false }, source: { postMessage: () => { prompted = true; } },
    waitUntil: (promise) => { waited = promise; } }); await waited;
  assert.equal(skips, 1); assert.ok(prompted);
  windows = [{}];
  events.message({ data: { type: "ACTIVATE_UPDATE", explicit: false }, waitUntil: (promise) => { waited = promise; } }); await waited;
  assert.equal(skips, 2);
  events.activate({ waitUntil: (promise) => { waited = promise; } }); await waited;
  assert.deepEqual(deleted, ["sab-tools-shell-v11"]);
  for (const url of ["https://example.test/another-app/", "https://api.example.test/receipt"]) {
    events.fetch({ request: { url, method: "GET" }, respondWith: () => assert.fail("outside scope intercepted") });
  }
});

test("build injects rescue inline outside the hashed app module", async () => {
  const { pwaBuildPlugin } = await import("../build/pwaPlugin.js");
  const html = pwaBuildPlugin().transformIndexHtml.handler(readFileSync(new URL('../index.html', import.meta.url), 'utf8'));
  assert.ok(html.includes('<script>(function bootRecovery()'));
  assert.ok(!html.includes('<!-- BOOT_RECOVERY -->'));
  assert.ok(html.includes('data-sab-boot'));
  assert.ok(html.includes('REPAIR_SHELL'));
});

test("shell downloads bypass legacy cached URLs and failed repair does not write partial files", async () => {
  const { runInNewContext } = await import('node:vm');
  const events = {}, urls = [], writes = [];
  let failed = false, waited, replies = 0;
  const source = readFileSync(new URL('../public/sw.js', import.meta.url),'utf8')
    .replace('"__BUILD_VERSION__"','"test-release"').replace('["__PRECACHE_FILES__"]','["index.html","assets/app.js"]');
  const self = { registration:{scope:'https://example.test/SAB-TOOLS/'},
    addEventListener:(t,f)=>{events[t]=f},clients:{matchAll:async()=>[{}]},skipWaiting:async()=>{} };
  runInNewContext(source,{self,URL,Request,Response,fetch:async r=>{
    urls.push(r.url);return new Response('file',{status:failed&&r.url.includes('app.js')?404:200});
  },caches:{open:async()=>({put:async u=>writes.push(u)}),keys:async()=>[]}});
  events.install({waitUntil:p=>{waited=p}});await waited;
  assert.ok(urls.every(u=>u.endsWith('?__sab_release=test-release')));
  assert.deepEqual(writes,['https://example.test/SAB-TOOLS/index.html','https://example.test/SAB-TOOLS/assets/app.js']);
  writes.length=0;failed=true;
  events.message({data:{type:'REPAIR_SHELL'},source:{postMessage:()=>replies++},waitUntil:p=>{waited=p}});await waited;
  assert.equal(writes.length,0);assert.equal(replies,0);
});

test("inline recovery reloads once, stops after boot, and Retry is explicit", async () => {
  const { bootRecovery } = await import('../src/bootRecovery.js');
  const { runInNewContext } = await import('node:vm');
  for (const successful of [false,true]) {
    const sw = new Target(), win = new Target(), retry = new Target(), status = {}, storage = new Map();
    let reloads=0, mutation, timer, mounted=false, repairs=0;
    const root={childElementCount:1,querySelector:s=>s==='button'?retry:s==='[data-boot-status]'?status:mounted?null:{}};
    sw.controller={postMessage:()=>repairs++};sw.register=async()=>({update:async()=>{},addEventListener:()=>{}});
    runInNewContext(`(${bootRecovery.toString()})()`,{
      document:{getElementById:()=>root},navigator:{serviceWorker:sw},window:win,URL,
      location:{href:'https://example.test/SAB-TOOLS/',reload:()=>reloads++},
      MutationObserver:class {constructor(f){mutation=f}observe(){}disconnect(){}},
      sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
      setTimeout:f=>{timer=f},
    });
    if(successful){mounted=true;mutation()}
    timer();await new Promise(r=>setImmediate(r));
    sw.emit('message',{data:{type:'SHELL_REPAIRED'}});sw.emit('controllerchange');
    assert.equal(reloads,successful?0:1);assert.equal(repairs,successful?0:1);
    if(!successful){retry.emit('click');assert.equal(reloads,2);assert.equal(storage.size,0)}
  }
});

test("worker uses previous cached bundle on HTTP 404, not only offline exceptions", async () => {
  const { runInNewContext } = await import('node:vm');
  const events={},previous=new Response('previous bundle');let response;
  const self={registration:{scope:'https://example.test/SAB-TOOLS/'},location:{origin:'https://example.test'},addEventListener:(t,f)=>events[t]=f};
  runInNewContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{self,URL,Request,Response,
    caches:{open:async()=>({match:async()=>null}),match:async()=>previous},fetch:async()=>new Response('missing',{status:404})});
  events.fetch({request:{url:'https://example.test/SAB-TOOLS/assets/old.js',method:'GET'},respondWith:p=>response=p});
  assert.equal(await(await response).text(),'previous bundle');
});

test('notification tap on existing window checks update without automatic form reload',async()=>{
 const s=await setup({waiting:false});
 s.reg.waiting=s.worker;s.sw.emit('message',{data:{type:'UPDATE_FROM_NOTIFICATION'}});
 assert.equal(s.updates(),2);assert.equal(s.sent.length,0);assert.equal(s.doc.body.children.length,1);
});
