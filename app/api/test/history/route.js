import connectDB from "@/lib/mongodb";
import TestAttempt from "@/models/TestAttempt";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ count: 0 });
    }

    const count = await TestAttempt.countDocuments({
      studentId: new mongoose.Types.ObjectId(studentId),
    });

    return NextResponse.json({ count });

  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json({ count: 0 });
  }
}
