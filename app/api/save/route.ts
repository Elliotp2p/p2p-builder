import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { html, name, problem, template } = await req.json();

    if (!html) {
      return NextResponse.json({ error: "No html received" }, { status: 400 });
    }

    const id = Math.random().toString(36).slice(2, 8);

    const { error } = await supabase.from("sites").insert({
      id,
      html,
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