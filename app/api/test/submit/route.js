import connectDB from "@/lib/mongodb";
import Question from "@/models/Question";
import TestAttempt from "@/models/TestAttempt";
import { NextResponse } from "next/server";

const TEST_ID = "6990bc10ebe64ed8779d9a71";

export async function POST(req) {
  try {
    await connectDB();

    const { studentId, answers } = await req.json();
    const questions = await Question.find({ testId: TEST_ID });

    let score = 0;
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    answers.forEach((ans) => {
      const question = questions.find(
        (q) => q._id.toString() === ans.questionId
      );

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
      testId: TEST_ID,
      answers,
      score,
      totalQuestions: questions.length,
    });

    const savedAttempt = await attempt.save();

return NextResponse.json({
  attemptId: savedAttempt._id,   // 🔥 VERY IMPORTANT
});


  } catch (error) {
    console.log("Submission Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
