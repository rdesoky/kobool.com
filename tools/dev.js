'use strict';

const { spawn } = require('child_process');
const chokidar = require('chokidar');
const livereload = require('livereload');

function build() {
  return new Promise((resolve, reject) => {
    const p = spawn('node', ['tools/build.js'], { stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('build failed'))));
  });
}

(async () => {
  await build();

  // Bind explicitly to IPv4. The default "localhost" resolves to ::1 on
  // Windows, so a browser connecting to 127.0.0.1 gets ERR_CONNECTION_REFUSED.
  //
  // Do NOT watch dist/: the build writes there incrementally, so watching it
  // would reload the browser mid-build and serve a half-written page. The
  // reload is triggered explicitly after build() resolves instead.
  const lr = livereload.createServer({ port: 35729, host: '127.0.0.1' });

  const serve = spawn('node', ['tools/serve.js'], { stdio: 'inherit' });

  const watcher = chokidar.watch(
    ['v2', 'v3', 'shared', 'images', 'index.html', '404.html'],
    { ignoreInitial: true }
  );
  let rebuilding = false;
  const rebuild = async () => {
    if (rebuilding) return;
    rebuilding = true;
    try {
      await build();
      // Only reload once the whole build (including minification) is done.
      lr.refresh('/');
    } catch (e) { console.error(e && e.message); }
    rebuilding = false;
  };
  watcher.on('all', rebuild);

  process.on('SIGINT', () => { serve.kill(); process.exit(0); });
  process.on('SIGTERM', () => { serve.kill(); process.exit(0); });
})().catch((err) => { console.error(err); process.exit(1); });