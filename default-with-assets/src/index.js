let count = 0;

export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ ok: true, variant: "default-with-assets" });
    }

    count += 1;
    const generatedAt = new Date().toISOString();

    return new Response(
      `<!doctype html><title>Workers Cache Assets Repro</title><p>count=${count}</p><p>generated=${generatedAt}</p>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          "Cache-Tag": "workers-cache-assets-repro:default-with-assets",
          "X-Repro-Variant": "default-with-assets",
          "X-Repro-Backend-Count": String(count),
          "X-Repro-Generated-At": generatedAt,
        },
      },
    );
  },
};
