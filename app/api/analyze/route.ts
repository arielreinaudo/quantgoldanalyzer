
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "Logic moved to client-side service for environment compatibility." });
}
