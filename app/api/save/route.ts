import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function env(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value.replace(/[\s\r\n\t]+/g, "");
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET() {
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");

  return NextResponse.json({
    route: "save",
    version: "custom-slug-v1",
    serviceStartsWith: serviceRoleKey.slice(0, 18),
    serviceHasWhitespace: /[\s\r\n\t]/.test(serviceRoleKey),
    serviceLength: serviceRoleKey.length,
  });
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
    const publishableKey = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseAuth = createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
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

    const body = await req.json();

    const html = body.html;
    const files = body.files;
    const name = body.name || "Untitled project";
    const problem = body.problem || "";
    const requestedSlug = body.slug || "";

    const id = Math.random().toString(36).slice(2, 8);

    const baseSlug = makeSlug(requestedSlug || name || problem || id);
    const slug = baseSlug || id;

    const htmlFiles = files || {
      "index.html": html,
    };

    if (!htmlFiles["index.html"]) {
      return NextResponse.json(
        { error: "No index.html received" },
        { status: 400 }
      );
    }

    const { data: existingSlug } = await supabaseAdmin
      .from("sites")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json(
        { error: "That URL is already taken. Choose another slug." },
        { status: 409 }
      );
    }

    const fixedFiles: Record<string, string> = {};

    for (const key of Object.keys(htmlFiles)) {
      fixedFiles[key] = String(htmlFiles[key])
        .replaceAll("REPLACE_ID", slug)
        .replaceAll(`/site/${id}`, `/site/${slug}`);
    }

    const { error } = await supabaseAdmin.from("sites").insert({
      id,
      slug,
      user_id: user.id,
      html: fixedFiles["index.html"],
      html_files: fixedFiles,
      name,
      problem,
      template: "AI Website",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id,
      slug,
      url: `/site/${slug}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown publish error" },
      { status: 500 }
    );
  }
}