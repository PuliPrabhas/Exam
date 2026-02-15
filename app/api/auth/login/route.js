import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name, 
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
