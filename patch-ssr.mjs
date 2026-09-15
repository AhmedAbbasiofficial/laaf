import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const INLINED_FN = `var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) Object.defineProperty(target, name, { enumerable: true, get: all[name] });
	return target;
};`;

const cwd = process.cwd();

// Patch both .vercel and .output SSR directories
const dirs = [
  join(cwd, ".vercel", "output", "functions", "__server.func", "_ssr"),
  join(cwd, ".output", "server", "_ssr"),
];

let totalPatched = 0;

for (const ssrDir of dirs) {
  try {
    const files = readdirSync(ssrDir).filter(
      (f) => f.startsWith("router") && f.endsWith(".mjs"),
    );

    for (const file of files) {
      const filePath = join(ssrDir, file);
      let content = readFileSync(filePath, "utf8");
      let changed = false;

      // Step 1: Remove "X as __exportAll" from any import statement
      if (content.includes(" as __exportAll")) {
        content = content.replace(/,\s*[a-zA-Z0-9_$]+\s+as\s+__exportAll/g, "")
                         .replace(/[a-zA-Z0-9_$]+\s+as\s+__exportAll\s*,?/g, "");
        changed = true;
      }

      // Step 2: If this file references __exportAll but doesn't define it, inline it
      if (content.includes("__exportAll") && !/var __exportAll\s*=/.test(content)) {
        const lines = content.split("\n");
        let lastImportIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith("import ")) {
            lastImportIdx = i;
          }
        }
        lines.splice(lastImportIdx + 1, 0, INLINED_FN);
        content = lines.join("\n");
        changed = true;
      }

      if (changed) {
        writeFileSync(filePath, content, "utf8");
        totalPatched++;
        console.log(`[patch-ssr] Patched ${file} in ${ssrDir.includes(".vercel") ? ".vercel" : ".output"} (${Math.round(content.length / 1024)}KB)`);
      }
    }
  } catch (e) {
    if (e.code !== "ENOENT") {
      console.error(`[patch-ssr] Error in ${ssrDir}:`, e.message);
    }
  }
}

if (totalPatched === 0) {
  console.log("[patch-ssr] No router files needed patching");
} else {
  console.log(`[patch-ssr] Patched ${totalPatched} file(s) total`);
}
