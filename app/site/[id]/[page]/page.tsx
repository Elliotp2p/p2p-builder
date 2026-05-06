import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function SiteSubPage({
  params,
}: {
  params: Promise<{ id: string; page: string }>;
}) {
  const { id, page } = await params;

  const fileName = `${page}.html`;

  const { data, error } = await supabase
    .from("sites")
    .select("html_files")
    .eq("id", id)
    .single();

  if (error || !data?.html_files?.[fileName]) notFound();

  return (
    <iframe
      srcDoc={data.html_files[fileName]}
      style={{ width: "100vw", height: "100vh", border: "none", display: "block" }}
    />
  );
}