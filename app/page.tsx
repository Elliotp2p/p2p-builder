"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
<h1 style={{ color: "red" }}>NEW DEPLOY TEST</h1>
const categories = [
  "All",
  "Food",
  "Planning",
  "School",
  "Money",
  "Home",
  "Shopping",
  "Health",
  "Travel",
];

const problems = [
  {
    id: 1,
    title: "Recipe scaler for exact portions",
    category: "Food",
    market: "home cooks",
    pain: "People get annoyed when recipes are made for 4 people but they need food for 1, 2, 7 or 12 people.",
    website: "A website where users enter how many people they cook for and instantly get the exact ingredient amounts.",
    monetization: "Free tool with premium meal plans",
    prompt: "Build a clean website for a recipe scaler that changes ingredients based on exact number of people. Include hero, how it works, examples, pricing and contact.",
  },
  {
    id: 2,
    title: "Weekly meal planner that reduces food waste",
    category: "Food",
    market: "families and students",
    pain: "People buy random groceries and then throw away food because meals are not planned.",
    website: "A meal planning website that creates a weekly food plan and shopping list based on budget and leftovers.",
    monetization: "Monthly subscription",
    prompt: "Build a website for a weekly meal planner that reduces food waste and creates shopping lists from budget and leftovers.",
  },
  {
    id: 3,
    title: "Fridge leftover recipe finder",
    category: "Food",
    market: "busy people",
    pain: "People have ingredients at home but do not know what to cook with them.",
    website: "A website where users type what they have in the fridge and get recipe ideas instantly.",
    monetization: "Ads plus premium recipe filters",
    prompt: "Build a website for a fridge leftover recipe finder where users enter ingredients and get meal ideas.",
  },
  {
    id: 4,
    title: "Study plan generator before exams",
    category: "School",
    market: "students",
    pain: "Students panic before tests because they do not know what to study first or how to divide the time.",
    website: "A website that creates a study plan based on subject, test date and current knowledge level.",
    monetization: "Premium study plans",
    prompt: "Build a website for students that creates a study plan before exams based on subject, test date and level.",
  },
  {
    id: 5,
    title: "Homework deadline organizer",
    category: "School",
    market: "students",
    pain: "Students forget assignments because deadlines are spread across different platforms and messages.",
    website: "A simple dashboard for adding school tasks and seeing what must be done today, this week and later.",
    monetization: "Freemium subscription",
    prompt: "Build a website for a homework deadline organizer that helps students track tasks and deadlines.",
  },
  {
    id: 6,
    title: "Gift finder by budget and personality",
    category: "Shopping",
    market: "people buying gifts",
    pain: "People do not know what gift to buy and waste time searching random lists.",
    website: "A website where users enter age, interests and budget and get gift ideas.",
    monetization: "Affiliate links",
    prompt: "Build a website for a gift finder that recommends gifts based on budget, age and personality.",
  },
  {
    id: 7,
    title: "Outfit planner for weather",
    category: "Planning",
    market: "young people",
    pain: "People check the weather but still do not know what to wear.",
    website: "A website that suggests outfits based on weather, occasion and style.",
    monetization: "Affiliate links and premium style packs",
    prompt: "Build a website for an outfit planner that suggests clothes based on weather, occasion and style.",
  },
  {
    id: 8,
    title: "Packing list generator for trips",
    category: "Travel",
    market: "travelers",
    pain: "People always forget things when packing for trips.",
    website: "A website that creates a packing list based on destination, weather, trip length and activities.",
    monetization: "Premium travel templates",
    prompt: "Build a website for a packing list generator based on destination, weather, trip length and activities.",
  },
  {
    id: 9,
    title: "Shared apartment chore planner",
    category: "Home",
    market: "roommates",
    pain: "Roommates argue because nobody knows who should clean, buy toilet paper or take out trash.",
    website: "A website that creates a fair weekly chore schedule for roommates.",
    monetization: "Freemium subscription",
    prompt: "Build a website for roommates that creates a fair chore schedule and tracks tasks.",
  },
  {
    id: 10,
    title: "Personal budget fixer",
    category: "Money",
    market: "young adults",
    pain: "People do not understand where their money goes each month.",
    website: "A website where users enter income and costs and get a simple budget plan.",
    monetization: "Premium financial templates",
    prompt: "Build a website for a personal budget fixer that helps users understand spending and create a budget.",
  },
  {
    id: 11,
    title: "Subscription tracker",
    category: "Money",
    market: "consumers",
    pain: "People forget subscriptions and keep paying for apps they do not use.",
    website: "A website where users track subscriptions, renewal dates and monthly costs.",
    monetization: "Freemium subscription",
    prompt: "Build a website for a subscription tracker that helps people cancel unused subscriptions.",
  },
  {
    id: 12,
    title: "Workout plan for limited time",
    category: "Health",
    market: "busy people",
    pain: "People want to train but only have 15, 20 or 30 minutes and do not know what to do.",
    website: "A website that creates workouts based on goal, available time and equipment.",
    monetization: "Premium workout plans",
    prompt: "Build a website for a workout planner that creates training plans based on time, goal and equipment.",
  },
  {
    id: 13,
    title: "Cleaning schedule for messy homes",
    category: "Home",
    market: "families and students",
    pain: "People feel overwhelmed because the whole home is messy and they do not know where to start.",
    website: "A website that creates a small daily cleaning plan based on room and available time.",
    monetization: "Premium home routines",
    prompt: "Build a website for a cleaning schedule generator that creates small daily cleaning tasks.",
  },
  {
    id: 14,
    title: "Cheapest grocery list checker",
    category: "Shopping",
    market: "families and students",
    pain: "People want to save money on groceries but do not know which store is cheapest for their list.",
    website: "A website where users enter a shopping list and compare estimated prices.",
    monetization: "Affiliate deals and premium price tracking",
    prompt: "Build a website for a grocery price checker that compares shopping lists and helps users save money.",
  },
  {
    id: 15,
    title: "Freelance price calculator",
    category: "Money",
    market: "freelancers",
    pain: "New freelancers do not know how much to charge and often price too low.",
    website: "A website that calculates suggested project prices based on hours, skill level and costs.",
    monetization: "Premium calculator and templates",
    prompt: "Build a website for a freelance price calculator that helps freelancers know what to charge.",
  },
  {
    id: 16,
    title: "Date idea generator",
    category: "Planning",
    market: "couples",
    pain: "People want to do something fun but always end up doing the same thing.",
    website: "A website that suggests date ideas based on budget, weather and location.",
    monetization: "Affiliate bookings and premium ideas",
    prompt: "Build a website for a date idea generator based on budget, weather and location.",
  },
  {
    id: 17,
    title: "Pet care reminder",
    category: "Home",
    market: "pet owners",
    pain: "Pet owners forget medication, grooming, food refills or vet appointments.",
    website: "A website that tracks pet routines and sends reminders.",
    monetization: "Monthly subscription",
    prompt: "Build a website for a pet care reminder that tracks food, medicine, grooming and vet appointments.",
  },
  {
    id: 18,
    title: "Simple event planner",
    category: "Planning",
    market: "people planning parties",
    pain: "People planning birthdays or small events forget tasks, food, invitations and budget.",
    website: "A website that creates a checklist and budget for small events.",
    monetization: "Premium event templates",
    prompt: "Build a website for a simple event planner that creates checklists, budgets and invitation plans.",
  },
];



export default function Home() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [customIdea, setCustomIdea] = useState("");
  const [selected, setSelected] = useState(problems[0]);
  const [showAll, setShowAll] = useState(false);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchesFilter = filter === "All" || p.category === filter;
      const q = query.toLowerCase();

      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.market.toLowerCase().includes(q) ||
        p.pain.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [query, filter]);

  const visibleProblems = showAll
    ? filteredProblems
    : filteredProblems.slice(0, 18);

  const customHref = customIdea.trim()
    ? `/builder?idea=${encodeURIComponent(customIdea.trim())}`
    : "/builder";

  return (
    <main style={app}>
      <aside style={sidebar}>
        <Link href="/" style={brandBlock}>
          <div style={logo}>P</div>
          <div>
            <strong>Problem to Profit</strong>
            <p style={mutedSmall}>AI website workspace</p>
          </div>
        </Link>

        <nav style={nav}>
          <a href="#workspace" style={navActive}>Workspace</a>
          <a href="#ideas" style={navLink}>Ideas</a>
          <Link href="/builder" style={navLink}>Builder</Link>
        </nav>

        <div style={sideCard}>
          <span style={miniBadge}>Status</span>
          <h3 style={{ margin: "10px 0 6px" }}>Ready to build</h3>
          <p style={muted}>
            Start from a prompt or choose a validated problem idea.
          </p>
        </div>
      </aside>

      <section style={mainArea}>
        <header style={topbar}>
          <div>
            <p style={eyebrow}>Problem to Profit AI</p>
            <h1 style={title}>
              A clean workspace for turning ideas into websites.
            </h1>
          </div>

          <Link href="/builder" style={topCta}>
            Open Builder
          </Link>
        </header>

        <section id="workspace" style={workspaceGrid}>
          <div style={promptPanel}>
            <span style={miniBadge}>Start from scratch</span>
            <h2 style={panelTitle}>Describe what you want to build</h2>
            <p style={muted}>
              Write one sentence. The AI chooses the layout, style, sections,
              images and conversion flow.
            </p>

            <textarea
              value={customIdea}
              onChange={(e) => setCustomIdea(e.target.value)}
              placeholder="Ex: Luxury Nordic travel website for Gothenburg with cinematic harbor photography"
              style={promptInput}
            />

            <Link href={customHref} style={primaryButton}>
              Generate website
            </Link>
          </div>

          <div style={statsPanel}>
            <div style={statCard}>
              <strong>120+</strong>
              <span>Problem ideas</span>
            </div>
            <div style={statCard}>
              <strong>4</strong>
              <span>Core pages</span>
            </div>
            <div style={statCard}>
              <strong>AI</strong>
              <span>Design engine</span>
            </div>
          </div>
        </section>

        <section id="ideas" style={ideasPanel}>
          <div style={panelHeader}>
            <div>
              <span style={miniBadge}>Opportunity library</span>
              <h2 style={{ margin: "10px 0 4px" }}>Browse startup ideas</h2>
              <p style={muted}>
                Pick a problem. Preview the business angle. Generate the site.
              </p>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ideas..."
              style={search}
            />
          </div>

          <div style={filters}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                style={filter === c ? filterActive : filterBtn}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={contentGrid}>
            <div style={ideaList}>
              {visibleProblems.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={selected.id === p.id ? ideaActive : ideaCard}
                >
                  <div style={ideaTop}>
                    <span style={badge}>{p.category}</span>
                    <span style={ideaId}>#{p.id}</span>
                  </div>

                  <strong>{p.title}</strong>
                  <p>{p.pain}</p>
                </button>
              ))}

              {!showAll && filteredProblems.length > 18 && (
                <button onClick={() => setShowAll(true)} style={showMore}>
                  Show all {filteredProblems.length} ideas
                </button>
              )}
            </div>

            <aside style={details}>
              <span style={badgeLarge}>{selected.category}</span>
              <h2 style={detailTitle}>{selected.title}</h2>

              <div style={detailBlock}>
                <span>Problem</span>
                <p>{selected.pain}</p>
              </div>

              <div style={detailBlock}>
                <span>Website angle</span>
                <p>{selected.website}</p>
              </div>

              <div style={detailBlock}>
                <span>Monetization</span>
                <p>{selected.monetization}</p>
              </div>

              <Link
                href={`/builder?idea=${encodeURIComponent(selected.prompt)}`}
                style={primaryButton}
              >
                Build this website
              </Link>
            </aside>
          </div>
        </section>
      </section>
    </main>
  );
}

const app: React.CSSProperties = {
  minHeight: "100vh",
  background: "#08080c",
  color: "#fff",
  fontFamily: "Inter, system-ui, Arial",
  display: "grid",
  gridTemplateColumns: "280px 1fr",
};

const sidebar: React.CSSProperties = {
  padding: 18,
  borderRight: "1px solid rgba(255,255,255,.08)",
  background: "#06060a",
  display: "flex",
  flexDirection: "column",
  gap: 22,
};

const brandBlock: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  color: "#fff",
  textDecoration: "none",
};

const logo: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: "linear-gradient(135deg,#6366f1,#a855f7,#ec4899)",
  display: "grid",
  placeItems: "center",
  fontWeight: 950,
};

const nav: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const navLink: React.CSSProperties = {
  padding: "12px 14px",
  color: "#a1a1aa",
  textDecoration: "none",
  fontWeight: 750,
  borderRadius: 12,
};

const navActive: React.CSSProperties = {
  ...navLink,
  color: "#fff",
  background: "rgba(255,255,255,.07)",
};

const sideCard: React.CSSProperties = {
  marginTop: "auto",
  padding: 18,
  borderRadius: 20,
  background: "rgba(255,255,255,.045)",
  border: "1px solid rgba(255,255,255,.08)",
};

const mainArea: React.CSSProperties = {
  padding: 26,
  overflowY: "auto",
};

const topbar: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 24,
  marginBottom: 24,
};

const eyebrow: React.CSSProperties = {
  margin: 0,
  color: "#c4b5fd",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  fontWeight: 900,
};

const title: React.CSSProperties = {
  fontSize: 58,
  lineHeight: 0.95,
  letterSpacing: "-.07em",
  maxWidth: 760,
  margin: "10px 0 0",
};

const topCta: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 999,
  background: "#fff",
  color: "#09090b",
  textDecoration: "none",
  fontWeight: 900,
};

const workspaceGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr .8fr",
  gap: 18,
  marginBottom: 22,
};

const promptPanel: React.CSSProperties = {
  padding: 28,
  borderRadius: 28,
  background:
    "linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.035))",
  border: "1px solid rgba(255,255,255,.09)",
  boxShadow: "0 30px 100px rgba(0,0,0,.32)",
};

const panelTitle: React.CSSProperties = {
  fontSize: 34,
  lineHeight: 1.05,
  letterSpacing: "-.04em",
  margin: "12px 0 8px",
};

const promptInput: React.CSSProperties = {
  width: "100%",
  height: 116,
  marginTop: 18,
  padding: 16,
  borderRadius: 20,
  border: "1px solid rgba(167,139,250,.28)",
  background: "rgba(0,0,0,.28)",
  color: "#fff",
  outline: "none",
  resize: "none",
  fontSize: 15,
  lineHeight: 1.6,
  boxSizing: "border-box",
};

const primaryButton: React.CSSProperties = {
  marginTop: 16,
  display: "inline-flex",
  justifyContent: "center",
  padding: "13px 18px",
  borderRadius: 999,
  background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
};

const statsPanel: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const statCard: React.CSSProperties = {
  padding: 24,
  borderRadius: 24,
  background: "rgba(255,255,255,.045)",
  border: "1px solid rgba(255,255,255,.08)",
};

const ideasPanel: React.CSSProperties = {
  padding: 24,
  borderRadius: 28,
  background: "rgba(255,255,255,.035)",
  border: "1px solid rgba(255,255,255,.08)",
};

const panelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "center",
};

const search: React.CSSProperties = {
  width: 300,
  padding: "13px 15px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.045)",
  color: "#fff",
  outline: "none",
};

const filters: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 20,
};

const filterBtn: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.09)",
  background: "rgba(255,255,255,.035)",
  color: "#a1a1aa",
  cursor: "pointer",
};

const filterActive: React.CSSProperties = {
  ...filterBtn,
  background: "rgba(167,139,250,.16)",
  color: "#fff",
};

const contentGrid: React.CSSProperties = {
  marginTop: 22,
  display: "grid",
  gridTemplateColumns: "1.35fr .82fr",
  gap: 20,
};

const ideaList: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 12,
  maxHeight: 620,
  overflowY: "auto",
};

const ideaCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.07)",
  background: "rgba(255,255,255,.035)",
  color: "#fff",
  textAlign: "left",
  cursor: "pointer",
};

const ideaActive: React.CSSProperties = {
  ...ideaCard,
  border: "1px solid rgba(167,139,250,.45)",
  background: "rgba(167,139,250,.1)",
};

const ideaTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10,
};

const badge: React.CSSProperties = {
  fontSize: 11,
  color: "#c4b5fd",
  fontWeight: 900,
};

const ideaId: React.CSSProperties = {
  color: "#71717a",
  fontSize: 11,
};

const details: React.CSSProperties = {
  position: "sticky",
  top: 20,
  alignSelf: "start",
  padding: 22,
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,.1)",
  background:
    "linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.035))",
};

const badgeLarge: React.CSSProperties = {
  color: "#c4b5fd",
  fontWeight: 900,
  fontSize: 13,
};

const detailTitle: React.CSSProperties = {
  fontSize: 32,
  lineHeight: 1.05,
  letterSpacing: "-.04em",
};

const detailBlock: React.CSSProperties = {
  marginTop: 18,
};

const muted: React.CSSProperties = {
  color: "#a1a1aa",
  lineHeight: 1.6,
  margin: 0,
};

const mutedSmall: React.CSSProperties = {
  color: "#71717a",
  fontSize: 12,
  margin: "3px 0 0",
};

const miniBadge: React.CSSProperties = {
  color: "#c4b5fd",
  fontWeight: 900,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 1.2,
};

const showMore: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.06)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};