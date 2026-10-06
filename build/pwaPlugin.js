import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { buildSync } from "esbuild";
import { bootRecovery } from "../src/bootRecovery.js";

// Include the actual built shell, not source filenames or a manually bumped version.
export function stampServiceWorker(outDir) {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name !== "sw.js") files.push(relative(outDir, path).replaceAll("\\", "/"));
    }
  };
  walk(outDir);
  files.sort();
  const workerPath = join(outDir, "sw.js");
  const template = readFileSync(workerPath, "utf8");
  const hash = createHash("sha256").update(template);
  for (const file of files) hash.update(file).update(readFileSync(join(outDir, file)));
  const version = hash.digest("hex").slice(0, 16);
  writeFileSync(workerPath, template
    .replace('"__BUILD_VERSION__"', JSON.stringify(version))
    .replace('["__PRECACHE_FILES__"]', JSON.stringify(files)));
  return { version, files };
}

export function pwaBuildPlugin() {
  let config;
  return {
    name: "sab-tools-offline-shell",
    apply: "build",
    configResolved(resolved) { config = resolved; },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace("<!-- BOOT_RECOVERY -->", `<script>(${bootRecovery.toString()})()</script>`);
      },
    },
    closeBundle() {
      const out = join(config.root, config.build.outDir);
      const env = config.env;
      const pushConfig = env.VITE_FIREBASE_VAPID_KEY ? Object.fromEntries([
        ["apiKey",env.VITE_FIREBASE_API_KEY],["authDomain",env.VITE_FIREBASE_AUTH_DOMAIN],
        ["projectId",env.VITE_FIREBASE_PROJECT_ID],["messagingSenderId",env.VITE_FIREBASE_MESSAGING_SENDER_ID],
        ["appId",env.VITE_FIREBASE_APP_ID],
      ]) : null;
      const bundled = buildSync({ entryPoints:[join(config.root,"src/pushWorker.js")], bundle:true,
        write:false, format:"iife", platform:"browser", minify:true,
        define:{__FIREBASE_PUSH_CONFIG__:JSON.stringify(pushConfig)} }).outputFiles[0].text;
      writeFileSync(join(out,"sw.js"), readFileSync(join(out,"sw.js"),"utf8") + "\n" + bundled);
      stampServiceWorker(out);
    },
  };
}
