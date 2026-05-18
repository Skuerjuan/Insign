import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <Link href="/auth/sign-in">Ir a Log-in</Link>
    </div>
  );
}
