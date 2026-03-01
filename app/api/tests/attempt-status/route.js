import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Test from "@/models/Test";
import TestAttempt from "@/models/TestAttempt";

export async function POST(req) {
  try {
    await dbConnect();

    const { studentId } = await req.json();
    if (!studentId) {
      return NextResponse.json(
        { message: "studentId required" },
        { status: 400 }
      );
    }

    const now = new Date();

    // ✅ STRICT active test check
    const activeTest = await Test.findOne({
      active: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).lean();

    // 🚫 HARD BLOCK
    if (!activeTest) {
      return NextResponse.json({
        activeTest: null,
        alreadyAttempted: false,
      });
    }

    // ✅ check attempt
    const existingAttempt = await TestAttempt.findOne({
      studentId,
      testId: activeTest._id,
    }).lean();

    if (existingAttempt) {
      return NextResponse.json({
        activeTest,
        alreadyAttempted: true,
        attempt: existingAttempt,
      });
    }

    return NextResponse.json({
      activeTest,
      alreadyAttempted: false,
    });
  } catch (err) {
    console.error("attempt-status error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}