import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Test from "@/models/Test";

export async function DELETE(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { testId } = body;

    if (!testId) {
      return NextResponse.json(
        { error: "testId is required" },
        { status: 400 }
      );
    }

    const deleted = await Test.findByIdAndDelete(testId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (err) {
    console.error("DELETE TEST ERROR:", err);

    return NextResponse.json(
      { error: "Server error while deleting test" },
      { status: 500 }
    );
  }
}