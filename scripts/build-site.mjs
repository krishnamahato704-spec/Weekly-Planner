import fs from 'node:fs';
import path from 'node:path';
import { build as buildClient } from 'vite';
import { build as buildWorker } from 'esbuild';

await buildClient({ build: { outDir: 'dist/client' } });
const root = path.resolve('dist/client');
const assets = {};
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(filename);
    else {
      const contentType = contentTypes[path.extname(filename)];
      if (!contentType) throw new Error(`Unsupported embedded asset: ${filename}`);
      const name = '/' + path.relative(root, filename).split(path.sep).join('/');
      assets[name] = { body: fs.readFileSync(filename, 'utf8'), contentType };
    }
  }
}
collect(root);
await buildWorker({ entryPoints: ['worker.ts'], outfile: 'dist/server/index.js', bundle: true, minify: true, platform: 'browser', format: 'esm', target: 'es2022', define: { __PLANNER_ASSETS__: JSON.stringify(assets) } });
console.log(`Built planner Worker with ${Object.keys(assets).length} public assets.`);
