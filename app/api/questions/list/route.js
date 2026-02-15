import connectDB from "@/lib/mongodb";
import Question from "@/models/Question";
import { NextResponse } from "next/server";

const TEST_ID = "6990bc10ebe64ed8779d9a71";

export async function GET() {
  try {
    await connectDB();

    const questions = await Question.find({ testId: TEST_ID }).sort({
      questionNumber: 1,
    });

    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
