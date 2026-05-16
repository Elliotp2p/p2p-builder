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

function clean(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```html/g, "")
    .replace(/```/g, "")
    .trim();
}

function fallbackHtml(message: string) {
  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<title>Generation failed</title>
<style>
body{margin:0;font-family:Inter,Arial;background:#020617;color:white;display:grid;place-items:center;min-height:100vh;padding:40px}
.card{max-width:760px;padding:40px;border-radius:24px;background:rgba(255,255,255,.08)}
h1{font-size:48px;margin-bottom:12px}
p{line-height:1.7;color:#cbd5e1}
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

function getProjectType(problem: string) {
  const p = problem.toLowerCase();

  const isTravel =
    p.includes("göteborg") ||
    p.includes("gothenburg") ||
    p.includes("travel") ||
    p.includes("city") ||
    p.includes("tourism") ||
    p.includes("geografi") ||
    p.includes("geography");

  const isFood =
    p.includes("pizza") ||
    p.includes("restaurant") ||
    p.includes("restaurang") ||
    p.includes("food") ||
    p.includes("menu") ||
    p.includes("meny");

  const isSaaS =
    p.includes("ai") ||
    p.includes("crm") ||
    p.includes("dashboard") ||
    p.includes("saas") ||
    p.includes("automation") ||
    p.includes("software");

  if (isTravel) return "travel";
  if (isFood) return "food";
  if (isSaaS) return "saas";
  return "auto";
}

function getStyleGuide(projectType: string) {
  if (projectType === "travel") {
    return `
STYLE DIRECTION:
Luxury Nordic travel/editorial website.
Use calm Scandinavian colors, cinematic travel photography, elegant typography, lots of whitespace.
Avoid neon SaaS dashboard styling.

IMAGE RULES:
- Detect the exact city/location from the user prompt.
- Use dynamic image URLs based on that location.
- Always include the real place name in the image query.
- Examples:
  Falsterbo: https://source.unsplash.com/1600x1000/?falsterbo,sweden,beach
  Gothenburg: https://source.unsplash.com/1600x1000/?gothenburg,sweden,harbor
  Stockholm: https://source.unsplash.com/1600x1000/?stockholm,sweden,waterfront
- Never use random forest images for city/travel websites.
`;
  }

  if (projectType === "food") {
    return `
STYLE DIRECTION:
Premium restaurant/editorial website.
Use warm dark colors, elegant typography, cinematic food photography, menu-style sections.
Avoid SaaS dashboard styling.

IMAGE RULES:
- Use dynamic food image URLs based on the cuisine/business.
- Examples:
  Pizza: https://source.unsplash.com/1600x1000/?pizza,restaurant,italian
  Sushi: https://source.unsplash.com/1600x1000/?sushi,restaurant,japanese
  Coffee: https://source.unsplash.com/1600x1000/?coffee,cafe,interior
`;
  }


  if (projectType === "saas") {
    return `
STYLE DIRECTION:
Premium SaaS/product website.
Use dark or clean modern UI, dashboard mockups, bento cards, trust rows, pricing CTA.
`;
  }

  return `
STYLE DIRECTION:
Choose the best visual style based on the business niche.
Do not reuse the same neon blue palette.
Pick colors, typography and layout based on the emotional tone of the idea.
`;
}

export async function POST(req: Request) {
  try {
    if (!client) {
      return Response.json({ error: "Missing OpenAI API key" });
    }

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
          send({ type: "status", text: "Thinking..." });

          const projectType = getProjectType(String(problem || instruction || ""));
          const designSystem =
  projectType === "travel"
    ? designSystems.nordic
    : projectType === "food"
    ? designSystems.restaurant
    : projectType === "saas"
    ? designSystems.saas
    : designSystems.luxury;
          const styleGuide = getStyleGuide(projectType);
          const selectedHero =
            projectType === "travel" || projectType === "food"
              ? heroTravel
              : heroSaaS;

          let prompt = "";

          if (reviewWebsite) {
            prompt = `
Return ONLY valid JSON.

Return:
{
  "files": {},
  "review": "..."
}

You are a senior website designer and conversion expert.

Review this website:
${currentHtml || ""}

Business idea:
${problem || ""}

Give a specific practical review:
- visual quality
- spacing
- typography
- CTA clarity
- trust
- mobile
- missing sections
- exact improvements
`;
          } else if (editWebsite) {
            prompt = `
Return ONLY valid JSON.

Return:
{
  "files": {
    "${activeFile || "index.html"}": "complete updated HTML"
  },
  "review": ""
}

You are editing a premium generated website.

User request:
${instruction || ""}

Active file:
${activeFile || "index.html"}

Current active HTML:
${currentHtml || ""}

Full project:
${JSON.stringify(allFiles || {}, null, 2)}

RULES:
- Return only changed files.
- Every returned file must be complete HTML.
- Preserve navigation and forms.
- Keep the design premium.
- No emojis.
- No external scripts.
- CSS must stay inside <style>.
- Buttons and CTAs must use real href links.

NAVIGATION:
Home = /site/REPLACE_ID
Pricing = /site/REPLACE_ID/pricing
About = /site/REPLACE_ID/about
Contact = /site/REPLACE_ID/contact

FORMS:
If adding/editing a contact form:
<form method="POST" action="/api/leads">
<input type="hidden" name="site_id" value="REPLACE_ID" />
<input name="name" />
<input name="email" type="email" />
<textarea name="message"></textarea>
<button type="submit">Send message</button>
</form>
`;
          } else {
            prompt = `
Return ONLY valid JSON.

Return exactly:
{
  "files": {
    "index.html": "complete homepage HTML"
  },
  "review": ""
}

You are a world-class startup website designer.
Build a premium homepage only.

BUSINESS IDEA:
${problem || ""}

TEMPLATE:
${template || ""}

STYLE:
${
  style === "auto"
    ? "Choose the best style automatically based on the niche."
    : style || "auto"
}

AUDIENCE:
${audience || ""}

${styleGuide}

PREBUILT PREMIUM SECTION REFERENCE:
SECTION LIBRARY:
${sectionLibrary}
Use these as quality reference and structure inspiration.
Do not copy blindly. Adapt to the business.

Hero reference:
${selectedHero}

Pricing reference:
${pricingSection}

CTA reference:
${ctaSection}

DESIGN SYSTEM:
${designSystem}

DESIGN QUALITY:
- Must look close to Lovable / Framer / Vercel quality.
- Strong hero.
- Strong visual hierarchy.
- Premium typography.
- Strong spacing.
- Beautiful cards.
- Realistic layout.
- No generic AI landing page.
- No emojis.
- No dead buttons.
- No fake useless sections.
- Use CSS variables.
- Use responsive media queries.
- Keep homepage compact under 260 lines.

TYPOGRAPHY RULES:
- Use dramatic typography hierarchy.
- Use ultra-large headlines when appropriate.
- Use tighter line-height on headings.
- Use generous whitespace.
- Use editorial composition similar to Framer and Linear.
- Avoid generic AI typography.
- Pick typography based on the niche:
  SaaS = modern clean sans-serif.
  Travel/editorial = elegant serif-style or refined editorial feeling.
  Restaurant = cinematic bold editorial type.
  Luxury = elegant high-end type.

VISUAL DEPTH:
- Use layered shadows.
- Use subtle borders.
- Use glassmorphism carefully.
- Add depth between sections.
- Use overlapping elements.
- Make cards feel tactile and premium.
- Avoid flat block stacking.

MOTION DESIGN THINKING:
- Layout should imply movement.
- Use layered compositions.
- Use floating cards.
- Use asymmetry where appropriate.
- Avoid static boring stacking.
- Use CSS transitions for buttons and cards.

IMAGE COMPOSITION:
- Use layered image layouts.
- Use cinematic crops.
- Use editorial image composition.
- Avoid one single boring centered image.
- Use premium visual storytelling.
- For travel/food/editorial pages, imagery should drive the design.

VISUAL DECISION RULES:
LOCATION IMAGE RULES:
- If the user mentions a real city/place/location, use highly relevant photography.
- Examples:
  Falsterbo -> beaches, luxury coastal Sweden, Falsterbo horse show
  Gothenburg -> harbor, Scandinavian city, trams, archipelago
  Stockholm -> waterfront, old town, luxury Nordic city
  Malmö -> modern skyline, waterfront, Scandinavian architecture
- Never use random forest or mountain images for city brands.
- Use highly relevant photography matching the exact location.
- Prefer editorial/travel photography over generic nature photos.
- If food/restaurant/travel/city/geography/lifestyle: use cinematic photography.
- If SaaS/AI/software/B2B: use dashboard/mockup UI.
- Do not force everything into neon blue dashboard style.
- Do not default to blue/cyan neon styling.
- Choose colors intentionally based on niche:
  food = warm black, orange, cream, deep red.
  travel/city = calm cinematic neutrals, stone, beige, muted blue.
  luxury = black, gold, beige, off-white.
  wellness = soft neutrals, muted green, sand.
  SaaS/AI = clean gradients, dark UI, glassmorphism.

IMAGES:
- Use highly relevant real photography.
- If the user mentions a real location/city/place, intelligently choose imagery matching that exact place.
- Use realistic editorial/travel photography.
- Never use random generic nature images unless the business is actually about nature.
- Never use fake placeholder blocks when imagery is important.

IMAGE URL RULES:
- Use dynamic Unsplash image URLs.
- Generate image URLs based on the actual location/business.

Examples:

Gothenburg:
https://source.unsplash.com/1600x900/?gothenburg,sweden,harbor

Falsterbo:
https://source.unsplash.com/1600x900/?falsterbo,sweden,beach

Stockholm:
https://source.unsplash.com/1600x900/?stockholm,sweden,city

Restaurant:
https://source.unsplash.com/1600x900/?restaurant,luxury,food

Luxury hotel:
https://source.unsplash.com/1600x900/?luxury,hotel,resort

RULES:
- The AI must adapt the search query to the exact place/business.
- Include city names, country names and business category in the image query.
- For city/travel brands use:
  city + country + skyline/harbor/architecture/beach depending on context.
- For restaurants use:
  cuisine + restaurant + food.
- For SaaS:
  use CSS dashboard mockups instead of photos.

NAVIGATION:
Every homepage nav must link to:
Home = /site/REPLACE_ID
Pricing = /site/REPLACE_ID/pricing
About = /site/REPLACE_ID/about
Contact = /site/REPLACE_ID/contact

BUTTONS:
- Get started / View pricing -> /site/REPLACE_ID/pricing
- Book demo / Contact / Plan trip -> /site/REPLACE_ID/contact
- Learn more / Explore -> /site/REPLACE_ID/about

OUTPUT RULES:
- Generate only index.html.
- Complete HTML document.
- CSS inside <style>.
- No external scripts.
- No markdown.
- Return ONLY valid JSON.
- Body must include margin:0; width:100%; min-height:100vh.
`;
          }

          send({
            type: "status",
            text: reviewWebsite
              ? "Reviewing website..."
              : editWebsite
              ? "Editing website..."
              : "Generating premium website...",
          });

          const completion = await client.chat.completions.create({
            model: "gpt-5.5",
            temperature: 1,
            max_completion_tokens: 8000,
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
          });

          const raw = completion.choices[0].message.content || "{}";
          const parsed = safeParseJSON(raw);

          if (reviewWebsite) {
            send({
              type: "review",
              text: parsed.review || "No review returned.",
            });
          } else {
            send({
              type: "files",
              files: parsed.files || {},
            });
          }

          send({ type: "done" });
          controller.close();
        } catch (e: any) {
          send({
            type: "error",
            text: e.message || "Unknown error",
          });

          if (!reviewWebsite) {
            send({
              type: "files",
              files: {
                "index.html": fallbackHtml(e.message || "Unknown error"),
              },
            });
          }

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
    return Response.json({ error: e.message });
  }
}