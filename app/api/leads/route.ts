import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function env(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value.replace(/\s+/g, "");
}

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

async function getUser(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(token);

  if (error || !user) return null;

  return user;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const site_id = String(formData.get("site_id") || "");
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const message = String(formData.get("message") || "");

    if (!site_id) {
      return NextResponse.json({ error: "Missing site_id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("site_leads").insert({
      site_id,
      name,
      email,
      message,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(
      `
      <html>
        <head>
          <style>
            body {
              margin: 0;
              font-family: Arial;
              background: #020617;
              color: white;
              min-height: 100vh;
              display: grid;
              place-items: center;
            }
            div {
              max-width: 520px;
              padding: 40px;
              border-radius: 24px;
              background: rgba(255,255,255,.08);
              text-align: center;
            }
            a {
              display: inline-block;
              margin-top: 20px;
              color: #86efac;
            }
          </style>
        </head>
        <body>
          <div>
            <h1>Message sent</h1>
            <p>Your message was saved successfully.</p>
            <a href="/site/${site_id}">Back to site</a>
          </div>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown lead submit error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUser(req);

    if (!user) {
      return NextResponse.json({ leads: [] });
    }

    const { data: sites, error: sitesError } = await supabaseAdmin
      .from("sites")
      .select("id, name")
      .eq("user_id", user.id);

    if (sitesError) {
      return NextResponse.json({ error: sitesError.message }, { status: 500 });
    }

    const siteIds = (sites || []).map((site) => site.id);

    if (siteIds.length === 0) {
      return NextResponse.json({ leads: [] });
    }

    const { data: leads, error: leadsError } = await supabaseAdmin
      .from("site_leads")
      .select("*")
      .in("site_id", siteIds)
      .order("created_at", { ascending: false });

    if (leadsError) {
      return NextResponse.json({ error: leadsError.message }, { status: 500 });
    }

    const leadsWithSite = (leads || []).map((lead) => ({
      ...lead,
      site_name:
        sites?.find((site) => site.id === lead.site_id)?.name || lead.site_id,
    }));

    return NextResponse.json({ leads: leadsWithSite });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown leads error" },
      { status: 500 }
    );
  }
}