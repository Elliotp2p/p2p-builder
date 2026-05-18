import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value.replace(/\s+/g, "");
}

function normalizeHtml(html: string, siteKey: string) {
  let output = String(html || "");

  output = output.replaceAll("REPLACE_ID", siteKey);

  output = output.replace(
    /href=(["'])\/site\/REPLACE_ID(.*?)\1/g,
    `href="/site/${siteKey}$2"`
  );

  output = output.replaceAll("source.unsplash.com", "images.unsplash.com");

  if (!output.toLowerCase().includes("<!doctype html")) {
    output = `<!doctype html>${output}`;
  }

  return output;
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
    .select("id, slug, html, html_files, name")
    .or(`id.eq.${id},slug.eq.${id}`)
    .maybeSingle();

  if (error || !data) notFound();

  const siteKey = data.slug || data.id;

  const rawHtml =
    data.html_files?.["index.html"] ||
    data.html ||
    "";

  if (!rawHtml) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#050509",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: "Inter, Arial",
          padding: 32,
        }}
      >
        <div
          style={{
            maxWidth: 620,
            padding: 32,
            borderRadius: 24,
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
          }}
        >
          <h1 style={{ marginTop: 0 }}>No HTML found</h1>
          <p style={{ color: "#a1a1aa", lineHeight: 1.6 }}>
            This site exists in Supabase, but no homepage HTML was saved.
            Try publishing again from the builder.
          </p>
        </div>
      </main>
    );
  }

  const html = normalizeHtml(rawHtml, siteKey);

  return (
    <iframe
      title={data.name || "Published site"}
      srcDoc={html}
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        display: "block",
        background: "#fff",
      }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-top-navigation-by-user-activation"
    />
  );
}