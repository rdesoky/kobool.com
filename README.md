# kobool.com

Static frontend for kobool.com. Replaces the PHP-rendered `v2/` and `v3/`
frontends with pre-built HTML, CSS and JavaScript served from a CDN.

The API is unchanged: every dynamic call still goes to the Perl CGI backend
under `/cgi-bin/`, now reached cross-origin at `//dev.kobool.com`. The base is
scheme-relative so it inherits the page's scheme; both the site and the API
host serve HTTPS. Switch to `//api.kobool.com/cgi-bin/` in `tools/build.js`
once that host serves the CGI.

## Source

Converted from the private `rdesoky/kobool` repository at commit
`d1d14b2fe0c7aa067ab57eacc846a51f6b040a9b` (2026-10-31).

## Layout

```text
index.html              v3 shell, served at /
v2/
  index.html            v2 shell
  pages/*.html          converted page fragments
  css/ images/ text/    v2 assets and string sources
  init_vars.js          JSLinks / CssLinks / PgLinks manifest
v3/
  pages/*.html          converted page fragments
  modules/ css/ font/   v3 assets
  text/                 string sources
  init.js               require config, CssLinks, PgLinks
shared/
  config.js             runtime config (apiBase, languages, analytics)
  strings.js            string bundle loader and data-* binder
  data/                 generated countries/options JSON
images/                 referenced root images
tools/                  build, serve, proxy, validate, converters
tests/                  unit and smoke tests
```

`dist/` is the build output and is never committed.

## Commands

```bash
npm install
npm test              # unit + smoke tests
npm run build         # dev build (same-origin /cgi-bin/)
npm run build:staging # staging build (dev.kobool.com API)
npm run build:prod    # production build
npm run check         # validate dist/ before publishing
npm run serve         # local server on :8080 with a /cgi-bin/ proxy
```

Production and staging are served from a domain root, so URLs are
root-absolute (`/v3/css/base.css`). To preview a build under a subpath — for
example a GitHub Pages project site at `/<repo>/` — pass `--base`:

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

The deployed site does **not** use `--base`: it is served from the domain root
`https://staging.kobool.com/`, so URLs stay root-absolute and the build writes
the `CNAME` that claims that domain.

`--api-base=<url>` overrides the environment's API base:

```bash
node tools/build.js --env=staging --api-base=//dev.kobool.com/cgi-bin/
```

The build also rewrites hardcoded `src="/cgi-bin/kpic.pl?..."` attributes in
the page fragments to the environment's API base. Those fragments are shared by
every environment, and the site origin serves static files only, so without the
rewrite every profile picture 404s on staging and production. The picture
uploader form is deliberately left same-origin: it posts into an iframe whose
response calls `window.parent.UpdatePics`, which a cross-origin response cannot
reach.

`npm run serve` proxies `/cgi-bin/` to `https://dev.kobool.com` (override with
`KOBOOL_API_TARGET`) so the browser sees a single origin during development.
Point it elsewhere with `KOBOOL_API_TARGET=http://localhost:8080`.

## How the conversion works

### Strings

The legacy frontend rendered hidden `ClientStrings` divs server-side and read
them back with `_S()`. That pipeline is gone:

- `tools/compile-strings.js` compiles `v2/text/<lang>/*.xml` and
  `v3/text/<lang>/*.xml` into `<app>/text/<lang>/<source>.json`, a flat map of
  dotted keys.
- `shared/strings.js` fetches those bundles and exposes the same globals the
  legacy modules expect: `RS`, `RAS`, `_S`, `_PS`, `_HS`.
- Converted pages declare their strings declaratively:

  | Attribute | Meaning |
  | --- | --- |
  | `data-string="source:key"` | set the element's text/HTML |
  | `data-string-attr="title"` | set an attribute instead of content |
  | `data-string-template="---{s}---"` | wrap the value in literal text |
  | `data-visible-if="member\|guest"` | toggle from session state |
  | `data-options="countries"` | populate a `<select>` from `shared/data` |

`data-visible-if` is deliberately distinct from `k-template`'s `data-show-if`,
which evaluates a `(? ... ?)` expression against page data.

### Pages

`tools/convert-pages.js` converts the PHP fragments:

```bash
node tools/convert-pages.js --app=v3 --write
node tools/convert-pages.js --app=v2 --src-dir=../kobool/v2 --out-dir=v2/pages --write
```

It handles element content, attribute values, mixed content, and
`"---" . S("key") . "---"` concatenation. Anything it cannot convert is
reported and must be finished by hand.

### Data

`tools/compile-data.js` generates `shared/data/countries.<lang>.json`,
`options.<lang>.json` and `birth_years.json` from the same XML sources, so
country and attribute selects no longer need a server round trip.

## Removed integrations

- **ShareThis** — removed entirely.
- **PayPal** — removed as a payment method: no page, module, menu entry,
  strings, CSS or images. `phone_tr` remains the only live method, matching the
  pre-existing state of `cpoints.js`.
- **Google Analytics** — disabled unless `analyticsId` is set in
  `shared/config.js`; `ga()` is a no-op otherwise.

## Validation

`npm run check` fails the build on:

- `.php`, `.pl`, `.pm`, `.cgi`, `.py`, `.xml`, `.sql`, `.pem`, `.key` files
- secrets (DB password, RDS host, private keys, AWS key ids)
- ShareThis and PayPal markers
- `localhost` / `127.0.0.1` in staging and production builds
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

The site is served from the domain root `https://staging.kobool.com/`, so the
build keeps root-absolute URLs and writes `CNAME` (`staging.kobool.com`). No
`--base` rewrite is used.

Both workflows run on Node 24 and use the `node24` action releases
(`checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `configure-pages@v6`,
`upload-pages-artifact@v5`, `deploy-pages@v5`).

### HTTPS

`staging.kobool.com` is served over HTTPS and redirects `http://` to it:

```
$ curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' http://staging.kobool.com/
301 -> https://staging.kobool.com/
```

The API host `dev.kobool.com` serves HTTPS too, so the built API base is
scheme-relative (`//dev.kobool.com/cgi-bin/`) and inherits the page's scheme.
That keeps the config correct without pinning a scheme.

Consequences to keep in mind:

- An `http://` API base is a bug: the page is HTTPS, so the browser blocks the
  request as mixed active content. `npm run check` warns about it.
- `www.kobool.com` has no HTTPS listener (port 443 times out), so links to the
  production site must stay `http://`. Do not "upgrade" them.
- A `github.io` project site cannot disable HTTPS enforcement at all, which is
  why the site uses the `staging.kobool.com` custom domain instead.

### CORS

`staging.kobool.com` and `dev.kobool.com` are different origins, so the API
must answer with CORS headers. It does:

```
$ curl -D - -H "Origin: https://staging.kobool.com" \
    https://dev.kobool.com/cgi-bin/nav6.pl
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://staging.kobool.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Accept, Authorization, Content-Type, Cookie,
    Origin, X-Requested-With, X-CSRF-Token, sid
Access-Control-Max-Age: 86400
```

`OPTIONS` preflights for `POST` requests are answered too, so cross-origin
calls from staging work. If the API host changes, keep this in mind:

- The `sid` header must stay in `Access-Control-Allow-Headers`; every request
  sends it.
- `Access-Control-Allow-Origin` must echo the site origin, not `*`, because
  `Access-Control-Allow-Credentials: true` forbids the wildcard.

`npm run serve` proxies `/cgi-bin/` to `https://dev.kobool.com` (override with
`KOBOOL_API_TARGET`) so local development stays same-origin.

## License

Proprietary. All rights reserved. See [LICENSE](./LICENSE).
