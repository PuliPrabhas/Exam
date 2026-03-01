import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TestAttempt from "@/models/TestAttempt";

export async function POST(req) {
  await dbConnect();

  try {
    const payload = await req.json();

    // ===============================
    // ✅ BASIC VALIDATION
    // ===============================
    if (!payload?.studentId || !payload?.testId) {
      return NextResponse.json(
        { success: false, message: "Missing studentId or testId" },
        { status: 400 }
      );
    }

    // ===============================
    // 🚨 HARD BLOCK — SINGLE ATTEMPT
    // ===============================
    const existing = await TestAttempt.findOne({
      studentId: payload.studentId,
      testId: payload.testId,
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already attempted this test",
          alreadyAttempted: true,
        },
        { status: 400 }
      );
    }

    // ===============================
    // ✅ NORMALIZE PAYLOAD (safety)
    // ===============================
    const cleanDoc = {
      studentId: payload.studentId,
      studentName: payload.studentName ?? "Student",
      testId: payload.testId,

      total: Number(payload.total ?? 0),
      correct: Number(payload.correct ?? 0),
      wrong: Number(payload.wrong ?? 0),
      attempted: Number(payload.attempted ?? 0),
      locked: Number(payload.locked ?? 0),
      percent: Number(payload.percent ?? 0),

      answers: Array.isArray(payload.answers) ? payload.answers : [],
      reason: payload.reason ?? "manual",

      createdAt: payload.createdAt
        ? new Date(payload.createdAt)
        : new Date(),
    };

    // ===============================
    // ✅ INSERT ATTEMPT
    // ===============================
    const created = await TestAttempt.create(cleanDoc);

    console.log("✅ Test attempt saved:", created._id.toString());

    // ===============================
    // ✅ SUCCESS RESPONSE
    // ===============================
    return NextResponse.json({
      success: true,
      message: "Test submitted successfully",
      attemptId: created._id.toString(),
    });
  } catch (err) {
    console.error("❌ Submit error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit test",
      },
      { status: 500 }
    );
  }
}