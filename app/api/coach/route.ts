import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
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
<title>Error</title>
<style>
body{
margin:0;
font-family:Inter,Arial;
background:#020617;
color:white;
display:grid;
place-items:center;
min-height:100vh;
padding:40px;
}
.card{
max-width:760px;
padding:40px;
border-radius:24px;
background:rgba(255,255,255,.08);
}
h1{
font-size:48px;
margin-bottom:12px;
}
p{
line-height:1.7;
color:#cbd5e1;
}
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

function safeParse(content: string) {
  try {
    return JSON.parse(clean(content));
  } catch {
    const cleaned = clean(content);

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }

    throw new Error("Invalid JSON from AI");
  }
}

function ensureFiles(files: any) {
  return {
    "index.html": files["index.html"],
    "pricing.html":
      files["pricing.html"] || files["index.html"],
    "about.html":
      files["about.html"] || files["index.html"],
    "contact.html":
      files["contact.html"] || files["index.html"],
  };
}

export async function POST(req: Request) {
  try {
    if (!client) {
      return Response.json({
        files: {
          "index.html": fallbackHtml("Missing OpenAI API key."),
        },
      });
    }

    const body = await req.json();

    const {
      problem,
      template,
      style,
      audience,
      editWebsite,
      currentHtml,
      instruction,
      activeFile,
      allFiles,
    } = body;

    if (editWebsite) {
      const prompt = `
Return ONLY valid JSON.

User request:
"${instruction}"

Active file:
${activeFile}

Current HTML:
${currentHtml}

Project context:
${JSON.stringify(allFiles || {}, null, 2)}

Return:
{
  "files": {
    "${activeFile}": "complete updated HTML"
  }
}

Rules:
- Return only changed files.
- Complete HTML document.
- CSS inside <style>.
- Full width layout.
- No markdown.
- No external scripts.
- Every button must work.
- Use links instead of dead buttons.
`;

      const res = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.4,
        max_tokens: 12000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const parsed = safeParse(
        res.choices[0].message.content || "{}"
      );

      return Response.json({
        files: parsed.files || {},
      });
    }

    const prompt = `
Return ONLY valid JSON.

Build a PREMIUM startup website.

Business idea:
"${problem}"

Template:
${template}

Style:
${style}

Audience:
${audience}

Return:
{
  "files": {
    "index.html": "complete homepage HTML",
    "pricing.html": "complete pricing HTML",
    "about.html": "complete about HTML",
    "contact.html": "complete contact HTML"
  }
}

GLOBAL RULES:
- Every file complete HTML.
- CSS inside <style>.
- No markdown.
- No external images.
- No external scripts.
- No emojis.
- Full-width sections.
- Beautiful modern spacing.
- Premium startup quality.
- Make it look funded.
- Strong hero section.
- Strong CTA sections.
- Strong typography.
- Add gradients/cards/mockups.
- Avoid generic boring layouts.

VERY IMPORTANT:
- Keep HTML relatively compact.
- Avoid huge repeated sections.
- Avoid unnecessary text.
- Avoid giant FAQs.
- Avoid giant testimonials sections.
- Avoid giant CSS files.
- Keep response FAST.

NAVIGATION:
Home = /site/REPLACE_ID
Pricing = /site/REPLACE_ID/pricing
About = /site/REPLACE_ID/about
Contact = /site/REPLACE_ID/contact

BUTTON RULES:
- Every CTA must work.
- Use <a href=""> links.
- Never create dead buttons.
- Hero CTA should go to pricing.
- Contact CTA should go to contact page.
- Pricing cards should link to contact.

PAGE RULES:

index.html:
- Hero
- Features
- Product mockup
- CTA
- Footer

pricing.html:
- Pricing hero
- 3 pricing cards
- FAQ
- CTA

about.html:
- Mission
- Story
- Team section
- CTA

contact.html:
- Contact hero
- Form UI
- Contact methods
- CTA
`;

    const res = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      max_tokens: 14000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const parsed = safeParse(
      res.choices[0].message.content || "{}"
    );

    const files = ensureFiles(parsed.files || {});

    return Response.json({
      files,
    });
  } catch (e: any) {
    return Response.json({
      files: {
        "index.html": fallbackHtml(
          e.message || "Unknown error"
        ),
      },
    });
  }
}