import AbecedarioView from "@/src/juegos/Abecedario";
import { auth } from "@/lib/auth/server";
import { getProfile } from "@/lib/server/profile.actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AbecedarioPage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const profile = await getProfile(session.user.id);

  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <AbecedarioView
        points={profile.puntos ?? 0}
        userName={session.user.name}
      />
    </main>
  );
}