import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { html, instruction } = await req.json();

    if (!html || !instruction) {
      return NextResponse.json(
        { error: "Missing html or instruction" },
        { status: 400 }
      );
    }

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
You are an elite AI frontend engineer and website editor.

Your job is to MODIFY the existing app carefully based on the user's instruction.

USER INSTRUCTION:
"${instruction}"

CURRENT WEBSITE HTML:
${html}

VERY IMPORTANT:
- Preserve the overall design system.
- Preserve colors unless requested otherwise.
- Preserve layout unless requested otherwise.
- Preserve navigation and structure.
- Only change what the user requested.
- Keep the app premium and polished.
- Do not rewrite the entire app unnecessarily.
- Maintain styling consistency.
- Maintain spacing consistency.
- Maintain component consistency.
- Preserve useful working JavaScript.
- Apply the requested edit clearly.
- Improve design quality only if it supports the request.
- Do not mention OpenAI.
- Do not mention Problem to Profit.

Return ONLY the updated full HTML.
No markdown.
No explanation.
        `,
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: "OpenAI edit failed", details: raw },
        { status: 500 }
      );
    }

    const data = JSON.parse(raw);
    const updatedHtml = extractText(data).trim();

    if (!updatedHtml) {
      return NextResponse.json(
        { error: "No updated HTML returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      html: cleanCodeBlock(updatedHtml),
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
  return text
    .replace(/^```html/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}