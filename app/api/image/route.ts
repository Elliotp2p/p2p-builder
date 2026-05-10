import OpenAI from "openai";

export const runtime = "nodejs";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export async function POST(req: Request) {
  try {
    if (!client) {
      return Response.json(
        { error: "Missing OpenAI API key" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const prompt = String(body.prompt || "").trim();

    if (!prompt) {
      return Response.json(
        { error: "Missing image prompt" },
        { status: 400 }
      );
    }

    const finalPrompt = `
Create a premium hero image for a modern startup website.

Style:
- clean SaaS landing page aesthetic
- premium realistic/product mockup feel
- no text in the image
- no logos
- no watermarks
- modern lighting
- suitable for website hero section

Image idea:
${prompt}
`;

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt: finalPrompt,
      size: "1024x1024",
    });

    const base64 = result.data?.[0]?.b64_json;

    if (!base64) {
      return Response.json(
        { error: "No image returned" },
        { status: 500 }
      );
    }

    return Response.json({
      image: `data:image/png;base64,${base64}`,
    });
  } catch (error: any) {
    return Response.json(
      {
        error: error.message || "Unknown image generation error",
      },
      { status: 500 }
    );
  }
}