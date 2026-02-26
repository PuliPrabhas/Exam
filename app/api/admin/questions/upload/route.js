import { NextResponse } from "next/server";
import dbConnect from "@lib/mongodb";
import Question from "@/models/Question";

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();
    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, message: "No questions provided" },
        { status: 400 }
      );
    }

    // 🔥 REPLACE MODE (very important)
    await Question.deleteMany({});
    console.log("🧹 Old questions deleted");

    await Question.insertMany(questions);
    console.log("✅ New questions inserted:", questions.length);

    return NextResponse.json({
      success: true,
      inserted: questions.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}