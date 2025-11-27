import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseClient";

type SignupPayload = {
  username?: string;
  email?: string;
  password?: string;
  licenseKey?: string;
};

export async function POST(request: Request) {
  let body: SignupPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const username = body.username?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const licenseKey = body.licenseKey?.trim() ?? "";

  if (!username || !email || !password || !licenseKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Please provide username, email, password, and license key.",
      },
      { status: 400 },
    );
  }

  const { data: licenseRecord, error: licenseError } = await supabaseAdmin
    .from("licenses")
    .select("id, user_id, license_key")
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

  const [
    { data: usernameExists, error: usernameCheckError },
    { data: emailExists, error: emailCheckError },
  ] = await Promise.all([
    supabaseAdmin.from("users").select("id").eq("username", username).maybeSingle(),
    supabaseAdmin.from("users").select("id").eq("email", email).maybeSingle(),
  ]);

  if (usernameCheckError || emailCheckError) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to validate username or email uniqueness.",
      },
      { status: 500 },
    );
  }

  if (usernameExists) {
    return NextResponse.json(
      { success: false, message: "Username already exists." },
      { status: 409 },
    );
  }

  if (emailExists) {
    return NextResponse.json(
      { success: false, message: "Email is already registered." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: newUser, error: userInsertError } = await supabaseAdmin
    .from("users")
    .insert({
      username,
      email,
      password_hash: passwordHash,
      license_id: licenseRecord.id,
    })
    .select("id")
    .single();

  if (userInsertError || !newUser) {
    return NextResponse.json(
      { success: false, message: "Failed to create user." },
      { status: 500 },
    );
  }

  const { error: licenseUpdateError, data: updatedLicense } = await supabaseAdmin
    .from("licenses")
    .update({ user_id: newUser.id })
    .eq("id", licenseRecord.id)
    .is("user_id", null)
    .select("id")
    .single();

  if (licenseUpdateError || !updatedLicense) {
    await supabaseAdmin.from("users").delete().eq("id", newUser.id);
    return NextResponse.json(
      {
        success: false,
        message: "License key was claimed during registration. Please try again.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { success: true, message: "Sign up successful. You can now log in." },
    { status: 201 },
  );
}
