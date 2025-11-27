import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { supabaseAdmin } from "@/lib/supabaseClient";

type DiscordSettingsPayload = {
  webhookUrl?: string;
  notificationsEnabled?: boolean;
};

// GET - 获取用户的 Discord 设置
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
    .select("discord_webhook_url, discord_notifications_enabled")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { success: false, message: "User not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      webhookUrl: user.discord_webhook_url || "",
      notificationsEnabled: user.discord_notifications_enabled || false,
    },
    { status: 200 },
  );
}

// POST - 保存用户的 Discord 设置
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

  let body: DiscordSettingsPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const webhookUrl = body.webhookUrl?.trim() ?? "";
  const notificationsEnabled = body.notificationsEnabled ?? false;

  // 如果启用了通知，验证 webhook URL
  if (notificationsEnabled && webhookUrl) {
    try {
      new URL(webhookUrl);
      if (!webhookUrl.includes("discord.com/api/webhooks")) {
        return NextResponse.json(
          { success: false, message: "URL must be a Discord webhook URL." },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid webhook URL format." },
        { status: 400 },
      );
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({
      discord_webhook_url: webhookUrl || null,
      discord_notifications_enabled: notificationsEnabled,
    })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json(
      { success: false, message: "Failed to save Discord settings." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, message: "Discord settings saved successfully." },
    { status: 200 },
  );
}

