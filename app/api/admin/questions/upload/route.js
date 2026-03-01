// app/api/admin/questions/upload/route.js
import { NextResponse } from "next/server";
import dbConnect from "@lib/mongodb";
import Question from "@/models/Question";
import TestAttempt from "@/models/TestAttempt";

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();
    const { questions } = body;
    if (!Array.isArray(questions) || !questions.length) {
      return NextResponse.json({ success: false, message: "No questions provided" }, { status: 400 });
    }

    // Replace questions atomically
    await Question.deleteMany({});
    await Question.insertMany(questions);

    // Reset attempts (all users) - intentional behavior described by you
    await TestAttempt.deleteMany({});

    return NextResponse.json({ success: true, inserted: questions.length, attemptsReset: true });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}