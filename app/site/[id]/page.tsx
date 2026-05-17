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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  if (error || !data) {
    notFound();
  }

  let html =
    data.html_files?.["index.html"] ||
    data.html ||
    "";

  if (!html) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial",
        }}
      >
        No HTML found in database
      </div>
    );
  }

  html = html.replaceAll("REPLACE_ID", data.slug || data.id);

  return (
    <iframe
      srcDoc={html}
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        background: "#fff",
      }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}