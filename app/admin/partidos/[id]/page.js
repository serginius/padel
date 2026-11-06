import { redirect, notFound } from "next/navigation";
import MatchForm from "./MatchForm";
import { createClient, getViewer } from "@/lib/supabase/server";
import { getLeague } from "@/lib/data";
import { nextMatchDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditMatch({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { isAdmin } = await getViewer(supabase);
  if (!isAdmin) redirect("/");
  const { players, matches } = await getLeague(supabase);
  let m;
  if (id === "nuevo") {
    const last = [...matches].sort((a, b) => b.date.localeCompare(a.date))[0];
    m = { id: null, date: nextMatchDate(last?.date), time: last?.time || "20:00", place: last?.place || "", court: last?.court || "",
      status: "programado", sets: [], teamA: [], teamB: [], notes: "",
      golden_point: !!last?.golden_point, super_tb: !!last?.super_tb, signups: [], videos: [] };
  } else {
    m = matches.find((x) => x.id === id);
    if (!m) notFound();
  }
  return <MatchForm match={m} players={players} />;
}
