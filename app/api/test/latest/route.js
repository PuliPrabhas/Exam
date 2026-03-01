import { NextResponse } from "next/server";
import dbConnect from "@lib/mongodb";
import Attempt from "@/models/TestAttempt";

export async function GET(req) {
  await dbConnect();

  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get("studentId");
    if (!studentId) return NextResponse.json({ success: false, error: "studentId required" }, { status: 400 });

    const attempt = await Attempt.findOne({ studentId }).sort({ createdAt: -1 }).lean();
    if (!attempt) return NextResponse.json({ success: true, attempt: null });

    return NextResponse.json({ success: true, attempt });
  } catch (err) {
    console.error("Latest attempt error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}