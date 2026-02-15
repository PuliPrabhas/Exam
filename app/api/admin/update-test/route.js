import connectDB from "@/lib/mongodb";
import Test from "@/models/Test";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDB();

  const { testId, title, duration } = await req.json();

  await Test.findByIdAndUpdate(testId, {
    title,
    duration,
  });

  return NextResponse.json({ success: true });
}
