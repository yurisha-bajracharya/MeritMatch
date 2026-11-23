import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { notifyDueCheckins } from "@/lib/hires";
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Turn any check-ins that have come due into notifications first.
  const u = getDb().prepare("SELECT phone FROM users WHERE id = ?").get(session.userId) as { phone: string } | undefined;
  if (u) notifyDueCheckins(session.userId, session.role, u.phone);

  const notifications = getNotifications(session.userId);
  const unread = getUnreadCount(session.userId);

  return NextResponse.json({ notifications, unread });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, notificationId } = body;

    if (action === "mark_read" && notificationId) {
      markRead(notificationId, session.userId);
    } else if (action === "mark_all_read") {
      markAllRead(session.userId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/notifications error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
