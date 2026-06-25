import { NextResponse } from "next/server";
import { listEvents, getControl, getStats, approvalQueue, usingSupabase } from "@/lib/store";

export const dynamic = "force-dynamic";

// Single poll endpoint the dashboard hits — feed + queue + kill switch + stats.
export async function GET() {
  const [events, control, stats, queue] = await Promise.all([
    listEvents(120),
    getControl(),
    getStats(),
    approvalQueue(),
  ]);
  return NextResponse.json(
    { events, control, stats, queue, backend: usingSupabase ? "supabase" : "memory" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
