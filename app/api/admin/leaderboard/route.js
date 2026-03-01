import { NextResponse } from "next/server";
import dbConnect from "@lib/mongodb";
import TestAttempt from "@/models/TestAttempt";

export async function GET() {
  try {
    await dbConnect();

    // 🔥 count check (very useful debug)
    const count = await TestAttempt.countDocuments();
    console.log("Total attempts in DB:", count);

    if (count === 0) {
      return NextResponse.json({
        success: true,
        leaderboard: [],
        message: "No attempts found",
      });
    }

    const topStudents = await TestAttempt.find({})
      .sort({
        percent: -1,
        correct: -1,
        createdAt: -1,
      })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      leaderboard: topStudents,
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}