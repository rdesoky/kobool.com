'use strict';

/**
 * Local development server.
 *
 *   node tools/serve.js [--port=8080] [--prod-api]
 *
 * Serves dist/ at the root and proxies /cgi-bin/ to the API host so the
 * browser sees a single origin (no CORS in development).
 *
 * If the requested port is already in use, the server increments the port and
 * retries until it finds a free one (default starts at 8080).
 *
 * The proxy skips upstream TLS certificate verification for https targets:
 * local API hosts are often signed by a locally-installed CA that Node does
 * not trust by default.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { createProxy, DEFAULT_TARGET } = require('./proxy');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

function parseArgs(argv) {
    const args = { port: 8080, prodApi: false };
    for (const arg of argv.slice(2)) {
        if (arg.startsWith('--port=')) args.port = parseInt(arg.slice(7), 10);
        else if (arg === '--prod-api') args.prodApi = true;
    }
    return args;
}

function createServer(options) {
    const root = options.root || path.join(__dirname, '..', 'dist');
    const proxy = createProxy({
        target: options.target || DEFAULT_TARGET,
        rejectUnauthorized: false
    });

    return http.createServer((req, res) => {
        if (req.url.startsWith('/cgi-bin/')) {
            proxy(req, res);
            return;
        }

        const url = new URL(req.url, 'http://localhost');
        let filePath = path.join(root, decodeURIComponent(url.pathname));

        // Prevent path traversal outside the served root.
        if (!path.resolve(filePath).startsWith(path.resolve(root))) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        if (!fs.existsSync(filePath)) {
            const notFound = path.join(root, '404.html');
            if (fs.existsSync(notFound)) {
                res.writeHead(404, { 'Content-Type': MIME['.html'] });
                res.end(fs.readFileSync(notFound));
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Not found: ' + url.pathname);
            }
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        if (ext === '.html') {
            let html = fs.readFileSync(filePath, 'utf8');
            if (!html.includes('livereload.js')) {
                html = html.replace('</body>', '<script src="http://127.0.0.1:35729/livereload.js?snipver=1"></script></body>');
            }
            res.end(html);
            return;
        }
        fs.createReadStream(filePath).pipe(res);
    });
}

const MAX_PORT = 65535;

if (require.main === module) {
    const args = parseArgs(process.argv);
    const server = createServer({});
    // Print once, whatever attempt ultimately binds (the per-listen callback
    // would fire once per retry).
    server.once('listening', () => {
        const port = server.address().port;
        console.log(`Serving dist/ at http://127.0.0.1:${port}`);
        console.log(`Proxying /cgi-bin/ -> ${DEFAULT_TARGET}/cgi-bin/`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && args.port < MAX_PORT) {
            console.warn(`Port ${args.port} is in use; trying ${args.port + 1}`);
            args.port += 1;
            server.listen(args.port, '127.0.0.1');
        } else {
            throw err;
        }
    });
    server.listen(args.port, '127.0.0.1');
}

module.exports = { createServer, parseArgs };
