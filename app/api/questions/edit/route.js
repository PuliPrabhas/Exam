import connectDB from "@/lib/mongodb";
import Question from "@/models/Question";
import { NextResponse } from "next/server";

export async function PUT(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { _id, question, options, correctAnswer } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Question ID missing" },
        { status: 400 }
      );
    }

    const updated = await Question.findByIdAndUpdate(
      _id,
      {
        question,
        options: {
          A: options.A,
          B: options.B,
          C: options.C,
          D: options.D,
        },
        correctAnswer,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Question updated successfully",
      updated,
    });

  } catch (error) {
    console.error("Edit Error:", error);
    return NextResponse.json(
      { error: "Server error while updating question" },
      { status: 500 }
    );
  }
}
