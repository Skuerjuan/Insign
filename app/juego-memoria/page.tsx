import JuegoMemoria from "@/src/juegos/memoria/JuegoMemoria";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function JuegoMemoriaPage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <JuegoMemoria userName={session.user.name} />
    </main>
  );
}
