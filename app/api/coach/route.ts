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

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const MODEL = "gpt-5-mini";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1600&q=85&fit=crop";

const IMAGE_BANK = {
  food: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&q=85&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1600&q=85&fit=crop",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85&fit=crop",
  ],
  travel: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=85&fit=crop",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=85&fit=crop",
    "https://images.unsplash.com/photo-1526481280695-3c4691f8f5b8?w=1600&q=85&fit=crop",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=85&fit=crop",
  ],
  saas: [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=85&fit=crop",
    "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=85&fit=crop",
  ],
  ecommerce: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=85&fit=crop",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=85&fit=crop",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1600&q=85&fit=crop",
  ],
  luxury: [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=85&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&fit=crop",
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1600&q=85&fit=crop",
  ],
};

type ProjectType =
  | "saas"
  | "food"
  | "travel"
  | "ecommerce"
  | "wellness"
  | "local"
  | "portfolio"
  | "luxury";

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

    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }

    throw new Error("Invalid JSON from AI");
  }
}

function fallbackHtml(message: string) {
  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<title>Generation failed</title>
<style>
body{margin:0;width:100%;min-height:100vh;font-family:Inter,Arial,sans-serif;background:#050509;color:white;display:grid;place-items:center;padding:40px}
.card{max-width:760px;padding:42px;border-radius:30px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);box-shadow:0 40px 120px rgba(0,0,0,.45)}
h1{font-size:52px;margin:0 0 14px;letter-spacing:-.05em}
p{line-height:1.7;color:#d4d4d8}
</style>
</head>
<body>
<div class="card">
<h1>Generation failed</h1>
<p>${message}</p>
</div>
</body>
</html>`;
}

function getProjectType(input: string): ProjectType {
  const p = input.toLowerCase();

  if (
    p.includes("restaurant") ||
    p.includes("restaurang") ||
    p.includes("pizza") ||
    p.includes("food") ||
    p.includes("menu") ||
    p.includes("meny") ||
    p.includes("cafe") ||
    p.includes("coffee") ||
    p.includes("bar") ||
    p.includes("bakery") ||
    p.includes("sushi")
  ) {
    return "food";
  }

  if (
    p.includes("travel") ||
    p.includes("hotel") ||
    p.includes("resort") ||
    p.includes("tourism") ||
    p.includes("city") ||
    p.includes("göteborg") ||
    p.includes("gothenburg") ||
    p.includes("stockholm") ||
    p.includes("falsterbo") ||
    p.includes("malmö") ||
    p.includes("mallorca") ||
    p.includes("geography") ||
    p.includes("geografi")
  ) {
    return "travel";
  }

  if (
    p.includes("shop") ||
    p.includes("store") ||
    p.includes("ecommerce") ||
    p.includes("e-commerce") ||
    p.includes("skincare") ||
    p.includes("brand") ||
    p.includes("fashion") ||
    p.includes("product")
  ) {
    return "ecommerce";
  }

  if (
    p.includes("gym") ||
    p.includes("fitness") ||
    p.includes("wellness") ||
    p.includes("yoga") ||
    p.includes("health") ||
    p.includes("clinic")
  ) {
    return "wellness";
  }

  if (
    p.includes("portfolio") ||
    p.includes("studio") ||
    p.includes("agency") ||
    p.includes("architect") ||
    p.includes("designer")
  ) {
    return "portfolio";
  }

  if (
    p.includes("local") ||
    p.includes("salon") ||
    p.includes("plumber") ||
    p.includes("cleaning") ||
    p.includes("städfirma") ||
    p.includes("dentist") ||
    p.includes("tandläkare")
  ) {
    return "local";
  }

  if (
    p.includes("ai") ||
    p.includes("saas") ||
    p.includes("crm") ||
    p.includes("dashboard") ||
    p.includes("automation") ||
    p.includes("software") ||
    p.includes("platform") ||
    p.includes("app")
  ) {
    return "saas";
  }

  return "luxury";
}

function getDesignPersonality(projectType: ProjectType) {
  const map: Record<ProjectType, string> = {
    food: `
DESIGN PERSONALITY:
Cinematic editorial restaurant brand.
Warm black, cream, burnt orange, deep red.
Atmospheric food/interior photography.
Menu-style composition, reservation flow, premium local feeling.
No SaaS dashboard styling.
`,
    travel: `
DESIGN PERSONALITY:
Luxury Nordic editorial travel brand.
Calm Scandinavian neutrals, cinematic photography, map-inspired details.
Destination storytelling, large images, quiet premium typography.
No neon SaaS styling.
`,
    ecommerce: `
DESIGN PERSONALITY:
Premium ecommerce brand.
Editorial product grid, strong product desire, tactile cards, collection sections.
Luxury conversion flow with product photography.
`,
    wellness: `
DESIGN PERSONALITY:
Soft premium wellness brand.
Muted green, sand, cream, warm neutrals, peaceful spacing.
Trust, calm, bookings, routines, transformation.
`,
    portfolio: `
DESIGN PERSONALITY:
High-end creative studio portfolio.
Editorial layout, bold project previews, strong typography, elegant case-study feeling.
`,
    local: `
DESIGN PERSONALITY:
Premium local business website.
Clear trust, service areas, social proof, booking/contact conversion.
Looks professional, friendly, modern and credible.
`,
    saas: `
DESIGN PERSONALITY:
World-class SaaS/product website inspired by Linear, Vercel, Stripe and Lovable.
Bento grids, product UI, dashboard mockups, clean gradients, trust rows.
Minimal, sharp, premium. Do not overuse neon.
`,
    luxury: `
DESIGN PERSONALITY:
Luxury premium modern website.
Elegant typography, strong spacing, cinematic composition, black/off-white/gold/beige or carefully chosen palette.
`,
  };

  return map[projectType];
}

function getImageBank(projectType: ProjectType) {
  if (projectType === "food") return IMAGE_BANK.food.join("\n");
  if (projectType === "travel") return IMAGE_BANK.travel.join("\n");
  if (projectType === "ecommerce") return IMAGE_BANK.ecommerce.join("\n");
  if (projectType === "saas") return IMAGE_BANK.saas.join("\n");
  return IMAGE_BANK.luxury.join("\n");
}

function getDesignSystem(projectType: ProjectType) {
  if (projectType === "travel") return designSystems.nordic;
  if (projectType === "food") return designSystems.restaurant;
  if (projectType === "saas") return designSystems.saas;
  return designSystems.luxury;
}

function getHeroReference(projectType: ProjectType) {
  if (projectType === "travel" || projectType === "food") return heroTravel;
  return heroSaaS;
}

function baseRules(projectType: ProjectType) {
  return `
GLOBAL OUTPUT RULES:
- Return ONLY valid JSON.
- No markdown.
- No explanations outside JSON.
- Every HTML file must be a COMPLETE HTML document.
- CSS must be inside <style>.
- No external scripts.
- No emoji icons.
- No lorem ipsum.
- No dead buttons.
- Body must include exactly these base properties somewhere in CSS: margin:0; width:100%; min-height:100vh;
- Use responsive media queries.
- Finished product quality only.

JSON SHAPE:
{
  "files": {
    "index.html": "complete HTML"
  },
  "review": ""
}

NAVIGATION:
Home = /site/REPLACE_ID
Pricing = /site/REPLACE_ID/pricing
About = /site/REPLACE_ID/about
Contact = /site/REPLACE_ID/contact

BUTTON RULES:
- Pricing / plans / get started -> /site/REPLACE_ID/pricing
- Contact / book / reserve / demo -> /site/REPLACE_ID/contact
- Learn more / about / explore -> /site/REPLACE_ID/about
- Every clickable element must have a real href if it navigates.

IMAGE RULES:
- NEVER use source.unsplash.com.
- ONLY use direct images.unsplash.com photo URLs from the bank below.
- Every image must be visible.
- Never create empty image containers.
- Never create image boxes with only alt text.
- Every <img> must include:
  onerror="this.src='${FALLBACK_IMAGE}'"
- For SaaS/software, prefer CSS dashboard mockups instead of random photos.
- For food/travel/ecommerce/luxury, use real photography.

ALLOWED IMAGE BANK:
${getImageBank(projectType)}
`;
}

function wowDesignRules(projectType: ProjectType) {
  return `
WOW DESIGN ENGINE:
Before writing HTML, silently plan:
1. Brand name.
2. Emotional tone.
3. Color system.
4. Typography mood.
5. Hero layout.
6. Primary conversion path.
7. Visual rhythm.
8. Trust strategy.
9. Mobile layout.
10. Final polish pass.

MAKE IT FEEL EXPENSIVE:
- Use CSS variables.
- Use large spacing.
- Use editorial hierarchy.
- Use at least one visually memorable hero.
- Use section contrast, not same cards repeated.
- Use subtle gradients, soft borders, deep shadows.
- Use bento or editorial composition where appropriate.
- Use real visual details inside cards.
- Avoid boring three-card rows unless they are visually polished.

SECTION QUALITY:
Every section must have at least one of:
- image composition
- product mockup
- stat visual
- process timeline
- bento grid
- testimonial/proof element
- pricing preview
- strong CTA panel

NICHE INTELLIGENCE:
- For SaaS: dashboard mockup, metrics cards, workflow UI, integrations, pricing CTA.
- For food: cinematic food hero, menu preview, location/reservation, atmosphere.
- For travel: destination story, image mosaic, itinerary cards, map-like detail.
- For ecommerce: product grid, collection cards, benefits, purchase CTA.
- For local: trust, services, reviews, booking/contact.
- For wellness: calm visual rhythm, outcomes, trust, booking CTA.
- For portfolio: case-study previews, studio principles, bold visuals.

PROJECT TYPE DETECTED:
${projectType}
`;
}

function generatePrompt(args: {
  problem: string;
  template?: string;
  audience?: string;
  projectType: ProjectType;
}) {
  const { problem, template, audience, projectType } = args;

  return `
${baseRules(projectType)}

You are a world-class website designer, product strategist and frontend engineer.

TASK:
Create a premium homepage for this idea:
"${problem}"

TEMPLATE CONTEXT:
${template || "Auto choose"}

AUDIENCE:
${audience || "Auto detect"}

${getDesignPersonality(projectType)}

DESIGN SYSTEM:
${getDesignSystem(projectType)}

REFERENCE SECTION LIBRARY:
${sectionLibrary}

HERO REFERENCE:
${getHeroReference(projectType)}

PRICING REFERENCE:
${pricingSection}

CTA REFERENCE:
${ctaSection}

${wowDesignRules(projectType)}

HOMEPAGE STRUCTURE:
1. Premium navbar.
2. High-impact hero above the fold.
3. Trust/proof strip.
4. Main visual/product/brand section.
5. Feature/benefit bento.
6. How it works/story section.
7. Pricing preview or conversion section.
8. FAQ.
9. Final CTA.
10. Footer.

COPYWRITING:
- Premium concise copy.
- Strong headline.
- Clear value proposition.
- Specific benefits.
- CTA text must match the business.
- No fake names like John Doe.
- No boring generic copy.

IMPORTANT:
Generate ONLY index.html for first generation.
Keep it compact but premium.
`;
}

function editPrompt(args: {
  instruction: string;
  activeFile: string;
  currentHtml: string;
  allFiles: any;
  problem: string;
  projectType: ProjectType;
}) {
  return `
${baseRules(args.projectType)}

You are editing an existing premium website like a senior Framer/Lovable designer.

USER REQUEST:
${args.instruction}

BUSINESS IDEA:
${args.problem}

ACTIVE FILE:
${args.activeFile}

CURRENT HTML:
${args.currentHtml}

FULL PROJECT FILES:
${JSON.stringify(args.allFiles || {}, null, 2)}

RETURN SHAPE:
{
  "files": {
    "${args.activeFile || "index.html"}": "complete updated HTML"
  },
  "review": ""
}

EDITING RULES:
- Return only changed files.
- Every returned file must be complete HTML.
- Preserve brand direction unless user asks to change it.
- Preserve navigation and contact forms.
- Keep all CTAs working.
- Improve visual quality while editing.
- If user asks "make it more premium", change layout, spacing, typography and visual rhythm, not just colors.
- If user asks "more cinematic", improve images, contrast, hero, editorial composition.
- Never use source.unsplash.com.
- Never output broken or partial HTML.

CONTACT FORM:
If adding/editing contact form, use:
<form method="POST" action="/api/leads">
<input type="hidden" name="site_id" value="REPLACE_ID" />
<input name="name" />
<input name="email" type="email" />
<textarea name="message"></textarea>
<button type="submit">Send message</button>
</form>
`;
}

function reviewPrompt(args: {
  currentHtml: string;
  problem: string;
  activeFile?: string;
}) {
  return `
Return ONLY valid JSON.

{
  "files": {},
  "review": "..."
}

You are a brutally honest senior product designer, conversion expert and frontend reviewer.

Review this website:
${args.currentHtml}

Business idea:
${args.problem}

Active file:
${args.activeFile || "index.html"}

Give:
- exact visual score /10
- biggest design issue
- conversion issue
- typography issue
- layout issue
- image issue
- mobile issue
- 8 specific fixes
- one "make it wow" recommendation
`;
}

function normalizeFiles(files: Record<string, string>) {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(files || {})) {
    let html = String(value || "");

    html = html.replaceAll("source.unsplash.com", "images.unsplash.com");

    if (!html.includes("<!doctype html") && !html.includes("<!DOCTYPE html")) {
      html = "<!doctype html>\n" + html;
    }

    if (!html.includes("REPLACE_ID")) {
      html = html.replaceAll("/site/#", "/site/REPLACE_ID");
    }

    result[key] = html;
  }

  return result;
}

export async function POST(req: Request) {
  try {
    if (!client) {
      return Response.json({ error: "Missing OpenAI API key" }, { status: 500 });
    }

    const body = await req.json();

    const {
      problem = "",
      template = "",
      audience = "",
      editWebsite,
      reviewWebsite,
      currentHtml = "",
      instruction = "",
      activeFile = "index.html",
      allFiles = {},
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
          send({ type: "status", text: "Thinking..." });

          const projectType = getProjectType(
            String(problem || instruction || currentHtml || "")
          );

          let prompt = "";

          if (reviewWebsite) {
            prompt = reviewPrompt({
              currentHtml: String(currentHtml || ""),
              problem: String(problem || ""),
              activeFile: String(activeFile || "index.html"),
            });
          } else if (editWebsite) {
            prompt = editPrompt({
              instruction: String(instruction || ""),
              activeFile: String(activeFile || "index.html"),
              currentHtml: String(currentHtml || ""),
              allFiles,
              problem: String(problem || ""),
              projectType,
            });
          } else {
            prompt = generatePrompt({
              problem: String(problem || ""),
              template: String(template || ""),
              audience: String(audience || ""),
              projectType,
            });
          }

          send({
            type: "status",
            text: reviewWebsite
              ? "Reviewing website..."
              : editWebsite
              ? "Editing premium website..."
              : "Generating premium website...",
          });

          const completion = await client.chat.completions.create({
            model: MODEL,
            temperature: 1,
            max_completion_tokens: 10000,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You output strict JSON only. You are a senior website designer, conversion strategist and frontend engineer. No markdown. No explanations.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          const raw = completion.choices[0]?.message?.content || "{}";
          const parsed = safeParseJSON(raw);

          if (reviewWebsite) {
            send({
              type: "review",
              text: parsed.review || "No review returned.",
            });
          } else {
            const normalized = normalizeFiles(parsed.files || {});
            send({
              type: "files",
              files: normalized,
            });
          }

          send({ type: "done" });
          controller.close();
        } catch (e: any) {
          const message = e?.message || "Unknown error";

          send({ type: "error", text: message });

          if (!reviewWebsite) {
            send({
              type: "files",
              files: {
                "index.html": fallbackHtml(message),
              },
            });
          }

          send({ type: "done" });
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
    return Response.json(
      { error: e?.message || "Unknown coach error" },
      { status: 500 }
    );
  }
}