import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { supabaseAdmin } from "@/lib/supabaseClient";

// GET - 获取用户的 API key
export async function GET(request: NextRequest) {
  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { success: false, message: "JWT_SECRET is not configured." },
      { status: 500 },
    );
  }

  const token = request.cookies.get("sqlbots_token")?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  let userId: string;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as string;
    if (!userId) {
      throw new Error("Invalid token payload");
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid or expired token." },
      { status: 401 },
    );
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("api_key")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { success: false, message: "User not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { success: true, apiKey: user.api_key || null },
    { status: 200 },
  );
}

// POST - 生成新的 API key
export async function POST(request: NextRequest) {
  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { success: false, message: "JWT_SECRET is not configured." },
      { status: 500 },
    );
  }

  const token = request.cookies.get("sqlbots_token")?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  let userId: string;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as string;
    if (!userId) {
      throw new Error("Invalid token payload");
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid or expired token." },
      { status: 401 },
    );
  }

  // Generate new API key
  const apiKeyBytes = crypto.getRandomValues(new Uint8Array(18));
  const apiKey = Array.from(apiKeyBytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);

  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from("users")
    .update({ api_key: apiKey })
    .eq("id", userId)
    .select("api_key")
    .single();

  if (updateError || !updatedUser) {
    return NextResponse.json(
      { success: false, message: "Failed to generate API key." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, apiKey: updatedUser.api_key, message: "API key regenerated successfully." },
    { status: 200 },
  );
}


