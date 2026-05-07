import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

function env(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value.replace(/\s+/g, "");
}

const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export default async function SitePage({
  params,
}: {
  params: Promise<{ id: string; page: string }>;
}) {
  const { id, page } = await params;

  const { data, error } = await supabase
    .from("sites")
    .select("html, html_files")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const fileName = `${page}.html`;

  const html =
    data.html_files?.[fileName] ||
    data.html_files?.["index.html"] ||
    data.html ||
    "";

  return (
    <iframe
      srcDoc={html}
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        display: "block",
      }}
    />
  );
}