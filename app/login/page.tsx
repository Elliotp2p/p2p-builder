"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const login = async () => {
    setStatus("Skickar magic link...");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/builder`,
      },
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Kolla din email och klicka länken.");
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#09090b", color: "white", fontFamily: "Inter, system-ui" }}>
      <div style={{ width: 420, padding: 28, borderRadius: 24, background: "#0f0f12", border: "1px solid rgba(255,255,255,.1)" }}>
        <h1>Logga in</h1>
        <p style={{ color: "#9ca3af" }}>Få en magic link till din email.</p>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@email.com"
          style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,.1)", background: "#111114", color: "white" }}
        />

        <button onClick={login} style={{ width: "100%", marginTop: 14, padding: 14, borderRadius: 999, border: "none", background: "#22c55e", color: "#052e16", fontWeight: 900 }}>
          Skicka magic link
        </button>

        <p style={{ color: "#9ca3af" }}>{status}</p>
      </div>
    </main>
  );
}