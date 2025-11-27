import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseClient";

type LoginPayload = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { success: false, message: "JWT_SECRET is not configured." },
      { status: 500 },
    );
  }

  let body: LoginPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { success: false, message: "Username and password are required." },
      { status: 400 },
    );
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, email, username, password_hash")
    .eq("username", username)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { success: false, message: "Invalid username or password." },
      { status: 401 },
    );
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash ?? "");

  if (!passwordMatches) {
    return NextResponse.json(
      { success: false, message: "Invalid username or password." },
      { status: 401 },
    );
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );

  const response = NextResponse.json(
    {
      success: true,
      message: "Login successful. Redirecting...",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    },
    { status: 200 },
  );

  response.cookies.set("sqlbots_token", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });

  return response;
}
