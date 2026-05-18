import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1600&q=85&fit=crop";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value.replace(/[\s\r\n\t]+/g, "");
}

function makeSlug(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function ensureHtmlShell(html: string, title = "Published site") {
  const value = String(html || "").trim();

  if (value.toLowerCase().includes("<html")) return value;

  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
body{margin:0;width:100%;min-height:100vh;font-family:Inter,Arial,sans-serif;background:#fff;color:#111}
</style>
</head>
<body>
${value}
</body>
</html>`;
}

function fixHtml(html: string, siteKey: string, title: string) {
  let output = ensureHtmlShell(html, title);

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

  output = output.replace(
    /<img\b([^>]*?)src=(["'])\s*\2([^>]*)>/gi,
    `<img$1src="${FALLBACK_IMAGE}"$3>`
  );

  return output;
}

function createPageHtml(kind: "pricing" | "about" | "contact", siteKey: string, name: string) {
  const title =
    kind === "pricing" ? "Pricing" : kind === "about" ? "About" : "Contact";

  const contactForm =
    kind === "contact"
      ? `<form method="POST" action="/api/leads" class="form">
<input type="hidden" name="site_id" value="${siteKey}" />
<input name="name" placeholder="Name" />
<input name="email" type="email" placeholder="Email" />
<textarea name="message" placeholder="Message"></textarea>
<button type="submit">Send message</button>
</form>`
      : "";

  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} · ${name}</title>
<style>
:root{--bg:#050509;--card:rgba(255,255,255,.07);--text:#fff;--muted:#a1a1aa;--line:rgba(255,255,255,.1);--brand:#a78bfa}
*{box-sizing:border-box}body{margin:0;width:100%;min-height:100vh;font-family:Inter,Arial,sans-serif;background:radial-gradient(circle at 20% 0%,rgba(124,58,237,.22),transparent 34%),var(--bg);color:var(--text)}
nav{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 7vw;border-bottom:1px solid var(--line);backdrop-filter:blur(18px)}
nav a{color:#fff;text-decoration:none;margin-left:22px;font-weight:700;font-size:14px}.brand{font-weight:900;letter-spacing:-.03em}
main{padding:90px 7vw}.hero{max-width:980px}.eyebrow{color:var(--brand);font-weight:900;text-transform:uppercase;font-size:12px;letter-spacing:.16em}
h1{font-size:clamp(54px,8vw,110px);line-height:.9;letter-spacing:-.075em;margin:16px 0 24px}
p{color:var(--muted);font-size:18px;line-height:1.7;max-width:760px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:48px}.card{padding:28px;border-radius:28px;background:var(--card);border:1px solid var(--line);min-height:190px}
.card h3{font-size:24px;margin:0 0 10px}.cta{display:inline-flex;margin-top:28px;padding:14px 20px;border-radius:999px;background:#fff;color:#09090b;text-decoration:none;font-weight:900}
.form{display:grid;gap:14px;max-width:620px;margin-top:34px}.form input,.form textarea{width:100%;padding:15px 16px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:#fff}.form textarea{min-height:150px}.form button{padding:15px 18px;border-radius:999px;border:0;background:#fff;color:#09090b;font-weight:900}
@media(max-width:800px){nav{padding:0 22px}.links{display:none}main{padding:64px 22px}.grid{grid-template-columns:1fr}h1{font-size:56px}}
</style>
</head>
<body>
<nav>
<a class="brand" href="/site/${siteKey}">${name}</a>
<div class="links">
<a href="/site/${siteKey}">Home</a>
<a href="/site/${siteKey}/pricing">Pricing</a>
<a href="/site/${siteKey}/about">About</a>
<a href="/site/${siteKey}/contact">Contact</a>
</div>
</nav>
<main>
<section class="hero">
<div class="eyebrow">${title}</div>
<h1>${title === "Pricing" ? "Simple plans for serious launches." : title === "About" ? "Built for ideas that deserve better websites." : "Let’s build something worth clicking."}</h1>
<p>${title === "Pricing" ? "Choose a plan that matches your ambition. Start lean, grow with confidence and launch with a premium web presence." : title === "About" ? "This site was created with Problem to Profit AI — designed to turn rough ideas into polished websites with speed, clarity and taste." : "Send a message and start the conversation. Every great business starts with one clear next step."}</p>
<a class="cta" href="/site/${siteKey}/contact">${title === "Contact" ? "Send message" : "Contact us"}</a>
${contactForm}
</section>
${kind !== "contact" ? `<section class="grid">
<div class="card"><h3>Premium design</h3><p>Clean layouts, strong typography and high-end visual rhythm.</p></div>
<div class="card"><h3>Clear conversion</h3><p>Every section guides visitors toward one obvious next step.</p></div>
<div class="card"><h3>Fast launch</h3><p>Designed for speed without feeling generic or unfinished.</p></div>
</section>` : ""}
</main>
</body>
</html>`;
}

async function getUniqueSlug(supabaseAdmin: any, base: string, id: string) {
  let slug = base || id;

  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;

    const { data } = await supabaseAdmin
      .from("sites")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
  }

  return `${slug}-${Date.now().toString(36)}`;
}

export async function GET() {
  return NextResponse.json({
    route: "save",
    version: "publish-engine-v2",
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

    const body = await req.json();

    const id = Math.random().toString(36).slice(2, 8);
    const name = body.name || body.problem || "Untitled project";
    const problem = body.problem || "";
    const baseSlug = makeSlug(body.slug || name || problem || id);
    const slug = await getUniqueSlug(supabaseAdmin, baseSlug, id);
    const siteKey = slug;

    const incomingFiles = body.files || { "index.html": body.html };

    if (!incomingFiles["index.html"]) {
      return NextResponse.json(
        { error: "No index.html received" },
        { status: 400 }
      );
    }

    const fixedFiles: Record<string, string> = {};

    for (const key of Object.keys(incomingFiles)) {
      fixedFiles[key] = fixHtml(String(incomingFiles[key]), siteKey, name);
    }

    if (!fixedFiles["pricing.html"]) {
      fixedFiles["pricing.html"] = createPageHtml("pricing", siteKey, name);
    }

    if (!fixedFiles["about.html"]) {
      fixedFiles["about.html"] = createPageHtml("about", siteKey, name);
    }

    if (!fixedFiles["contact.html"]) {
      fixedFiles["contact.html"] = createPageHtml("contact", siteKey, name);
    }

    const payload = {
      id,
      slug,
      user_id: user.id,
      html: fixedFiles["index.html"],
      html_files: fixedFiles,
      name,
      problem,
      template: "AI Website",
    };

    const { error } = await supabaseAdmin.from("sites").insert(payload);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id,
      slug,
      url: `/site/${slug}`,
      pages: Object.keys(fixedFiles),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown publish error" },
      { status: 500 }
    );
  }
}