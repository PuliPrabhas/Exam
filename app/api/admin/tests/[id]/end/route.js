import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Test from "@/models/Test";

export async function POST(req, context) {
  await dbConnect();

  try {
    // ✅ SAFE PARAM EXTRACTION (CRITICAL FIX)
    const id = context?.params?.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Test id required" },
        { status: 400 }
      );
    }

    // ✅ find test
    const test = await Test.findById(id);

    if (!test) {
      return NextResponse.json(
        { success: false, message: "Test not found" },
        { status: 404 }
      );
    }

    // 🔥 HARD END TEST (production safe)
    test.active = false;
    test.endTime = new Date(); // ← VERY IMPORTANT
    await test.save();

    return NextResponse.json({
      success: true,
      message: "Test ended successfully",
    });
  } catch (err) {
    console.error("End test error:", err);

    return NextResponse.json(
      { success: false, message: "Failed to end test" },
      { status: 500 }
    );
  }
}