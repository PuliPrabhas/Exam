import connectDB from "@/lib/mongodb";
import Question from "@/models/Question";
import { NextResponse } from "next/server";

const TEST_ID = "6990bc10ebe64ed8779d9a71";

export async function POST(req) {
  try {
    await connectDB();

    const { question, options, correctAnswer } = await req.json();

    // Count existing questions
    const count = await Question.countDocuments({ testId: TEST_ID });

    if (count >= 30) {
      return NextResponse.json(
        { error: "Maximum 30 questions allowed." },
        { status: 400 },
      );
    }

    const newQuestion = await Question.create({
      testId: TEST_ID,
      questionNumber: count + 1, // Auto assign
      question,
      options,
      correctAnswer,
    });

    return NextResponse.json({
      message: "Question added",
      question: newQuestion,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
