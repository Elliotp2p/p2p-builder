import OpenAI from "openai";

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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      problem,
      template,
      style,
      audience,
      editWebsite,
      currentHtml,
      instruction,
    } = body;

    if (!client) {
      return Response.json({
        steps: ["Demo mode"],
        files: {
          "index.html": "<h1>Missing OpenAI API key</h1>",
        },
      });
    }

    if (editWebsite) {
      const prompt = `
You are an elite AI website editor.

User change:
"${instruction}"

Current HTML:
${currentHtml}

Return ONLY valid JSON:
{
  "steps": ["Understanding request", "Updating website", "Fixing layout", "Rendering preview"],
  "files": {
    "index.html": "complete updated HTML"
  }
}

STRICT RULES:
- Return only JSON.
- No markdown.
- Complete HTML document.
- CSS inside <style>.
- No external images.
- No external scripts.

CRITICAL PREVIEW SIZE RULES:
- The website must fill the iframe naturally.
- Do NOT use transform: scale().
- Do NOT use zoom.
- Do NOT set body to display:flex with place-items:center for the whole site.
- Do NOT make the entire site look like a centered card/mockup.
- Do NOT put the whole page inside a small max-width wrapper.
- Body must be width: 100%; min-height: 100vh; margin: 0.
- Sections can have max-width, but the overall page background and layout must span full width.
- Use full-width sections.
- The page must scroll vertically if content is long.
`;

      const res = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.55,
        messages: [{ role: "user", content: prompt }],
      });

      return Response.json(
        JSON.parse(clean(res.choices[0].message.content || "{}"))
      );
    }

    const prompt = `
You are an elite AI website builder, product designer, frontend engineer and conversion copywriter.

Build a premium, unique, production-quality website.

Business idea comes from this user problem:
"${problem}"

Template:
"${template}"

Preferred visual style:
"${style}"

Target audience:
"${audience}"

IMPORTANT:
The website is NOT for "Problem to Profit AI".
The website is for the NEW business that solves the user's problem.
Do not explain the idea. Build the company's real public website.

Return ONLY valid JSON:
{
  "steps": [
    "Understanding the business",
    "Creating brand direction",
    "Designing the layout",
    "Writing conversion copy",
    "Building the website",
    "Polishing the final preview"
  ],
  "files": {
    "index.html": "complete HTML document with CSS in style tag"
  }
}

QUALITY RULES:
- Complete HTML document.
- CSS inside <style>.
- No markdown.
- No external images.
- No external scripts.
- Fully responsive.
- Premium startup feel.
- Strong visual hierarchy.
- Beautiful hero section.
- Real brand name.
- Real navigation.
- Clear CTA.
- CSS-based product mockup.
- Social proof.
- Features.
- How it works.
- Pricing.
- FAQ.
- Footer.
- Avoid generic text.
- Avoid boring gray SaaS layout.
- Make it feel like a real funded startup.
- Use specific copy, not vague copy.
- Do not use emojis.
- Do not mention: business idea, analysis, MVP, revenue model, target audience, problem.
- Do not write about building websites.
- Do not mention Problem to Profit AI.

CRITICAL PREVIEW SIZE RULES:
- The generated website must fill the iframe naturally.
- The page must look like a normal full website, not a tiny centered preview.
- Do NOT use transform: scale().
- Do NOT use zoom.
- Do NOT use CSS that shrinks the whole website.
- Do NOT set body to display:flex with align-items:center and justify-content:center for the entire page.
- Do NOT wrap the whole page in a small card.
- Do NOT make the entire website max-width: 900px or 1100px.
- Body CSS must include: margin: 0; width: 100%; min-height: 100vh;
- Use full-width backgrounds and full-width sections.
- Inner content can use max-width: 1200px or 1280px, but sections must span full width.
- The page must scroll vertically when content is longer than the viewport.
- Hero should take significant space, but not shrink the entire site.
- The iframe should show a real full-size website.

GOOD STRUCTURE:
<body>
  <nav>...</nav>
  <main>
    <section class="hero">...</section>
    <section>...</section>
    <section>...</section>
  </main>
  <footer>...</footer>
</body>

BAD STRUCTURE:
<body>
  <div class="tiny-card">
    entire website here
  </div>
</body>

Template behavior:
- SaaS Landing Page: product dashboard mockup, pricing, features, integrations.
- Mobile App: phone mockup, app benefits, reviews, app-style CTA.
- Agency Website: services, process, case-study feel, consultation CTA.
- Marketplace: buyer/seller sections, trust, categories, matching flow.
- AI Tool: automation dashboard, prompt/workflow UI, productivity benefits.
- Local Business: local trust, service area, reviews, booking/contact CTA.

Design behavior:
- If style says luxury: dark, elegant, premium, strong spacing.
- If style says minimal: clean, white space, calm colors.
- If style says playful: rounded cards, softer colors, friendly copy.
- If style says futuristic: gradients, glow, dashboard vibe.
- If style says Apple: minimal, large type, lots of whitespace.
- If style says Stripe/Linear: polished SaaS, gradients, product UI.

Make the page visually impressive and full-size.
`;

    const res = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.9,
      messages: [{ role: "user", content: prompt }],
    });

    return Response.json(
      JSON.parse(clean(res.choices[0].message.content || "{}"))
    );
  } catch (e: any) {
    return Response.json({
      steps: ["Error"],
      files: {
        "index.html": `<h1>Error</h1><p>${e.message}</p>`,
      },
    });
  }
}