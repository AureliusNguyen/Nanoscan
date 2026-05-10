import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("image");
  const modelId = form.get("model_id");

  if (!(file instanceof File) || typeof modelId !== "string") {
    return NextResponse.json(
      { detail: "image (file) and model_id (string) are required" },
      { status: 400 },
    );
  }

  const upstream = new FormData();
  upstream.append("image", file, file.name);
  upstream.append("model_id", modelId);

  try {
    const res = await fetch(`${API_URL}/predict`, {
      method: "POST",
      body: upstream,
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
