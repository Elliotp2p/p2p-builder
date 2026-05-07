import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value.replace(/[\s\r\n\t]+/g, "");
}

export async function GET() {
  return NextResponse.json({
    route: "save",
    version: "clean-env-runtime-v3",
  });
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
    const publishableKey = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseAuth = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { html, files, name, problem, template } = await req.json();

    const id = Math.random().toString(36).slice(2, 8);

    const htmlFiles = files || { "index.html": html };

    if (!htmlFiles["index.html"]) {
      return NextResponse.json({ error: "No index.html received" }, { status: 400 });
    }

    const fixedFiles: Record<string, string> = {};

    for (const key of Object.keys(htmlFiles)) {
      fixedFiles[key] = String(htmlFiles[key]).replaceAll("REPLACE_ID", id);
    }

    const { error } = await supabaseAdmin.from("sites").insert({
      id,
      user_id: user.id,
      html: fixedFiles["index.html"],
      html_files: fixedFiles,
      name: name || "Untitled project",
      problem: problem || "",
      template: template || "",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id,
      url: `/site/${id}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown publish error" },
      { status: 500 }
    );
  }
}