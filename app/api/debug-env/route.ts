import { NextResponse } from "next/server";

function check(name: string) {
  const value = process.env[name] || "";

  return {
    exists: !!value,
    startsWith: value.slice(0, 18),
    length: value.length,
    hasSpace: /\s/.test(value),
  };
}

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: check("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: check(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    ),
    SUPABASE_SERVICE_ROLE_KEY: check("SUPABASE_SERVICE_ROLE_KEY"),
  });
}