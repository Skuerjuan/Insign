import styles from "./style.module.css";
import Link from "next/link";
import EditButton from "@/components/EditButton";
import Foto from "@/components/Foto";
import { getProfile, getSession } from "../../lib/server/profile.actions";
import { getWeeklyActivity } from "../../lib/server/streak";

export const dynamic = "force-dynamic";

export default async function Perfil() {
  const user = await getSession();
  const { puntos, premios, racha, ultimo_dia_activo } = await getProfile(user.id);
  const weeklyActivity = getWeeklyActivity(racha, ultimo_dia_activo);
  const rachaActual = weeklyActivity.count;
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  
  return (
    <div className={styles.fondo}>
      <aside className={styles.aside}>
        <h1 className={styles.logo}>
          <span className={styles.blanco}>In</span>
          <span className={styles.amarillo}>Sign</span>
        </h1>

        <Link href="/menu" className={styles.inicio}>
          <img src="/casablanco.png" alt="" className={styles.casa} />
          Inicio
        </Link>
        <Link href="/entrenamiento" className={styles.train}>
          <img src="/pesa.png" alt="" className={styles.pesa} />
          Entrenamiento
        </Link>
        <Link href="/progreso" className={styles.progreso}>
          <img src="/premio.png" alt="" className={styles.premio} />
          Progreso
        </Link>
        <Link href="/perfil" className={styles.usuario}>
          <img src="/userwhite.png" alt="" className={styles.userwhite} />
          Perfil
        </Link>
        <Link href="/configuracion" className={styles.source}>
          <img src="/ajustes.png" alt="" className={styles.ajustes} />
          Configuracion
        </Link>
      </aside>

      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.profileTitle}>
            <div className={styles.profileTitleIcon}>
              <img src="/user.png" alt="" />
            </div>
            <h2>Perfil</h2>
          </div>

          <div className={styles.profilePhotoSmall}>
            <Foto user={user} />
          </div>
        </header>

        <main className={styles.profileMain}>
          <section className={styles.userCard}>
            <EditButton
              className={styles.editButton}
              user={{ name: user.name, image: user.image }}
            />

            <div className={styles.userAvatar}>
              <Foto user={user} />
            </div>

            <div className={styles.userInfo}>
              <h1>{user.name}</h1>
              <p>Nivel 5</p>
            </div>

            <div className={styles.profileStats}>
              <div className={styles.profileStat}>
                <img src="/Star.png" alt="" />
                <strong>{puntos ?? 0}</strong>
                <span>Puntos</span>
              </div>
              <div className={styles.profileStatDivider} />
              <div className={styles.profileStat}>
                <img src="/Fire.png" alt="" />
                <strong>{rachaActual}</strong>
                <span>Racha</span>
              </div>
              <div className={styles.profileStatDivider} />
              <div className={styles.profileStat}>
                <img src="/cupdorada.png" alt="" />
                <strong>{premios ?? 0}</strong>
                <span>Premios</span>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <details className={styles.achievementsDetails}>
              <summary className={styles.panelHeader}>
                <h2>Mis logros</h2>
                <span>Ver todos</span>
              </summary>
            </details>
          </section>

          <section className={styles.panelSmall}>
            <h2>Racha de días</h2>
            <div className={styles.weekGrid}>
              {weekDays.map((day, index) => {
                const played = weeklyActivity.days[index];

                return (
                  <div className={styles.weekDay} key={day}>
                    <img
                      src={played ? "/tick-racha-dia.png" : "/circulo-dia-sin-racha.png"}
                      alt={played ? `${day}: día jugado` : `${day}: día sin jugar`}
                    />
                    <span>{day}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
