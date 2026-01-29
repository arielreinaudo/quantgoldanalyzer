
export async function GET() {
  return new Response(JSON.stringify({ message: "Logic moved to client-side service for environment compatibility." }), {
    headers: { 'content-type': 'application/json' },
  });
}
