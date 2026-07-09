import { WorkerEntrypoint } from "cloudflare:workers";

let count = 0;

export class Cached extends WorkerEntrypoint {
  async fetch(request) {
    count += 1;
    const generatedAt = new Date().toISOString();

    return new Response(
      `<!doctype html><title>Workers Cache Assets Repro</title><p>count=${count}</p><p>generated=${generatedAt}</p>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          "Cache-Tag": "workers-cache-assets-repro:with-assets",
          "X-Repro-Variant": "with-assets",
          "X-Repro-Backend-Count": String(count),
          "X-Repro-Generated-At": generatedAt,
        },
      },
    );
  }
}

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ ok: true, variant: "with-assets" });
    }

    const backendRequest = new Request(request);
    backendRequest.headers.delete("Cookie");
    backendRequest.headers.delete("Authorization");
    backendRequest.headers.delete("Range");
    backendRequest.headers.delete("Upgrade");
    backendRequest.headers.delete("Cache-Control");

    return ctx.exports.Cached.fetch(backendRequest, {
      cf: { cacheKey: url.pathname + url.search },
    });
  },
};
