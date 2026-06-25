import { NextRequest, NextResponse } from "next/server";
import { approveEvent, rejectEvent } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const action = String(body.action ?? "approve");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (action === "reject") await rejectEvent(id);
  else await approveEvent(id);
  return NextResponse.json({ ok: true });
}
