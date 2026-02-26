import { NextResponse } from "next/server";
import dbConnect from "@lib/mongodb";
import Attempt from "@/models/TestAttempt";

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();

    const attempt = await Attempt.create(body);

    return NextResponse.json({
      success: true,
      attemptId: attempt._id,
    });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}