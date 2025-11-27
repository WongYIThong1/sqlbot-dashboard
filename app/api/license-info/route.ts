import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { supabaseAdmin } from "@/lib/supabaseClient";

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

  // 获取用户的许可证信息
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("license_id")
    .eq("id", userId)
    .single();

  if (userError || !user || !user.license_id) {
    return NextResponse.json(
      { success: true, license: null },
      { status: 200 },
    );
  }

  const { data: license, error: licenseError } = await supabaseAdmin
    .from("licenses")
    .select("expires_at, plan_type")
    .eq("id", user.license_id)
    .single();

  if (licenseError || !license) {
    return NextResponse.json(
      { success: true, license: null },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      license: {
        expiresAt: license.expires_at,
        planType: license.plan_type,
      },
    },
    { status: 200 },
  );
}


