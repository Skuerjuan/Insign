import Image from "next/image";
import Link from "next/link";
import styles from "./DictionaryNavLink.module.css";

export default function DictionaryNavLink({ active = false }: { active?: boolean }) {
  return (
    <Link href="/diccionario" className={`${styles.link} ${active ? styles.active : ""}`} aria-current={active ? "page" : undefined}>
      <Image src="/diccionario.svg" alt="" width={40} height={40} />
      Diccionario
    </Link>
  );
}
