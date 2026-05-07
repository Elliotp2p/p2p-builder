import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function env(name: string) {
  return (process.env[name] || "").replace(/\s+/g, "");
}

const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");

const supabaseAuth = createClient(supabaseUrl, publishableKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function getUser(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser(token);

  return user;
}

export async function GET(req: Request) {
  try {
    const user = await getUser(req);

    if (!user) {
      return NextResponse.json({ sites: [] });
    }

    const { data, error } = await supabaseAdmin
      .from("sites")
      .select("id, name, problem, template, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sites: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown sites error" },
      { status: 500 }
    );
  }
}