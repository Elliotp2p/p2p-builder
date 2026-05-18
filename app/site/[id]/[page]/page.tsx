import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1600&q=85&fit=crop";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value.replace(/\s+/g, "");
}

function normalizeHtml(html: string, siteKey: string) {
  let output = String(html || "");

  output = output
    .replaceAll("REPLACE_ID", siteKey)
    .replaceAll("source.unsplash.com", "images.unsplash.com")
    .replaceAll('href="javascript:void(0)"', `href="/site/${siteKey}"`)
    .replaceAll("href='javascript:void(0)'", `href="/site/${siteKey}"`);

  output = output.replace(
    /href=(["'])\/site\/[^\/"']+(\/pricing|\/about|\/contact)?\1/g,
    (_match, quote, page = "") => `href=${quote}/site/${siteKey}${page}${quote}`
  );

  output = output.replace(
    /<img\b(?![^>]*\bonerror=)([^>]*)>/gi,
    `<img$1 onerror="this.src='${FALLBACK_IMAGE}'">`
  );

  if (!output.toLowerCase().includes("<!doctype html")) {
    output = `<!doctype html>\n${output}`;
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

export default async function SiteSubPage({
  params,
}: {
  params: Promise<{ id: string; page: string }>;
}) {
  const { id, page } = await params;

  const safePage = ["pricing", "about", "contact"].includes(page)
    ? page
    : "index";

  const { data, error } = await supabase
    .from("sites")
    .select("id, slug, name, html, html_files")
    .or(`id.eq.${id},slug.eq.${id}`)
    .maybeSingle();

  if (error || !data) notFound();

  const siteKey = data.slug || data.id;
  const fileName = `${safePage}.html`;

  const rawHtml =
    data.html_files?.[fileName] ||
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
            maxWidth: 680,
            padding: 34,
            borderRadius: 28,
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
          }}
        >
          <h1 style={{ marginTop: 0 }}>Page not generated yet</h1>
          <p style={{ color: "#a1a1aa", lineHeight: 1.7 }}>
            This published site exists, but this page has no saved HTML yet.
            Republish the site or generate this page from the builder.
          </p>
        </div>
      </main>
    );
  }

  const html = normalizeHtml(rawHtml, siteKey);

  return (
    <iframe
      title={`${data.name || "Published site"} · ${safePage}`}
      srcDoc={html}
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        display: "block",
        background: "#fff",
      }}
      sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation allow-top-navigation-by-user-activation"
    />
  );
}