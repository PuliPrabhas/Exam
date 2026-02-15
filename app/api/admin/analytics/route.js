import connectDB from "@/lib/mongodb";
import TestAttempt from "@/models/TestAttempt";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    const attempts = await TestAttempt.find();

    const totalAttempts = attempts.length;

    if (totalAttempts === 0) {
      return NextResponse.json({
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passPercentage: 0,
      });
    }

    const scores = attempts.map(a => a.score);

    const totalScore = scores.reduce((sum, s) => sum + s, 0);

    const averageScore = (totalScore / totalAttempts).toFixed(2);

    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    const passed = attempts.filter(a => a.score >= 12).length; // 40% of 30 = 12
    const passPercentage = ((passed / totalAttempts) * 100).toFixed(2);

    return NextResponse.json({
      totalAttempts,
      averageScore,
      highestScore,
      lowestScore,
      passPercentage,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
