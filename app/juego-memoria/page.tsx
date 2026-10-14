import JuegoMemoria from "@/src/juegos/JuegoMemoria";
import { auth } from "@/lib/auth/server";
import { getProfile } from "@/lib/server/profile.actions";
import { redirect } from "next/navigation";
import { getLevel, getLevelWords } from "@/lib/levels";

export const dynamic = "force-dynamic";

export default async function JuegoMemoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ origen?: string; nivel?: string }>;
}) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const profile = await getProfile(session.user.id);
  const { origen, nivel } = await searchParams;
  const level = Number(nivel) || undefined;
  if (level && (!getLevel(level) || (level > 1 && profile.nivel < level))) redirect("/menu");

  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <JuegoMemoria
        points={profile.puntos ?? 0}
        origin={origen === "entrenamiento" ? "training" : "menu"}
        level={level}
        palabras={level ? getLevelWords(level) : undefined}
      />
    </main>
  );
}
