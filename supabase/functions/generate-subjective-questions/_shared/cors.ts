export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: HeadersInit } = {},
) {
  const status = init.status ?? 200;
  const headers: HeadersInit = {
    ...corsHeaders,
    "Content-Type": "application/json",
    ...(init.headers ?? {}),
  };

  return new Response(JSON.stringify(body), { status, headers });
}
