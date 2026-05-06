import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function env(name: string) {
  return (process.env[name] || "").replace(/\s+/g, "");
}

const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");

async function getUser() {
  const cookieStore = await cookies();

  const supabaseAuth = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Do nothing here.
        // This prevents old broken Supabase cookie/header values from crashing publish.
      },
    },
  });

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  return user;
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { html, files, name, problem, template } = await req.json();

    const id = Math.random().toString(36).slice(2, 8);

    const htmlFiles = files || {
      "index.html": html,
    };

    if (!htmlFiles["index.html"]) {
      return NextResponse.json(
        { error: "No index.html received" },
        { status: 400 }
      );
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