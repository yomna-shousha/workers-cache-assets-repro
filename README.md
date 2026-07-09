# Workers Cache Static Assets Repro

This repository contains a minimal reproduction for a Workers Cache behavior difference when a Worker also has Static Assets configured.

There are two Workers with identical runtime code and Workers Cache settings:

- `no-assets`: no Static Assets config.
- `with-assets`: includes an `ASSETS` binding with `[assets] directory = "./public"`.

Both Workers:

- Enable top-level Workers Cache.
- Disable caching for the default export.
- Enable caching for a named `WorkerEntrypoint` called `Cached`.
- Have the default export call `ctx.exports.Cached.fetch(request, { cf: { cacheKey } })`.
- Return `200` HTML from `Cached.fetch()` with `Cache-Control: public, max-age=300`.
- Include `X-Repro-Backend-Count` and `X-Repro-Generated-At` headers so cache hits are visible.

The only meaningful difference is this block in `with-assets/wrangler.toml`:

```toml
[assets]
directory = "./public"
binding = "ASSETS"
```

## Expected Behavior

For both Workers, repeated requests to the same URL should use Workers Cache for the named entrypoint response:

```text
Cf-Cache-Status: MISS
Cf-Cache-Status: HIT
Cf-Cache-Status: HIT
```

On cache hits, `X-Repro-Backend-Count` and `X-Repro-Generated-At` should remain unchanged.

## Observed Behavior

Observed on 2026-07-08 with Wrangler 4.107.0 and compatibility date `2026-07-08`.

`no-assets` behaves as expected:

```text
probe 1: Cf-Cache-Status: MISS, X-Repro-Backend-Count: 1
probe 2: Cf-Cache-Status: HIT,  X-Repro-Backend-Count: 1
probe 3: Cf-Cache-Status: HIT,  X-Repro-Backend-Count: 1
```

`with-assets` does not show Workers Cache behavior for the same dynamic named-entrypoint response:

```text
probe 1: Cf-Cache-Status absent, X-Repro-Backend-Count: 1
probe 2: Cf-Cache-Status absent, X-Repro-Backend-Count: 2
probe 3: Cf-Cache-Status absent, X-Repro-Backend-Count: 3
```

`Cache-Tag` also remains visible to the client in the `with-assets` variant, while it is consumed/stripped in the `no-assets` variant.

The static asset in `with-assets/public/asset-control.txt` may return `Cf-Cache-Status: HIT`, but that is the Static Assets cache path. It is separate from the Workers Cache behavior of the dynamic `ctx.exports.Cached.fetch()` response.

## Run The Repro

Install dependencies for each Worker:

```bash
cd no-assets
npm install
cd ../with-assets
npm install
```

Deploy both Workers:

```bash
cd no-assets
npx wrangler deploy

cd ../with-assets
npx wrangler deploy
```

Probe each deployment repeatedly:

```bash
NO_ASSETS_URL="https://<your-no-assets-worker>.<your-subdomain>.workers.dev/repro-html"
WITH_ASSETS_URL="https://<your-with-assets-worker>.<your-subdomain>.workers.dev/repro-html"

for i in 1 2 3; do
  curl -sS -D - -o /dev/null "$NO_ASSETS_URL"
done

for i in 1 2 3; do
  curl -sS -D - -o /dev/null "$WITH_ASSETS_URL"
done
```

Inspect these headers:

```text
Cf-Cache-Status
Cache-Tag
X-Repro-Variant
X-Repro-Backend-Count
X-Repro-Generated-At
```

## Files

```text
no-assets/
  wrangler.toml
  src/index.js

with-assets/
  wrangler.toml
  src/index.js
  public/asset-control.txt
```
