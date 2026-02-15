import connectDB from "@/lib/mongodb";
import TestAttempt from "@/models/TestAttempt";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const count = await TestAttempt.countDocuments({ studentId });

  return NextResponse.json({ count });
}
