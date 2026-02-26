import { NextResponse } from "next/server";
import dbConnect from "@lib/mongodb";
import Question from "@/models/Question";

export async function GET() {
  await dbConnect();

  try {
    // ✅ Simply fetch all questions (NO scheduling, NO filtering)
    const questions = await Question.find({})
      .sort({ questionNumber: 1 })
      .lean();

    console.log("📦 QUESTIONS RETURNED:", questions.length);

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (err) {
    console.error("QUESTIONS FETCH ERROR:", err);

    return NextResponse.json(
      { success: false, questions: [] },
      { status: 500 }
    );
  }
}