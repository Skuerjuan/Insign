import JuegoEleccion from "@/src/juegos/JuegoAdivinar";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function JuegoAdivinarPage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <JuegoEleccion userName={session.user.name} />
    </main>
  );
}
