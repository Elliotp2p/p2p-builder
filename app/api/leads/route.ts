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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getUser();

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

    const siteIds = (sites || []).map((s) => s.id);

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
      site_name: sites?.find((s) => s.id === lead.site_id)?.name || lead.site_id,
    }));

    return NextResponse.json({ leads: leadsWithSite });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}