import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Test from "@/models/Test";

export async function GET() {
  await dbConnect();

  try {
    const now = new Date();

    // ✅ find currently active test
    const test = await Test.findOne({
      active: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).lean();

    // ✅ no active test
    if (!test) {
      return NextResponse.json({
        success: true,
        active: null,
      });
    }

    // ✅ normalize id
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