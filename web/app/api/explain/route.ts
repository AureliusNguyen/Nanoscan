import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(req: Request) {
  const body = await req.text();

  try {
    const res = await fetch(`${API_URL}/explain`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
  } catch (err) {
    return NextResponse.json(
      { detail: `backend unreachable: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
