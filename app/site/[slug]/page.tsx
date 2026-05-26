import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("projects")
    .select("html,pages")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const firstPageHtml =
    Array.isArray(data.pages) && data.pages[0]?.html
      ? data.pages[0].html
      : data.html;

  if (!firstPageHtml) {
    notFound();
  }

  return (
    <iframe
      srcDoc={firstPageHtml}
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        display: "block",
      }}
    />
  );
}