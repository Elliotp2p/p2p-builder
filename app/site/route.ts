import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function env(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value.replace(/\s+/g, "");
}

const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing site id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("sites")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  return NextResponse.json({ site: data });
}