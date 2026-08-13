import JuegoMemoria from "@/src/juegos/JuegoMemoria";
import { auth } from "@/lib/auth/server";
import { getProfile } from "@/lib/server/profile.actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function JuegoMemoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ origen?: string }>;
}) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const profile = await getProfile(session.user.id);
  const { origen } = await searchParams;

  return (
    <main style={{ width: "100%", minWidth: 320, height: "100dvh", overflow: "hidden" }}>
      <JuegoMemoria
        points={profile.puntos ?? 0}
        origin={origen === "entrenamiento" ? "training" : "menu"}
      />
    </main>
  );
}
