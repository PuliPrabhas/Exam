import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";

export async function GET() {
  try {
    await dbConnect();

    const counts = await Question.aggregate([
      {
        $group: {
          _id: "$testId",
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({ counts });
  } catch (err) {
    console.error("Question count error:", err);
    return NextResponse.json(
      { error: "Failed to get question counts" },
      { status: 500 }
    );
  }
}