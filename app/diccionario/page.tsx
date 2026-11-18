import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Foto from "@/components/Foto";
import DictionaryNavLink from "@/components/DictionaryNavLink";
import { getProfile, getSession } from "@/lib/server/profile.actions";
import { getDictionaryLevels } from "@/lib/dictionary";
import DictionaryWords from "./DictionaryWords";
import menu from "../menu/styles.module.css";
import styles from "./styles.module.css";

export const dynamic = "force-dynamic";

export default async function Diccionario({ searchParams }: { searchParams: Promise<{ unidad?: string }> }) {
  const user = await getSession();
  const profile = await getProfile(user.id);
  const levels = getDictionaryLevels(profile);
  const { unidad } = await searchParams;
  const selected = unidad === undefined ? undefined : levels.find((level) => String(level.id) === unidad);
  if (unidad !== undefined && !selected) notFound();
  if (selected && !selected.unlocked) redirect("/diccionario");

  return (
    <div className={menu.fondo}>
      <aside className={menu.aside}>
        <h1 className={menu.logo}><span className={menu.blanco}>In</span><span className={menu.amarillo}>Sign</span></h1>
        <Link href="/menu" className={menu.source}><Image src="/casablanco.webp" alt="" width={40} height={40} className={menu.casa} />Inicio</Link>
        <Link href="/entrenamiento" className={menu.source}><Image src="/pesa.webp" alt="" width={40} height={40} className={menu.pesa} />Entrenamiento</Link>
        <Link href="/progreso" className={menu.source}><Image src="/premio.webp" alt="" width={40} height={40} className={menu.premio} />Progreso</Link>
        <Link href="/perfil" className={menu.source}><Image src="/userwhite.webp" alt="" width={40} height={40} className={menu.userwhite} />Perfil</Link>
        <DictionaryNavLink active />
        <Link href="/configuracion" className={menu.source}><Image src="/ajustes.webp" alt="" width={40} height={40} className={menu.ajustes} />Configuración</Link>
      </aside>
      <div className={menu.mainContent}>
        <header className={`${menu.header} ${styles.header}`}>
          <div className={menu.greeting}>
            <h2>Diccionario</h2>
            <p className={styles.subtitle}>Consultá las señas de tus niveles habilitados.</p>
          </div>
          <div className={menu.profilePlaceholder}><Foto user={user} /></div>
        </header>
        {selected ? (
          <main className={styles.content}>
            <Link href="/diccionario" className={styles.back}>← Todas las unidades</Link>
            <h1 className={styles.unitTitle}>{selected.title}</h1>
            <DictionaryWords key={selected.id} signs={selected.signs} />
          </main>
        ) : (
          <main className={menu.levels} aria-label="Unidades del diccionario">
            {levels.map((level) => (
              <section key={level.id} className={`${menu.levelCard} ${menu[level.colorClass]} ${!level.unlocked ? menu.locked : ""}`}>
                <div className={menu.levelImagePlaceholder}>
                  <Image src="/loro-mango.webp" alt="" width={179} height={180} className={menu.levelImage} />
                  {!level.unlocked && <Image src="/lock.webp" alt="Unidad bloqueada" width={54} height={54} className={menu.levelLock} />}
                </div>
                <div className={menu.levelInfo}>
                  <h3>{level.title}</h3>
                  <p>{level.unlocked ? `${level.signs.length} señas para consultar` : "Aprobá el examen final del nivel anterior para habilitar esta unidad."}</p>
                </div>
                {level.unlocked ? (
                  <Link href={`/diccionario?unidad=${level.id}`} className={menu.levelArrow} aria-label={`Ver señas de ${level.title}`}>
                    <Image src="/flecha-seccion.webp" alt="" width={87} height={87} />
                  </Link>
                ) : <span className={`${menu.levelArrow} ${menu.disabledArrow}`} aria-hidden="true"><Image src="/flecha-seccion.webp" alt="" width={87} height={87} /></span>}
              </section>
            ))}
          </main>
        )}
      </div>
    </div>
  );
}
