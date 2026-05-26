import { NextRequest, NextResponse } from "next/server";
import { APP_TEMPLATES } from "@/lib/templates";
import { UI_COMPONENTS } from "@/lib/components";

export const runtime = "nodejs";
export const maxDuration = 60;

type GeneratedPage = {
  name: string;
  slug: string;
  html: string;
};

type GeneratedProject = {
  name: string;
  slug: string;
  pages: GeneratedPage[];
};

export async function POST(req: NextRequest) {
  try {
    const { idea } = await req.json();

    if (!idea || typeof idea !== "string") {
      return NextResponse.json({ error: "Missing idea" }, { status: 400 });
    }

    const lowerIdea = idea.toLowerCase();

    const matchedTemplate =
      APP_TEMPLATES.find((template) =>
        template.keywords.some((keyword) => lowerIdea.includes(keyword))
      ) || APP_TEMPLATES[0];

    const componentSystem = Object.values(UI_COMPONENTS).join("\n\n");

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        max_output_tokens: 18000,
        input: `
You are a world-class AI app builder like Lovable, Base44, Bolt and v0.

Build a COMPLETE premium multi-page HTML/CSS/JS web app from this idea:

"${idea}"

Recommended product type:
${matchedTemplate.type}

Recommended layout system:
${matchedTemplate.layout}

Available premium UI systems:
${componentSystem}

Use multiple premium UI systems when appropriate.

Return valid JSON only. No markdown. No explanation.

JSON structure:
{
  "name": "App name",
  "slug": "app-slug",
  "pages": [
    {
      "name": "Home",
      "slug": "index",
      "html": "complete full HTML page"
    },
    {
      "name": "Dashboard",
      "slug": "dashboard",
      "html": "complete full HTML page"
    },
    {
      "name": "Pricing",
      "slug": "pricing",
      "html": "complete full HTML page"
    },
    {
      "name": "Contact",
      "slug": "contact",
      "html": "complete full HTML page"
    }
  ]
}

Rules:
- Generate 3-5 pages.
- Every page must be complete HTML with <!DOCTYPE html>, <html>, <head>, <body>.
- Every page must include its own CSS inside <style>.
- Every page can include JavaScript inside <script> if needed.
- All pages should visually feel like the same product.
- All pages should link to each other using # only or plain buttons, not real external URLs.
- Make a real usable app/tool for this exact problem.
- Do not make a generic landing page.
- Use unique layout, colors, typography and sections based on the idea.
- Include modern typography, spacing, shadows, gradients and polish.
- Use Unsplash image URLs only when useful.
- Do not mention Problem to Profit.
- Do not mention OpenAI.

Before building the app, internally decide the best product type.

Possible product types:
- SaaS dashboard
- AI tool
- Marketplace
- Productivity app
- Mobile-style app
- Learning platform
- Analytics dashboard
- Social platform
- Finance app
- Booking platform
- Ecommerce app

Then generate:
- the best layout
- the best navigation
- the best sections
- the best UI components
- the best color palette
- the best UX flow

based on the product type.

VERY IMPORTANT:
- Avoid generic landing pages.
- Create realistic modern startup products.
- Add advanced UI sections.
- Add cards, charts, sidebars, navigation, dashboards, widgets and polished layouts when appropriate.
- Different ideas must generate dramatically different designs.
- The app should feel production-grade.
- Make every app visually unique.
- Use richer spacing, hierarchy, shadows and interaction design.
- Use modern React-style architecture as inspiration.
- Use TailwindCSS-style utility-class thinking as inspiration.
- Use reusable-looking sections and components.
- Avoid plain old-school HTML styling.
- Use premium SaaS design patterns.
- Create layouts similar to modern startup products.
- Use glassmorphism, gradients, cards and polished UI.
- Make apps feel like real funded startups.
        `,
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error("OpenAI error:", raw);

      return NextResponse.json(
        {
          error: "OpenAI request failed",
          details: raw,
        },
        { status: 500 }
      );
    }

    let openAiData: any;

    try {
      openAiData = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "OpenAI returned invalid JSON", details: raw },
        { status: 500 }
      );
    }

    const text = extractText(openAiData);

    if (!text) {
      return NextResponse.json(
        { error: "No JSON returned from AI", details: openAiData },
        { status: 500 }
      );
    }

    const cleanText = cleanCodeBlock(text);

    let project: GeneratedProject;

    try {
      project = JSON.parse(cleanText);
    } catch {
      return NextResponse.json(
        {
          error: "AI did not return valid project JSON",
          details: cleanText,
        },
        { status: 500 }
      );
    }

    const pages =
      Array.isArray(project.pages) && project.pages.length > 0
        ? project.pages.map((page, index) => ({
            name: page.name || `Page ${index + 1}`,
            slug: slugify(page.slug || page.name || `page-${index + 1}`),
            html: cleanCodeBlock(page.html || ""),
          }))
        : [];

    if (!pages.length || !pages[0].html) {
      return NextResponse.json(
        { error: "No valid pages returned from AI", details: project },
        { status: 500 }
      );
    }

    const name = project.name || guessName(idea);
    const slug = slugify(project.slug || name || guessName(idea));

    return NextResponse.json({
      name,
      slug,
      pages,
      html: pages[0].html,
    });
  } catch (error) {
    console.error("generate-site error:", error);

    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function extractText(data: any): string {
  if (typeof data.output_text === "string") return data.output_text;

  const parts: string[] = [];

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n");
}

function cleanCodeBlock(text: string) {
  return String(text)
    .replace(/^```json/i, "")
    .replace(/^```html/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function guessName(idea: string) {
  const lower = idea.toLowerCase();

  if (lower.includes("gift")) return "GiftGenius";
  if (lower.includes("study") || lower.includes("exam")) return "StudySprint";
  if (lower.includes("recipe") || lower.includes("meal")) return "PortionPilot";
  if (lower.includes("outfit") || lower.includes("clothes")) return "StyleWeather";
  if (lower.includes("workout") || lower.includes("fitness")) return "FitMinute";
  if (lower.includes("travel") || lower.includes("packing")) return "Packly";
  if (lower.includes("grocery") || lower.includes("shopping")) return "PriceBasket";

  return "Generated App";
}