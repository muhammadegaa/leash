import { NextResponse } from "next/server";
import { resetAll } from "@/lib/store";

export const dynamic = "force-dynamic";

// Clears the event store and releases the kill switch so a demo run starts clean.
export async function POST() {
  await resetAll();
  return NextResponse.json({ ok: true });
}
