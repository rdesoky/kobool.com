# kobool.com

Static frontend for kobool.com. Replaces the PHP-rendered `v2/` and `v3/`
frontends with pre-built HTML, CSS and JavaScript served from a CDN.

The API is unchanged: every dynamic call still goes to the Perl CGI backend
under `/cgi-bin/`, now reached cross-origin at `https://api.kobool.com`.

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
npm run build:staging # staging build (api.kobool.com)
npm run build:prod    # production build
npm run check         # validate dist/ before publishing
npm run serve         # local server on :8080 with a /cgi-bin/ proxy
```

`npm run serve` proxies `/cgi-bin/` to `https://api.kobool.com` so the browser
sees a single origin during development. Point it elsewhere with
`KOBOOL_API_TARGET=http://localhost:8080`.

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
- `data-string` keys missing from both locale bundles
- unresolved local `href`/`src` references
- JavaScript syntax errors

## Deployment

`.github/workflows/ci.yml` runs tests, a staging build and validation on every
push and pull request. `.github/workflows/deploy.yml` publishes `dist/` to
GitHub Pages; pushes to `main` deploy staging, and a manual dispatch can target
production.

## License

Proprietary. All rights reserved. See [LICENSE](./LICENSE).
