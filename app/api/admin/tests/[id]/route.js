// app/api/admin/tests/[id]/end/route.js

import { NextResponse } from "next/server";
import dbConnect from "@lib/mongodb";
import Test from "@/models/Test";

export async function POST(req, { params }) {
  await dbConnect();

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "Test id required" },
        { status: 400 }
      );
    }

    const test = await Test.findById(id);

    if (!test) {
      return NextResponse.json(
        { message: "Test not found" },
        { status: 404 }
      );
    }

    // 🔥 deactivate test
    test.active = false;
    await test.save();

    return NextResponse.json({
      success: true,
      message: "Test ended successfully",
    });
  } catch (err) {
    console.error("End test error:", err);

    return NextResponse.json(
      { message: "Failed to end test" },
      { status: 500 }
    );
  }
}