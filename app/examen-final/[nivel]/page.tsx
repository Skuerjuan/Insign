import { notFound, redirect } from "next/navigation";
import { getSession, getProfile, getCompletedGames } from "@/lib/server/profile.actions";
import { getLevel } from "@/src/diccionario/diccionario";
import { LEVEL_GAMES } from "@/lib/exam";
import FinalExam from "@/components/FinalExam";

export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ nivel: string }> }) {
  const level = getLevel(Number((await params).nivel));
  if (!level) notFound();
  const user = await getSession();
  const profile = await getProfile(user.id);
  if (level.id > profile.nivel) redirect("/menu");
  const games = await getCompletedGames(user.id, level.id);
  if (!LEVEL_GAMES.every((game) => games.includes(game))) redirect(`/nivel/${level.id}`);
  return <FinalExam level={level.id} title={level.title} points={profile.puntos ?? 0} />;
}
