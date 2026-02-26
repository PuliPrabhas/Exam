import connectDB from "@/lib/mongodb";
import Question from "@/models/Question";
import Test from "@/models/Test";
import TestAttempt from "@/models/TestAttempt";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();

    const { studentId, answers } = await req.json();

    const now = new Date();

    // ✅ dynamic active test
    const activeTest = await Test.findOne({
      startTime: { $lte: now },
      endTime: { $gte: now },
      isActive: true,
    });

    if (!activeTest) {
      return NextResponse.json(
        { error: "No active test" },
        { status: 400 }
      );
    }

    const questions = await Question.find({
      testId: activeTest._id,
    });

    let score = 0;
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    answers.forEach((ans) => {
      const question = questions.find(
        (q) => q._id.toString() === ans.questionId
      );

      if (!question) return;

      if (!ans.selectedOption) {
        unanswered++;
      } else if (ans.selectedOption === question.correctAnswer) {
        correct++;
        score++;
      } else {
        wrong++;
      }
    });

    const attempt = await TestAttempt.create({
      studentId,
      testId: activeTest._id,
      answers,
      score,
      totalQuestions: questions.length,
    });

    return NextResponse.json({
      attemptId: attempt._id,
    });
  } catch (error) {
    console.log("Submission Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
router.push(`/result?score=${score}&total=${total}`);