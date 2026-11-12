# kobool.com

Static frontend for kobool.com: pre-built HTML, CSS and JavaScript served from
a CDN.

Dynamic requests go to the CGI API under `/cgi-bin/` on a separate origin. The
API base is set per environment in `tools/build.js`.

## Layout

```text
index.html              v3 shell, served at /
v2/
  index.html            v2 shell
  pages/*.html          page fragments
  css/ images/ text/    v2 assets and string sources
  init_vars.js          JSLinks / CssLinks / PgLinks manifest
v3/
  pages/*.html          page fragments
  modules/ css/ font/   v3 assets
  text/                 string sources
  init.js               require config, CssLinks, PgLinks
shared/
  config.js             runtime config (apiBase, languages, analytics)
  strings.js            string bundle loader and data-* binder
  data/                 generated countries/options JSON
images/                 referenced root images
tools/                  build, serve, proxy, validate
tests/                  unit and smoke tests
```

`dist/` is the build output and is never committed.

## Commands

```bash
npm install
npm test              # unit + smoke tests
npm run build         # dev build (same-origin /cgi-bin/)
npm run build:staging # staging build (staging API)
npm run build:prod    # production build
npm run check         # validate dist/ before publishing
npm run serve         # local server on :8080 (next free port if busy) with a
                      # /cgi-bin/ proxy
```

Sites are served from a domain root, so URLs are root-absolute
(`/v3/css/base.css`). To preview a build under a subpath — for example a
GitHub Pages project site at `/<repo>/` — pass `--base`:

```bash
node tools/build.js --env=staging --base=/kobool.com --no-cname
node tools/validate.js --env=staging --base=/kobool.com
```

`--no-cname` is required for a project site. A GitHub Pages project site is
served from `<user>.github.io/<repo>/` and must not claim a custom domain: a
`CNAME` in the artifact makes Pages try to provision a TLS certificate for a
host that has no HTTPS, which fails and leaves the site stuck on "certificate
does not exist yet". `npm run check` fails a `--base` build that still contains
a `CNAME`.

A domain-root deployment does **not** use `--base`: URLs stay root-absolute and
the build writes the `CNAME` that claims the domain.

`--api-base=<url>` overrides the environment's API base:

```bash
node tools/build.js --env=staging --api-base=https://api.example.com/cgi-bin/
```

The build also rewrites hardcoded `src="/cgi-bin/kpic.pl?..."` attributes in
the page fragments to the environment's API base. Those fragments are shared by
every environment, and the site origin serves static files only, so without the
rewrite every profile picture 404s on staging and production. The picture
uploader form is deliberately left same-origin: it posts into an iframe whose
response calls `window.parent.UpdatePics`, which a cross-origin response cannot
reach.

`npm run serve` proxies `/cgi-bin/` to the API domain (override with
`KOBOOL_API_TARGET`) so the browser sees a single origin during development.
Point it elsewhere with `KOBOOL_API_TARGET=<apis-domain>`. If port 8080 is
already in use, the server tries the next port (8081, 8082, …) until it finds a
free one and logs the URL.

The dev proxy skips upstream TLS certificate verification for `https` targets:
a local API host may present a certificate signed by a locally-installed CA
that Node does not trust by default. Without this, every proxied call fails the
handshake and returns 502.

The app also detects when it is served from `localhost` / `127.0.0.1` and forces
the API base back to the same-origin `/cgi-bin/`, so any environment build
previewed locally stays same-origin and goes through the proxy.

## Strings and data

Page copy is declared in markup rather than built by server-side templates.

- `shared/strings.js` loads the locale bundles and exposes the globals the
  modules use: `RS`, `RAS`, `_S`, `_PS`, `_HS`.
- Pages declare their strings declaratively:

  | Attribute | Meaning |
  | --- | --- |
  | `data-string="source:key"` | set the element's text/HTML |
  | `data-string-attr="title"` | set an attribute instead of content |
  | `data-string-template="---{s}---"` | wrap the value in literal text |
  | `data-visible-if="member\|guest"` | toggle from session state |
  | `data-options="countries"` | populate a `<select>` from `shared/data` |

`data-visible-if` is deliberately distinct from `k-template`'s `data-show-if`,
which evaluates a `(? ... ?)` expression against page data.

Shared fragments keep repeated markup in one file. A page pulls one in with
an empty element that names it:

```html
<div class="indent" data-fragment="/v2/pages/reg_form.html"></div>
```

`tools/build.js` replaces the element's content with the fragment, keeps the
wrapper (and its attributes, such as `data-visible-if`), and removes the
directive, so `dist/` is self-contained. Includes can nest; a missing file or
an include cycle fails the build, and `npm run check` rejects a build that
still contains a `data-fragment`. The registration form
(`v2/pages/reg_form.html`) is shared by the home and register pages this way.

Country and attribute selects are populated from `shared/data/countries.<lang>.json`,
`options.<lang>.json` and `birth_years.json`, so they need no server round trip.

## Analytics

Google Analytics is off by default; it is enabled only when `analyticsId` is set
in `shared/config.js`, and `ga()` is a no-op otherwise.

## Validation

`npm run check` fails the build on:

- secrets (DB password, RDS host, private keys, AWS key ids)
- a `CNAME` in a `--base` (GitHub Pages project site) build
- `data-string` keys missing from both locale bundles
- unresolved local `href`/`src` references
- a root-absolute `/cgi-bin/` URL in a staging or production page fragment
  (the site origin serves static files only, so it would 404)
- JavaScript syntax errors

## Deployment

`.github/workflows/ci.yml` runs tests, a staging build and validation on every
push and pull request. `.github/workflows/deploy.yml` publishes `dist/` to
GitHub Pages on every push to `main`; a manual dispatch can target production.

Deployment serves the site from a domain root, so the build keeps root-absolute
URLs and writes the `CNAME`. No `--base` rewrite is used.

Both workflows run on Node 24 and use the `node24` action releases
(`checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `configure-pages@v6`,
`upload-pages-artifact@v5`, `deploy-pages@v5`).

### HTTPS

The site is served over HTTPS and redirects `http://` to it:

```
$ curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' http://<site-host>/
301 -> https://<site-host>/
```

Consequences to keep in mind:

- An `http://` API base is a bug: the page is HTTPS, so the browser blocks the
  request as mixed active content. `npm run check` warns about it.
- A `github.io` project site cannot disable HTTPS enforcement at all, which is
  why a custom domain is used instead.

### CORS

The site and the API are different origins, so the API must answer with CORS
headers. A typical response:

```
$ curl -D - -H "Origin: https://<site-host>" https://<api-host>/cgi-bin/nav6.pl
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://<site-host>
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Accept, Authorization, Content-Type, Cookie,
    Origin, X-Requested-With, X-CSRF-Token, sid
Access-Control-Max-Age: 86400
```

`OPTIONS` preflights for `POST` requests are answered too, so cross-origin
calls work. If the API host changes, keep this in mind:

- The `sid` header must stay in `Access-Control-Allow-Headers`; every request
  sends it.
- `Access-Control-Allow-Origin` must echo the site origin, not `*`, because
  `Access-Control-Allow-Credentials: true` forbids the wildcard.

`npm run serve` proxies `/cgi-bin/` to the API domain (override with
`KOBOOL_API_TARGET`) so local development stays same-origin.

## License

Proprietary. All rights reserved. See [LICENSE](./LICENSE).