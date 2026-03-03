import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TestAttempt from "@/models/TestAttempt";

export async function POST(req) {
  await dbConnect();

  try {
    // ===============================
    // ✅ SAFE JSON PARSE
    // ===============================
    let payload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

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
    // ✅ NORMALIZE ANSWERS (SAFE)
    // ===============================
    const normalizedAnswers = Array.isArray(payload.answers)
      ? payload.answers.map((a) => ({
          questionId: a?._idStr || a?._id || null,
          selectedOption: a?.selectedOption ?? null,
          correctAnswer: a?.correctAnswer ?? null,
          locked: !!a?.locked,
        }))
      : [];

    // ===============================
    // ✅ CLEAN DOCUMENT
    // ===============================
    const cleanDoc = {
      studentId: payload.studentId,

      // 🔥 CRITICAL FIX — NEVER FALL BACK WRONG
      studentName:
        typeof payload.studentName === "string" &&
        payload.studentName.trim().length > 0
          ? payload.studentName.trim()
          : "Unknown",

      testId: payload.testId,

      total: Number(payload.total ?? 0),
      correct: Number(payload.correct ?? 0),
      wrong: Number(payload.wrong ?? 0),
      attempted: Number(payload.attempted ?? 0),
      percent: Number(payload.percent ?? 0),

      // optional derived locked count
      locked: normalizedAnswers.filter((a) => a.locked).length,

      answers: normalizedAnswers,
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

    // 🔥 ENTERPRISE DUPLICATE PROTECTION
    if (err.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already attempted this test",
          alreadyAttempted: true,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit test",
      },
      { status: 500 }
    );
  }
}