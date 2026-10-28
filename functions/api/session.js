// functions/api/session.js
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const existingSession = url.searchParams.get("session");

  // Generate a cryptographic, non-repeating session ID if none is passed
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");
  const timePart = Date.now().toString(36).slice(-4).toUpperCase();
  const sessionId = existingSession || `PKL-${hex.slice(0, 4)}-${timePart}`;

  // Default global low-latency STUN servers (plus optional Cloudflare TURN env vars)
  const iceServers = [
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ];

  if (env.CF_TURN_URLS && env.CF_TURN_USERNAME && env.CF_TURN_CREDENTIAL) {
    iceServers.push({
      urls: env.CF_TURN_URLS.split(","),
      username: env.CF_TURN_USERNAME,
      credential: env.CF_TURN_CREDENTIAL
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      sessionId,
      timestamp: Date.now(),
      iceServers
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}
