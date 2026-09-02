// Serves uploaded media straight from R2 at /media/<key>.
// Cached aggressively since R2 keys are content-addressed by upload, not by name reuse.

interface Env {
  MEDIA: R2Bucket;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const key = Array.isArray(params.path) ? params.path.join("/") : params.path;
  if (!key) return new Response("Not found", { status: 404 });

  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
};
