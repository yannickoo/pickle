import { build } from 'esbuild';
import { readdir, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';

const dist = 'dist';

await rm(dist, { recursive: true, force: true });

const shared = {
    bundle: true,
    minify: true,
    target: 'es2022',
    keepNames: true,
    legalComments: 'none',
    logLevel: 'info'
};

// ESM: a single self-contained bundle, so it works from a CDN without extra requests.
await build({
    ...shared,
    entryPoints: ['src/pickle.js'],
    outfile: `${dist}/pickle.esm.min.js`,
    format: 'esm'
});

// UMD: AMD, CommonJS or the global `Pickle`.
await build({
    ...shared,
    entryPoints: ['src/pickle.js'],
    outfile: `${dist}/pickle.umd.min.js`,
    format: 'iife',
    globalName: '__pickle',
    banner: {
        js: "(function(root,factory){typeof define==='function'&&define.amd?define([],factory):typeof module==='object'&&module.exports?module.exports=factory():root.Pickle=factory()})(typeof self!=='undefined'?self:this,function(){"
    },
    footer: { js: 'return __pickle.default});' }
});

// Individual modules, for users who import them directly.
const modules = await readdir('src/modules');
await build({
    ...shared,
    bundle: false,
    entryPoints: modules.map(file => `src/modules/${file}`),
    outdir: `${dist}/modules`,
    outExtension: { '.js': '.min.js' },
    format: 'esm'
});

// Core stylesheet and themes.
await build({
    ...shared,
    entryPoints: ['src/pickle.css'],
    outfile: `${dist}/pickle.min.css`
});

for (const theme of await readdir('src/themes')) {
    for (const file of await readdir(join('src/themes', theme))) {
        await build({
            ...shared,
            entryPoints: [join('src/themes', theme, file)],
            outfile: join(dist, 'theme', theme, `${basename(file, '.css')}.min.css`)
        });
    }
}
