import { NextResponse } from "next/server";
import dbConnect from "@lib/mongodb";
import Test from "@/models/Test";
import TestAttempt from "@/models/TestAttempt";
import jwt from "jsonwebtoken";

export async function GET(req) {
  await dbConnect();

  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ test: null });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const now = new Date();
    console.log("🕒 SERVER TIME:", now);

    const activeTest = await Test.findOne({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    });

    if (!activeTest) {
      return NextResponse.json({ test: null });
    }

    // 🚨 prevent retake
    const existingAttempt = await TestAttempt.findOne({
      studentId: userId,
      testId: activeTest._id,
    });

    if (existingAttempt) {
      return NextResponse.json({
        test: null,
        message: "already_attempted",
      });
    }

    return NextResponse.json({
      test: activeTest,
      testId: activeTest._id,
    });
  } catch (err) {
    console.error("ACTIVE TEST ERROR:", err);
    return NextResponse.json({ test: null });
  }
}