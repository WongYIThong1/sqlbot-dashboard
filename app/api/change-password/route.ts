import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { supabaseAdmin } from "@/lib/supabaseClient";

type ChangePasswordPayload = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export async function POST(request: NextRequest) {
  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { success: false, message: "JWT_SECRET is not configured." },
      { status: 500 },
    );
  }

  // 验证 JWT token
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

  let body: ChangePasswordPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  // 验证输入
  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { success: false, message: "All password fields are required." },
      { status: 400 },
    );
  }

  // 验证新密码和确认密码是否匹配
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { success: false, message: "New password and confirm password do not match." },
      { status: 400 },
    );
  }

  // 验证新密码长度
  if (newPassword.length < 8) {
    return NextResponse.json(
      { success: false, message: "New password must be at least 8 characters long." },
      { status: 400 },
    );
  }

  // 获取用户信息并验证当前密码
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, password_hash")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { success: false, message: "User not found." },
      { status: 404 },
    );
  }

  // 验证当前密码
  const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash ?? "");
  if (!passwordMatches) {
    return NextResponse.json(
      { success: false, message: "Current password is incorrect." },
      { status: 401 },
    );
  }

  // 验证新密码不能与当前密码相同
  const isSamePassword = await bcrypt.compare(newPassword, user.password_hash ?? "");
  if (isSamePassword) {
    return NextResponse.json(
      { success: false, message: "New password must be different from current password." },
      { status: 400 },
    );
  }

  // 哈希新密码
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // 更新密码
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ password_hash: newPasswordHash })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json(
      { success: false, message: "Failed to update password." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, message: "Password updated successfully." },
    { status: 200 },
  );
}

