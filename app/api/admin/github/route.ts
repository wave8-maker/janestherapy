import { NextResponse } from "next/server";

const OWNER = "wave8-maker";
const REPO = "janestherapy";
const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_PAT}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const res = await fetch(`${API}/${path}`, { headers: ghHeaders() });
  if (!res.ok) return NextResponse.json({ error: "GitHub error", status: res.status }, { status: res.status });

  const data = await res.json();
  if (Array.isArray(data)) {
    return NextResponse.json({ files: data });
  }
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return NextResponse.json({ content, sha: data.sha });
}

export async function POST(req: Request) {
  const { path, content, sha, message } = await req.json();
  if (!path || content === undefined) {
    return NextResponse.json({ error: "Missing path or content" }, { status: 400 });
  }
  let fileSha = sha;
  if (!fileSha) {
    const r = await fetch(`${API}/${path}`, { headers: ghHeaders() });
    if (r.ok) fileSha = (await r.json()).sha;
  }
  const body: Record<string, string> = {
    message: message ?? `Update ${path} via admin`,
    content: Buffer.from(content).toString("base64"),
  };
  if (fileSha) body.sha = fileSha;
  const putRes = await fetch(`${API}/${path}`, {
    method: "PUT",
    headers: ghHeaders(),
    body: JSON.stringify(body),
  });
  if (!putRes.ok) return NextResponse.json({ error: await putRes.text() }, { status: putRes.status });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { path, sha, message } = await req.json();
  const res = await fetch(`${API}/${path}`, {
    method: "DELETE",
    headers: ghHeaders(),
    body: JSON.stringify({ message: message ?? `Delete ${path}`, sha }),
  });
  if (!res.ok) return NextResponse.json({ error: "Delete failed" }, { status: res.status });
  return NextResponse.json({ ok: true });
}
