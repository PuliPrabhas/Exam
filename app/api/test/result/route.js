import connectDB from "@/lib/mongodb";
import TestAttempt from "@/models/TestAttempt";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "No ID provided" },
        { status: 400 }
      );
    }

    const attempt = await TestAttempt.findById(id);

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(attempt);

  } catch (error) {
    console.log("Result Fetch Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
