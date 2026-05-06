import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getUser() {
  const cookieStore = await cookies();

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  return user;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      fixedFiles[key] = htmlFiles[key].replaceAll("REPLACE_ID", id);
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}