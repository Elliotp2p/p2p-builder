import OpenAI from "openai";

export const runtime = "nodejs";

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

export async function POST(req: Request) {
  try {
    if (!client) {
      return Response.json({
        error: "Missing OpenAI API key",
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

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          send({
            type: "status",
            text: "Thinking...",
          });

          let prompt = "";

          if (editWebsite) {
            prompt = `
Return ONLY valid JSON. No markdown.

You are editing a generated multi-page startup website.

User request:
"${instruction}"

Active file:
${activeFile || "index.html"}

Current active HTML:
${currentHtml || ""}

Full project context:
${JSON.stringify(allFiles || {}, null, 2)}

Return:
{
  "files": {
    "${activeFile || "index.html"}": "complete updated HTML"
  }
}

Rules:
- Return only changed files.
- Every returned file must be a complete HTML document.
- CSS must be inside <style>.
- No markdown.
- No external scripts.
- No external images.
- Keep layout premium, modern, clean.
- Every visible CTA should be a working <a href=""> link when possible.
- Navigation links:
  Home = /site/REPLACE_ID
  Pricing = /site/REPLACE_ID/pricing
  About = /site/REPLACE_ID/about
  Contact = /site/REPLACE_ID/contact

DATABASE FORM RULES:
- If editing contact.html or adding a contact/lead/demo form, the form MUST submit to /api/leads.
- Use method="POST".
- Include hidden input:
  <input type="hidden" name="site_id" value="REPLACE_ID" />
- Use input names exactly:
  name="name"
  name="email"
  name="message"
- The submit control should be:
  <button type="submit">Send message</button>
- Do not use JavaScript for form submission.
- Do not use mailto for the main contact form.
`;
          } else {
            prompt = `
Return ONLY valid JSON. No markdown.

Build a PREMIUM multi-page startup website.

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
- The site is for a NEW company solving the user's idea.
- Not for Problem to Profit AI.
- Create a realistic brand name.
- Every file must be complete HTML.
- CSS must be inside <style> in every file.
- No markdown.
- No external images.
- No external scripts.
- No emojis.
- Full-width sections.
- Body CSS must include margin:0; width:100%; min-height:100vh.
- Do not use transform: scale().
- Do not use zoom.
- Premium startup quality.
- Strong typography.
- Strong hero.
- Strong CTA.
- Modern cards, gradients, mockups.
- Compact enough to generate quickly.

NAVIGATION:
Every page must include nav links:
Home = /site/REPLACE_ID
Pricing = /site/REPLACE_ID/pricing
About = /site/REPLACE_ID/about
Contact = /site/REPLACE_ID/contact

BUTTON + CTA RULES:
- Every visible button must work.
- Prefer <a class="button" href="...">Text</a> for CTAs.
- Do not create dead buttons.
- Do not use JavaScript onclick.
- "Get started", "Start free", "View pricing", "Choose plan", "See plans" link to /site/REPLACE_ID/pricing.
- "Book demo", "Contact sales", "Talk to us", "Schedule call", "Request demo" link to /site/REPLACE_ID/contact.
- "Learn more", "About us", "Our story" link to /site/REPLACE_ID/about.
- Pricing card CTAs should link to /site/REPLACE_ID/contact.

DATABASE FORM RULES:
contact.html MUST include a real working lead/contact form.
The form must look premium and must be exactly this behavior:
<form method="POST" action="/api/leads">
  <input type="hidden" name="site_id" value="REPLACE_ID" />
  <input name="name" ... />
  <input name="email" type="email" ... />
  <textarea name="message" ...></textarea>
  <button type="submit">Send message</button>
</form>

Important:
- Do not use mailto as the main form.
- Do not use JavaScript for the form.
- Do not remove the hidden site_id field.
- The contact form must be styled beautifully with CSS.
- The submit button must be a real button type="submit".

PAGE CONTENT:
index.html:
- Hero
- product mockup
- trust/social proof
- features
- how it works
- CTA
- footer

pricing.html:
- pricing hero
- 3 pricing cards
- FAQ
- CTA
- footer

about.html:
- mission
- why now
- story
- principles/team-style section
- CTA
- footer

contact.html:
- contact hero
- real database form that posts to /api/leads
- contact methods
- FAQ
- CTA/footer
`;
          }

          send({
            type: "status",
            text: editWebsite
              ? "Editing website..."
              : "Generating website...",
          });

          const completion = await client.chat.completions.create({
            model: "gpt-4.1-mini",
            temperature: editWebsite ? 0.45 : 0.7,
            max_tokens: 14000,
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

          const raw = completion.choices[0].message.content || "{}";
          const parsed = safeParseJSON(raw);

          send({
            type: "files",
            files: parsed.files || {},
          });

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
              "index.html": fallbackHtml(e.message || "Unknown error"),
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