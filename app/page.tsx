"use client";

import { useState } from "react";

export default function Page() {
  const [html, setHtml] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);

    const res = await fetch("/api/coach", {
      method: "POST",
      body: JSON.stringify({
        problem: "Folk hatar att tvätta",
      }),
    });

    const data = await res.json();
    setHtml(data.files["index.html"]);
    setLoading(false);
  };

  const publish = async () => {
    if (!html) return alert("Generera först");

    const res = await fetch("/api/save", {
      method: "POST",
      body: JSON.stringify({ html }),
    });

    const data = await res.json();

    const fullUrl = window.location.origin + data.url;
    setLink(fullUrl);
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>AI Builder</h1>

      <button onClick={generate}>
        {loading ? "Bygger..." : "Generera sida"}
      </button>

      <br /><br />

      <button onClick={publish}>
        Publicera sida
      </button>

      <br /><br />

      {link && (
        <div>
          <p>Din sida:</p>
          <a href={link} target="_blank">
            {link}
          </a>
        </div>
      )}

      <br /><br />

      {html && (
        <iframe
          srcDoc={html}
          style={{ width: "100%", height: "500px" }}
        />
      )}
    </main>
  );
}