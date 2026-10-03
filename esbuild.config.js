const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const WebSocket = require('ws');

const isWatch = process.argv.includes('--watch');
const distDir = path.resolve(__dirname, 'dist');
const DEV_RELOAD_FLAG = 'dev-reload.json';
const DEV_RELOAD_PORT = 9876;

const bundleConfigs = [
  {
    entryPoints: ['src/panel/main.tsx'],
    outfile: 'dist/panel.js',
    define: { 'process.env.NODE_ENV': '"production"' },
  },
  { entryPoints: ['src/background/index.ts'], outfile: 'dist/background.js' },
  { entryPoints: ['src/content/index.ts'], outfile: 'dist/content.js' },
].map((opts) => ({
  bundle: true,
  platform: 'browser',
  target: ['chrome100'],
  sourcemap: true,
  format: 'iife',
  ...opts,
}));

const panelHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manifest</title>
  <link rel="stylesheet" href="panel.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="min-h-screen bg-bg font-sans antialiased text-text">
  <div id="root"></div>
  <script src="panel.js"></script>
</body>
</html>`;

async function writeAssets() {
  fs.mkdirSync(distDir, { recursive: true });

  // 1. Panel CSS through Tailwind/PostCSS; content CSS + history hook as-is
  //    (content.css is injected into web pages and must not carry Tailwind preflight)
  const panelCss = fs.readFileSync(
    path.resolve(__dirname, 'src/panel/style.css'),
    'utf8'
  );
  const compiled = await postcss([tailwindcss, autoprefixer]).process(panelCss, {
    from: path.resolve(__dirname, 'src/panel/style.css'),
  });
  fs.writeFileSync(path.resolve(distDir, 'panel.css'), compiled.css, 'utf8');
  fs.copyFileSync(
    path.resolve(__dirname, 'src/content/style.css'),
    path.resolve(distDir, 'content.css')
  );
  fs.copyFileSync(
    path.resolve(__dirname, 'src/content/history-hook.js'),
    path.resolve(distDir, 'history-hook.js')
  );

  // 2. Generate dist/panel.html
  fs.writeFileSync(path.resolve(distDir, 'panel.html'), panelHtml, 'utf8');

  // 3. Copy icons to dist/icons and dist/public/icons
  const iconsDist = path.resolve(distDir, 'icons');
  const publicIconsDist = path.resolve(distDir, 'public/icons');
  fs.mkdirSync(iconsDist, { recursive: true });
  fs.mkdirSync(publicIconsDist, { recursive: true });

  const iconsSrc = path.resolve(__dirname, 'public/icons');
  if (fs.existsSync(iconsSrc)) {
    const files = fs.readdirSync(iconsSrc);
    for (const file of files) {
      fs.copyFileSync(path.join(iconsSrc, file), path.join(iconsDist, file));
      fs.copyFileSync(path.join(iconsSrc, file), path.join(publicIconsDist, file));
    }
  }

  // 4. Generate dist/manifest.json
  const distManifest = {
    manifest_version: 3,
    name: "Manifest",
    description: "Select any element on a web page, edit its text/colors/fonts, and generate a prompt for your agent IDE",
    version: "1.0.0",
    permissions: [
      "activeTab",
      "scripting",
      "sidePanel",
      "storage",
      "tabs"
    ],
    action: {
      default_title: "Manifest",
      default_icon: {
        "16": "icons/icon16.svg",
        "48": "icons/icon48.svg",
        "128": "icons/icon128.svg"
      }
    },
    background: {
      service_worker: "background.js"
    },
    side_panel: {
      default_path: "panel.html"
    },
    content_scripts: [
      {
        matches: ["http://*/*", "https://*/*"],
        js: ["content.js"],
        css: ["content.css"],
        run_at: "document_idle"
      },
      {
        matches: ["http://*/*", "https://*/*"],
        js: ["history-hook.js"],
        world: "MAIN",
        run_at: "document_start"
      }
    ],
    icons: {
      "16": "icons/icon16.svg",
      "48": "icons/icon48.svg",
      "128": "icons/icon128.svg"
    }
  };

  fs.writeFileSync(
    path.resolve(distDir, 'manifest.json'),
    JSON.stringify(distManifest, null, 2),
    'utf8'
  );
}

async function buildOnce() {
  console.log('Building Manifest extension...');
  await Promise.all(bundleConfigs.map((opts) => esbuild.build(opts)));
  await writeAssets();
  // A production build must never ship the dev auto-reload flag
  fs.rmSync(path.join(distDir, DEV_RELOAD_FLAG), { force: true });
  console.log('Build successful! Extension bundles generated in dist/');
}

function startReloadServer() {
  const wss = new WebSocket.Server({ port: DEV_RELOAD_PORT });
  wss.on('error', (err) => console.warn('Reload server error:', err.message));
  console.log(`Dev reload server listening on ws://127.0.0.1:${DEV_RELOAD_PORT}`);
  return {
    broadcast(msg) {
      for (const client of wss.clients) {
        try {
          client.send(msg);
        } catch {
          // client vanished between iterations
        }
      }
    },
  };
}

async function watchMode() {
  const reloadServer = startReloadServer();
  fs.writeFileSync(
    path.join(distDir, DEV_RELOAD_FLAG),
    JSON.stringify({ port: DEV_RELOAD_PORT }),
    'utf8'
  );

  await writeAssets();

  // One save can rebuild several bundles; coalesce into a single reload signal
  let pending = null;
  const scheduleRebuild = () => {
    if (pending) return;
    pending = setTimeout(async () => {
      pending = null;
      try {
        await writeAssets();
        reloadServer.broadcast('reload');
        console.log('Rebuilt — extension reload signalled');
      } catch (err) {
        console.error('Rebuild asset step failed:', err);
      }
    }, 120);
  };

  const contexts = await Promise.all(
    bundleConfigs.map((opts) =>
      esbuild.context({
        ...opts,
        plugins: [
          {
            name: 'manifest-reload',
            setup(build) {
              // The JS watch API has no rebuild callback; onEnd marks each rebuild
              build.onEnd((result) => {
                if (result.errors.length > 0) {
                  console.error('Rebuild failed:', result.errors[0].text);
                  return;
                }
                scheduleRebuild();
              });
            },
          },
        ],
      })
    )
  );
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log('Watching for changes... the extension reloads itself on rebuild.');
  console.log('Note: content-script changes on already-open pages need one page refresh.');
}

(async () => {
  if (isWatch) {
    await watchMode();
  } else {
    await buildOnce();
  }
})().catch((err) => {
  console.error('Build error:', err);
  process.exit(1);
});
