import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { supabaseAdmin } from "@/lib/supabaseClient";

type ExtendLicensePayload = {
  licenseKey?: string;
};

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

  let body: ExtendLicensePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const licenseKey = body.licenseKey?.trim() ?? "";

  if (!licenseKey) {
    return NextResponse.json(
      { success: false, message: "License key is required." },
      { status: 400 },
    );
  }

  // 检查 license key 是否存在且未使用
  const { data: licenseRecord, error: licenseError } = await supabaseAdmin
    .from("licenses")
    .select("id, user_id, plan_type, expires_at")
    .eq("license_key", licenseKey)
    .single();

  if (licenseError || !licenseRecord) {
    return NextResponse.json(
      { success: false, message: "License key is invalid." },
      { status: 400 },
    );
  }

  if (licenseRecord.user_id) {
    return NextResponse.json(
      { success: false, message: "License key has already been used." },
      { status: 409 },
    );
  }

  // 获取用户当前的许可证信息
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("license_id")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { success: false, message: "User not found." },
      { status: 404 },
    );
  }

  // 计算新的过期日期
  const planType = licenseRecord.plan_type;
  const daysToAdd = planType === "90d" ? 90 : 30;

  let newExpiresAt: Date;
  if (user.license_id) {
    // 如果用户已有许可证，获取当前过期日期并延长
    const { data: currentLicense } = await supabaseAdmin
      .from("licenses")
      .select("expires_at")
      .eq("id", user.license_id)
      .single();

    if (currentLicense?.expires_at) {
      const currentExpiry = new Date(currentLicense.expires_at);
      const now = new Date();
      // 如果当前许可证已过期，从今天开始计算
      // 如果未过期，从当前过期日期开始延长
      const baseDate = currentExpiry > now ? currentExpiry : now;
      newExpiresAt = new Date(baseDate);
      newExpiresAt.setDate(newExpiresAt.getDate() + daysToAdd);
    } else {
      // 如果没有过期日期，从今天开始计算
      newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + daysToAdd);
    }
  } else {
    // 如果用户没有许可证，从今天开始计算
    newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + daysToAdd);
  }

  // 开始事务：更新 license 和用户
  // 使用更严格的检查来防止竞态条件：再次验证 license 仍然可用
  const { data: recheckLicense, error: recheckError } = await supabaseAdmin
    .from("licenses")
    .select("id, user_id")
    .eq("id", licenseRecord.id)
    .is("user_id", null)
    .single();

  if (recheckError || !recheckLicense) {
    return NextResponse.json(
      { success: false, message: "License key has been claimed by another user. Please try again." },
      { status: 409 },
    );
  }

  // 1. 更新 license 的 user_id 和 expires_at（使用原子更新）
  const { error: licenseUpdateError } = await supabaseAdmin
    .from("licenses")
    .update({
      user_id: userId,
      expires_at: newExpiresAt.toISOString(),
    })
    .eq("id", licenseRecord.id)
    .is("user_id", null); // 双重检查：确保在更新时仍然未被使用

  if (licenseUpdateError) {
    return NextResponse.json(
      { success: false, message: "Failed to update license. It may have been claimed by another user." },
      { status: 409 },
    );
  }

  // 2. 如果用户已有许可证，需要更新用户的 license_id
  if (user.license_id && user.license_id !== licenseRecord.id) {
    // 用户已有不同的许可证，更新为新许可证
    const { error: userUpdateError } = await supabaseAdmin
      .from("users")
      .update({ license_id: licenseRecord.id })
      .eq("id", userId);

    if (userUpdateError) {
      // 回滚：恢复 license
      await supabaseAdmin
        .from("licenses")
        .update({ user_id: null })
        .eq("id", licenseRecord.id);
      return NextResponse.json(
        { success: false, message: "Failed to update user license." },
        { status: 500 },
      );
    }
  } else if (!user.license_id) {
    // 用户没有许可证，分配新许可证
    const { error: userUpdateError } = await supabaseAdmin
      .from("users")
      .update({ license_id: licenseRecord.id })
      .eq("id", userId);

    if (userUpdateError) {
      // 回滚：恢复 license
      await supabaseAdmin
        .from("licenses")
        .update({ user_id: null })
        .eq("id", licenseRecord.id);
      return NextResponse.json(
        { success: false, message: "Failed to assign license to user." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    {
      success: true,
      message: `License extended successfully. Your license now expires on ${newExpiresAt.toLocaleDateString()}.`,
      expiresAt: newExpiresAt.toISOString(),
      daysAdded: daysToAdd,
    },
    { status: 200 },
  );
}


