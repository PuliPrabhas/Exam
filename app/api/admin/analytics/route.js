import { NextResponse } from "next/server";
import dbConnect from "@lib/mongodb";
import Attempt from "@/models/TestAttempt";

export async function GET() {
  await dbConnect();

  try {
    const attempts = await Attempt.find({}).lean();

    const totalAttempts = attempts.length;

    if (totalAttempts === 0) {
      return NextResponse.json({
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        passPercentage: 0,
        topScorer: null,
        uniqueStudents: 0,
      });
    }

    // ✅ average score
    const totalPercent = attempts.reduce(
      (sum, a) => sum + (a.percent || 0),
      0
    );
    const averageScore = Math.round(totalPercent / totalAttempts);

    // ✅ highest scorer
    const highestAttempt = attempts.reduce((max, curr) =>
      (curr.percent || 0) > (max.percent || 0) ? curr : max
    );

    // ✅ pass percentage (>=40%)
    const passCount = attempts.filter(
      (a) => (a.percent || 0) >= 40
    ).length;

    const passPercentage = Math.round(
      (passCount / totalAttempts) * 100
    );

    // ✅ unique students
    const uniqueStudents = new Set(
      attempts.map((a) => a.studentId)
    ).size;

    return NextResponse.json({
      totalAttempts,
      averageScore,
      highestScore: highestAttempt.percent || 0,
      passPercentage,
      topScorer: highestAttempt.studentName || "Unknown",
      uniqueStudents,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}