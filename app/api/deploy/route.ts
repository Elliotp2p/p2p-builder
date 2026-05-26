import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Page = {
  name?: string;
  slug?: string;
  html?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { slug, html, pages } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const token = process.env.VERCEL_TOKEN;

    if (!token) {
      return NextResponse.json({ error: "VERCEL_TOKEN missing" }, { status: 500 });
    }

    const files = buildFiles(html, pages);
    const projectName = `p2p-${slug}`;

    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        files,
        projectSettings: {
          framework: null,
        },
        target: "production",
      }),
    });

    const deployData = await deployRes.json();

    if (!deployRes.ok) {
      return NextResponse.json(
        { error: "Failed to deploy", details: deployData },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: `https://${deployData.url}`,
      id: deployData.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function buildFiles(html: string, pages: Page[] = []) {
  if (!Array.isArray(pages) || pages.length === 0) {
    return [{ file: "index.html", data: html || "" }];
  }

  return pages
    .filter((page) => page.html)
    .map((page, index) => {
      const safeSlug = cleanSlug(page.slug || page.name || `page-${index + 1}`);

      return {
        file: safeSlug === "index" ? "index.html" : `${safeSlug}.html`,
        data: page.html || "",
      };
    });
}

function cleanSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}