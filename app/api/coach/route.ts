import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const MODEL = "gpt-4.1-mini";

function clean(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```html/g, "")
    .replace(/```/g, "")
    .trim();
}

async function ask(prompt: string, temperature = 0.75) {
  if (!client) return "";

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature,
    messages: [{ role: "user", content: prompt }],
  });

  return clean(response.choices[0]?.message?.content || "");
}

function safeParse(text: string) {
  try {
    return JSON.parse(clean(text));
  } catch {
    return null;
  }
}

function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

function fallback(title: string) {
  return {
    steps: ["Demo-läge", "Ingen API-key hittades"],
    files: {
      "index.html": `
<!DOCTYPE html>
<html>
<head>
<title>Demo</title>
<style>
body{font-family:Arial;padding:60px;background:#f7f3ea;color:#111}
h1{font-size:52px}
button{padding:14px 22px;border-radius:999px;border:none;background:#22c55e;color:white;font-weight:bold}
</style>
</head>
<body>
<h1>Smart tjänst för ${title}</h1>
<p>Demo-preview. Lägg in OPENAI_API_KEY i .env.local för riktig AI.</p>
<button>Testa gratis</button>
</body>
</html>
`,
    },
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { problem, editWebsite, currentHtml, instruction } = body;

    const title =
      typeof problem === "string"
        ? problem
        : problem?.title || "ett vardagsproblem";

    if (!client) return Response.json(fallback(title));

    if (editWebsite) {
      const updatedRaw = await ask(`
Du är en Lovable-liknande AI website editor.

Användaren vill ändra:
"${instruction}"

Nuvarande HTML:
${currentHtml}

Gör ändringen tydligt. Om användaren ber om ny layout, gör en stor layoutförändring.

Returnera endast JSON:
{
  "steps": [
    "Läser ändringen",
    "Planerar om layouten",
    "Uppdaterar designen",
    "Bygger ny preview"
  ],
  "files": {
    "index.html": "komplett uppdaterad HTML"
  }
}

Regler:
- Ingen markdown.
- Returnera komplett HTML.
- CSS ska ligga i <style>.
- Behåll det som inte behöver ändras.
- Sidan ska kännas som riktig startup, inte analys.
`, 0.7);

      const updated = safeParse(updatedRaw);

      return Response.json(
        updated || {
          steps: ["Kunde inte tolka AI-svar"],
          files: { "index.html": currentHtml },
        }
      );
    }

    const seed = randomSeed();

    const mutationRaw = await ask(`
Du är en creative director för AI website generation.

Skapa en unik mutation blueprint för en hemsida som löser:
"${title}"

Seed:
${seed}

Välj INTE samma standard SaaS-layout varje gång.

Du MÅSTE välja olika kombinationer från dessa:

DESIGNSTIL:
- minimal-tech
- bold-startup
- luxury-dark
- playful-modern
- futuristic-ai
- editorial-premium
- finance-clean
- consumer-app
- agency-polished
- neon-dashboard

HERO-TYP:
- split-screen
- centered-hero
- dashboard-first
- editorial-story
- big-visual-left
- floating-cards
- product-demo
- pricing-first
- problem-solution
- cinematic-dark

LAYOUT-RYTM:
- asymmetric-grid
- stacked-cards
- magazine-layout
- dashboard-layout
- timeline-flow
- alternating-sections
- Bento-grid
- full-width-blocks
- compact-app-layout
- layered-panels

SEKTIONER:
Välj 6–8 unika sektionstyper från:
- social-proof-strip
- pain-moment
- before-after
- feature-bento
- interactive-demo
- workflow-timeline
- testimonial-wall
- pricing-comparison
- founder-note
- use-cases
- guarantee
- faq-accordion
- final-cta
- metrics-row
- integration-grid
- customer-story
- security-trust
- onboarding-steps

Returnera endast JSON:
{
  "seed": "${seed}",
  "designStyle": "",
  "heroType": "",
  "layoutRhythm": "",
  "sectionTypes": [],
  "visualMotif": "",
  "colorPalette": {
    "background": "",
    "surface": "",
    "text": "",
    "muted": "",
    "primary": "",
    "accent": ""
  },
  "shapeLanguage": "",
  "motionFeel": "",
  "brandPersonality": "",
  "mustLookDifferentBecause": ""
}
`, 1);

    const mutation = safeParse(mutationRaw);

    const brandRaw = await ask(`
Du är en senior brand strategist.

Skapa ett riktigt startup-varumärke baserat på denna mutation.

Problem/kontext:
${title}

Mutation blueprint:
${JSON.stringify(mutation)}

Returnera endast JSON:
{
  "brandName": "",
  "category": "",
  "oneLinePromise": "",
  "targetVisitor": "",
  "emotionalAngle": "",
  "tone": "",
  "positioning": "",
  "avoid": ["affärsidé", "analys", "problem", "MVP", "intäktsmodell"]
}

Regler:
- Det ska kännas som ett riktigt bolag.
- Inte som en analys.
- Namnet ska vara kort och brandable.
`, 0.9);

    const brand = safeParse(brandRaw);

    const copyRaw = await ask(`
Du är en premium conversion copywriter.

Skriv all copy för hemsidan.

Brand:
${JSON.stringify(brand)}

Mutation:
${JSON.stringify(mutation)}

Kontext:
${title}

Returnera endast JSON:
{
  "nav": {
    "links": [],
    "cta": ""
  },
  "hero": {
    "eyebrow": "",
    "headline": "",
    "subheadline": "",
    "ctaPrimary": "",
    "ctaSecondary": ""
  },
  "sections": [
    {
      "type": "",
      "headline": "",
      "body": "",
      "items": [
        {"title": "", "text": ""}
      ]
    }
  ],
  "pricing": {
    "headline": "",
    "body": "",
    "price": "",
    "cta": ""
  },
  "faq": [
    {"q": "", "a": ""}
  ],
  "finalCta": {
    "headline": "",
    "body": "",
    "cta": ""
  }
}

Regler:
- Prata direkt till besökaren.
- Sälj resultatet, inte tekniken.
- Använd inte orden: affärsidé, analys, MVP, intäktsmodell, målgrupp.
- Undvik generiska fraser.
- Copy ska matcha mutationens stil.
`, 0.88);

    const copy = safeParse(copyRaw);

    const htmlRaw = await ask(`
Du är en senior frontend engineer, designer och creative technologist.

Bygg en komplett HTML-hemsida utifrån mutation blueprint.

Mutation blueprint:
${JSON.stringify(mutation)}

Brand:
${JSON.stringify(brand)}

Copy:
${JSON.stringify(copy)}

KRITISKT:
Du får INTE bygga en vanlig standard SaaS-sida varje gång.
Du MÅSTE följa:
- designStyle
- heroType
- layoutRhythm
- sectionTypes
- visualMotif
- colorPalette
- shapeLanguage

Om heroType är dashboard-first: visa dashboard/mockup direkt i hero.
Om heroType är editorial-story: gör mer story/magazine.
Om heroType är cinematic-dark: gör mörk filmisk landing.
Om layoutRhythm är Bento-grid: använd bento cards.
Om layoutRhythm är timeline-flow: använd timeline.
Om layoutRhythm är asymmetric-grid: gör asymmetrisk layout.

Returnera endast komplett HTML.
CSS ska ligga i <style>.
Ingen markdown.
Inga externa bilder.
Inga externa scripts.
Inga emojis.
Responsiv.
Skapa CSS-baserade visuella element/mockups.
Måste innehålla nav, hero, valda sektioner, pricing, faq, final CTA.
Använd inte orden: affärsidé, analys, MVP, intäktsmodell, målgrupp.
`, 0.95);

    const critiqueRaw = await ask(`
Du är en brutal website quality reviewer.

Granska denna HTML:
${htmlRaw}

Mutation som skulle följas:
${JSON.stringify(mutation)}

Returnera endast JSON:
{
  "score": 1,
  "issues": [],
  "fixes": [],
  "isTooGeneric": true,
  "mutationFollowed": true
}

Var hård:
- Ser den för mycket ut som en standard template?
- Följde den heroType?
- Följde den layoutRhythm?
- Är den unik?
- Är den premium?
`, 0.35);

    const critique = safeParse(critiqueRaw);

    const finalHtmlRaw = await ask(`
Du är senior designer och frontend engineer.

Förbättra HTML:n baserat på kritiken och gör den mer unik.

HTML:
${htmlRaw}

Kritik:
${JSON.stringify(critique)}

Mutation blueprint:
${JSON.stringify(mutation)}

KRAV:
- Om sidan är för generisk, ändra layouten tydligt.
- Följ heroType och layoutRhythm hårdare.
- Gör visuella element mer unika.
- Förbättra spacing, hierarchy, cards, CTA och mockup.
- Returnera endast komplett HTML.
- CSS i <style>.
- Ingen markdown.
`, 0.75);

    return Response.json({
      steps: [
        "Analyserar produkten",
        "Skapar mutation blueprint",
        "Väljer designstil",
        "Väljer hero-typ",
        "Planerar unik layout",
        "Skriver copy",
        "Bygger kod",
        "Granskar kvalitet",
        "Muterar designen",
      ],
      files: {
        "index.html": finalHtmlRaw || htmlRaw,
      },
    });
  } catch (error: any) {
    return Response.json({
      steps: ["AI error", error.message],
      files: {
        "index.html": `<h1>Något gick fel</h1><p>${error.message}</p>`,
      },
    });
  }
}