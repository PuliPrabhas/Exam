import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Test from "@/models/Test";

export async function GET() {
  await dbConnect();

  try {
    const now = new Date();

    // ✅ PRODUCTION SAFE ACTIVE TEST FINDER
    const test = await Test.findOne({
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).lean();

    if (!test) {
      return NextResponse.json({
        success: true,
        active: null,
      });
    }

    const normalized = {
      ...test,
      _id: test._id.toString(),
    };

    return NextResponse.json({
      success: true,
      active: normalized,
    });
  } catch (err) {
    console.error("Active test fetch error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch active test" },
      { status: 500 }
    );
  }
}