import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

type TestWebhookPayload = {
  webhookUrl?: string;
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

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid or expired token." },
      { status: 401 },
    );
  }

  let body: TestWebhookPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const webhookUrl = body.webhookUrl?.trim() ?? "";

  if (!webhookUrl) {
    return NextResponse.json(
      { success: false, message: "Webhook URL is required." },
      { status: 400 },
    );
  }

  // 验证 URL 格式
  try {
    new URL(webhookUrl);
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid webhook URL format." },
      { status: 400 },
    );
  }

  // 验证是否是 Discord webhook URL
  if (!webhookUrl.includes("discord.com/api/webhooks")) {
    return NextResponse.json(
      { success: false, message: "URL must be a Discord webhook URL." },
      { status: 400 },
    );
  }

  // 发送测试消息到 Discord webhook
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "✅ **Test Notification**\n\nThis is a test message from SQLBots Dashboard. Your webhook is working correctly!",
        embeds: [
          {
            title: "Webhook Test",
            description: "Your Discord webhook integration is successfully configured.",
            color: 0x00ff00, // Green color
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          message: `Discord webhook returned an error: ${response.status} ${response.statusText}`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Test message sent successfully to Discord!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Discord webhook test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send test message. Please check your webhook URL and try again.",
      },
      { status: 500 },
    );
  }
}


