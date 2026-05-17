import OpenAI from "openai";
import { sectionLibrary } from "../../lib/sectionLibrary";
import { designSystems } from "../../lib/designSystem";
import {
  heroSaaS,
  heroTravel,
  pricingSection,
  ctaSection,
} from "../../lib/sections";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function clean(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```html/g, "")
    .replace(/```/g, "")
    .trim();
}

function safeParseJSON(raw: string) {
  const cleaned = clean(raw);

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }

    throw new Error("Invalid JSON");
  }
}

function fallbackHtml(message: string) {
  return `
<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<title>Error</title>

<style>
body{
margin:0;
font-family:Inter,sans-serif;
background:#050509;
color:white;
display:grid;
place-items:center;
min-height:100vh;
padding:40px;
}

.card{
max-width:700px;
padding:40px;
border-radius:30px;
background:rgba(255,255,255,.06);
border:1px solid rgba(255,255,255,.08);
}

h1{
font-size:52px;
margin:0 0 14px;
}

p{
line-height:1.7;
color:#d4d4d8;
}
</style>
</head>

<body>
<div class="card">
<h1>Generation failed</h1>
<p>${message}</p>
</div>
</body>
</html>
`;
}

function getProjectType(problem: string) {
  const p = problem.toLowerCase();

  if (
    p.includes("restaurant") ||
    p.includes("pizza") ||
    p.includes("food") ||
    p.includes("cafe") ||
    p.includes("coffee")
  ) {
    return "food";
  }

  if (
    p.includes("travel") ||
    p.includes("gothenburg") ||
    p.includes("stockholm") ||
    p.includes("falsterbo") ||
    p.includes("city")
  ) {
    return "travel";
  }

  if (
    p.includes("saas") ||
    p.includes("crm") ||
    p.includes("dashboard") ||
    p.includes("ai") ||
    p.includes("automation")
  ) {
    return "saas";
  }

  return "luxury";
}

function getStyleGuide(projectType: string) {
  if (projectType === "food") {
    return `
STYLE:
Premium cinematic restaurant website.
Warm blacks, cream typography, editorial spacing.
Luxury menu aesthetic.

IMAGE RULES:
Use ONLY working direct images.unsplash.com URLs.

Examples:
https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&q=85&fit=crop
https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1600&q=85&fit=crop
`;
  }

  if (projectType === "travel") {
    return `
STYLE:
Luxury Nordic editorial travel brand.

IMAGE RULES:
Use ONLY real city/location photography.

Examples:
https://images.unsplash.com/photo-1526481280695-3c4691f8f5b8?w=1600&q=85&fit=crop
https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=85&fit=crop
`;
  }

  if (projectType === "saas") {
    return `
STYLE:
Modern Lovable/Vercel/Linear SaaS aesthetic.
Bento layouts.
Glassmorphism.
Minimal gradients.
`;
  }

  return `
STYLE:
Luxury premium modern website.
Strong typography.
Large spacing.
Editorial design.
`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      problem,
      template,
      style,
      audience,
      editWebsite,
      reviewWebsite,
      currentHtml,
      instruction,
      activeFile,
      allFiles,
    } = body;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          const projectType = getProjectType(
            String(problem || instruction || "")
          );

          const styleGuide = getStyleGuide(projectType);

          const designSystem =
            projectType === "travel"
              ? designSystems.nordic
              : projectType === "food"
              ? designSystems.restaurant
              : projectType === "saas"
              ? designSystems.saas
              : designSystems.luxury;

          let prompt = "";

          if (editWebsite) {
            prompt = `
Return ONLY valid JSON.

{
  "files": {
    "${activeFile || "index.html"}": "full html"
  }
}

You are editing a premium website.

USER REQUEST:
${instruction}

CURRENT FILE:
${currentHtml}

FULL PROJECT:
${JSON.stringify(allFiles || {}, null, 2)}

RULES:
- Keep design premium
- Keep all nav working
- Keep responsive
- Use ONLY working image URLs
- NEVER use source.unsplash.com
- NEVER create empty image boxes
- Every image must be visible
- Return complete HTML
`;
          } else if (reviewWebsite) {
            prompt = `
Return ONLY valid JSON.

{
  "review": "..."
}

Review this website professionally:

${currentHtml}
`;
          } else {
            prompt = `
Return ONLY valid JSON.

{
  "files": {
    "index.html": "full html"
  }
}

You are a world-class website designer.

BUSINESS:
${problem}

TEMPLATE:
${template || ""}

AUDIENCE:
${audience || ""}

${styleGuide}

DESIGN SYSTEM:
${designSystem}

REFERENCE SECTIONS:
${sectionLibrary}

HERO:
${projectType === "travel" ? heroTravel : heroSaaS}

PRICING:
${pricingSection}

CTA:
${ctaSection}

QUALITY RULES:
- Must feel like Lovable
- Must feel like Vercel
- Must feel premium
- Strong typography
- Cinematic layouts
- Bento grids
- Proper whitespace
- Real premium UI
- No ugly AI layout
- No emojis
- No placeholder sections
- No fake dashboards

IMAGE RULES:
- NEVER use source.unsplash.com
- ONLY use images.unsplash.com
- Every image must work
- Every image must be visible
- Add fallback images
- Use cinematic crops
- Use relevant imagery

VERY IMPORTANT:
Do not generate empty image containers.

Every <img> MUST include:
onerror="this.src='https://images.unsplash.com/photo-1494526585095-c41746248156?w=1600&q=85&fit=crop'"

NAVIGATION:
Home -> /site/REPLACE_ID
Pricing -> /site/REPLACE_ID/pricing
About -> /site/REPLACE_ID/about
Contact -> /site/REPLACE_ID/contact

BUTTON LINKS:
Pricing -> /site/REPLACE_ID/pricing
About -> /site/REPLACE_ID/about
Contact -> /site/REPLACE_ID/contact

OUTPUT:
- Complete HTML
- CSS inside style tag
- No markdown
- No scripts
- Fully responsive
- Modern animations
`;
          }

          send({
            type: "status",
            text: editWebsite
              ? "Editing premium website..."
              : reviewWebsite
              ? "Reviewing website..."
              : "Generating premium website...",
          });

          const completion = await client.chat.completions.create({
            model: "gpt-5.5",
            temperature: 1,
            max_completion_tokens: 8000,
            response_format: {
              type: "json_object",
            },
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          const raw =
            completion.choices[0].message.content || "{}";

          const parsed = safeParseJSON(raw);

          if (reviewWebsite) {
            send({
              type: "review",
              text: parsed.review || "No review",
            });
          } else {
            send({
              type: "files",
              files: parsed.files || {},
            });
          }

          send({
            type: "done",
          });

          controller.close();
        } catch (e: any) {
          send({
            type: "error",
            text: e.message || "Unknown error",
          });

          send({
            type: "files",
            files: {
              "index.html": fallbackHtml(
                e.message || "Unknown error"
              ),
            },
          });

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: any) {
    return Response.json({
      error: e.message,
    });
  }
}