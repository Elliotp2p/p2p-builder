const publish = async () => {
  if (!files["index.html"]) {
    setStatus("Generate first");
    return;
  }

  setStatus("Publishing");
  setMessages((m) => [
    ...m,
    {
      role: "ai",
      text: "Publishing the multi-page site and creating a live link...",
    },
  ]);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    setStatus("Publish error");
    setMessages((m) => [
      ...m,
      {
        role: "ai",
        text: "Publish error: You are not logged in.",
      },
    ]);
    return;
  }

  const res = await fetch("/api/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      html: files["index.html"],
      files,
      name: problem,
      problem,
      template,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    setStatus("Publish error");
    setMessages((m) => [
      ...m,
      {
        role: "ai",
        text: "Publish error: " + data.error,
      },
    ]);
    return;
  }

  const fullUrl = window.location.origin + data.url;

  setLink(fullUrl);
  setStatus("Published");
  setMessages((m) => [
    ...m,
    {
      role: "ai",
      text: "Published. Your multi-page live link is ready.",
    },
  ]);

  loadProjects();
  loadLeads();
};