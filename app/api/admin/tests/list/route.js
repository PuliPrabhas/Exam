import connectDB from "@/lib/mongodb";
import Test from "@/models/Test";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    const now = new Date();

    const tests = await Test.find().sort({ startTime: -1 });

    const categorized = tests.map((t) => {
      let status = "upcoming";

      if (t.startTime <= now && t.endTime >= now) {
        status = "ongoing";
      } else if (t.endTime < now) {
        status = "completed";
      }

      return {
        ...t.toObject(),
        status,
      };
    });

    return NextResponse.json(categorized);
  } catch (error) {
    console.error("Admin Tests List Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tests" },
      { status: 500 }
    );
  }
}