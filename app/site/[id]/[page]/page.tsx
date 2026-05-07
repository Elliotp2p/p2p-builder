import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
  process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
);

export default async function SitePage({
  params,
}: {
  params: Promise<{ id: string; page: string }>;
}) {
  const { id, page } = await params;

  const { data, error } = await supabase
    .from("sites")
    .select("html_files")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const fileName = `${page}.html`;

  const html =
    data.html_files?.[fileName] ||
    data.html_files?.["index.html"] ||
    "";

  return (
    <iframe
      srcDoc={html}
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        display: "block",
      }}
    />
  );
}