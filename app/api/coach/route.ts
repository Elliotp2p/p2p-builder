import OpenAI from "openai";

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

export async function POST(req: Request) {
  try {
    if (!client) {
      return Response.json({ error: "Missing OpenAI API key" }, { status: 500 });
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          send({ type: "status", text: "Thinking..." });

          const prompt = editWebsite
            ? `
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
- NEVER include Supabase keys.
- NEVER include sb_secret.
- NEVER include Authorization headers.
- NEVER include Bearer tokens.
- Do not use JavaScript fetch for forms.
- Navigation links:
  Home = /site/REPLACE_ID
  Pricing = /site/REPLACE_ID/pricing
  About = /site/REPLACE_ID/about
  Contact = /site/REPLACE_ID/contact

Contact form rules:
<form method="POST" action="/api/leads">
  <input type="hidden" name="site_id" value="REPLACE_ID" />
  <input name="name" />
  <input name="email" type="email" />
  <textarea name="message"></textarea>
  <button type="submit">Send message</button>
</form>
`
            : `
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
- No JavaScript fetch.
- No Supabase code.
- NEVER include Supabase keys.
- NEVER include sb_secret.
- NEVER include Authorization headers.
- NEVER include Bearer tokens.
- Full-width sections.
- Body CSS must include margin:0; width:100%; min-height:100vh.
- Premium startup quality.

NAVIGATION:
Home = /site/REPLACE_ID
Pricing = /site/REPLACE_ID/pricing
About = /site/REPLACE_ID/about
Contact = /site/REPLACE_ID/contact

CTA RULES:
- Use <a href=""> for CTAs.
- No dead buttons.
- Pricing CTAs link to /site/REPLACE_ID/contact.
- Demo/contact CTAs link to /site/REPLACE_ID/contact.

CONTACT FORM:
contact.html MUST include this real form:
<form method="POST" action="/api/leads">
  <input type="hidden" name="site_id" value="REPLACE_ID" />
  <input name="name" />
  <input name="email" type="email" />
  <textarea name="message"></textarea>
  <button type="submit">Send message</button>
</form>
`;

          send({
            type: "status",
            text: editWebsite ? "Editing website..." : "Generating website...",
          });

          const completion = await client.chat.completions.create({
            model: "gpt-4.1-mini",
            temperature: editWebsite ? 0.35 : 0.65,
            max_tokens: 14000,
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
          });

          const raw = completion.choices[0].message.content || "{}";
          const parsed = safeParseJSON(raw);

          send({ type: "files", files: parsed.files || {} });
          send({ type: "done" });

          controller.close();
        } catch (e: any) {
          send({ type: "error", text: e.message || "Unknown error" });
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
    return Response.json({ error: e.message }, { status: 500 });
  }
}