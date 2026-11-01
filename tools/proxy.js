'use strict';

/**
 * Same-origin proxy for /cgi-bin/* -> https://dev.kobool.com/cgi-bin/*
 * (dev.kobool.com is the current API host and serves https; api.kobool.com
 * is not ready yet.)
 *
 * Used by tools/serve.js (local development) and by the private admin CLI.
 * Forwards method, Content-Type, sid, status and body. No caching.
 *
 * Override the target with KOBOOL_API_TARGET to point at a different backend.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const DEFAULT_TARGET = process.env.KOBOOL_API_TARGET || 'https://dev.kobool.com';
const FORWARDED_HEADERS = ['content-type', 'sid', 'accept', 'authorization', 'cookie'];

function createProxy(options) {
    const target = new URL(options.target || DEFAULT_TARGET);
    const prefix = options.prefix || '/cgi-bin/';
    const allowlist = options.allowlist || null; // array of path prefixes, or null for all
    const transport = target.protocol === 'https:' ? https : http;

    return function proxy(req, res) {
        const url = new URL(req.url, 'http://localhost');

        if (!url.pathname.startsWith(prefix)) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not a proxied path');
            return;
        }

        if (allowlist && !allowlist.some((p) => url.pathname.startsWith(p))) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Path not allowed by proxy allowlist');
            return;
        }

        const headers = {};
        for (const name of FORWARDED_HEADERS) {
            if (req.headers[name] !== undefined) {
                headers[name] = req.headers[name];
            }
        }
        headers.host = target.host;

        const upstreamPath = url.pathname + url.search;
        const upstream = transport.request(
            {
                protocol: target.protocol,
                hostname: target.hostname,
                port: target.port || (target.protocol === 'https:' ? 443 : 80),
                method: req.method,
                path: upstreamPath,
                headers
            },
            (upRes) => {
                const outHeaders = {};
                for (const [name, value] of Object.entries(upRes.headers)) {
                    // Strip hop-by-hop and CORS headers; the browser talks to us same-origin.
                    if (name === 'transfer-encoding' || name === 'connection') continue;
                    if (name.startsWith('access-control-')) continue;
                    outHeaders[name] = value;
                }
                outHeaders['cache-control'] = 'no-store';
                res.writeHead(upRes.statusCode || 502, outHeaders);
                upRes.pipe(res);
            }
        );

        upstream.on('error', (err) => {
            if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
            }
            res.end('Upstream error: ' + err.message);
        });

        req.pipe(upstream);
    };
}

module.exports = { createProxy, DEFAULT_TARGET };
