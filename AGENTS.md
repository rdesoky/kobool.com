# Project notes for coding agents

## Run and validate

- Run `npm start` to build the site and serve it locally with live reload.
  - Serve URL: `http://127.0.0.1:8080` (the server moves to the next free port if 8080 is busy).
  - The command rebuilds `dist/` on changes to `v2/`, `v3/`, `shared/`, `images/`, `index.html` or `404.html`.
- Validate UI changes against both shells through that server:
  - v3: `http://127.0.0.1:8080/`
  - v2: `http://127.0.0.1:8080/v2/`
- Run `npm test` before finishing. It runs the unit tests plus a full build and validation smoke test.
- On a fresh checkout, install dependencies first with `npm ci` (the dev server needs `chokidar` and `livereload`).

## Layout

- `index.html` and `v3/` — current v3 shell.
- `v2/` — legacy v2 shell, still reachable at `/v2/`.
- `shared/` — assets shared by both shells (config, strings, theme).
- `dist/` — generated build output; do not edit by hand.
