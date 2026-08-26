
"use client"

import { AuthUIProvider, ForgotPasswordForm } from "@neondatabase/auth/react/ui";
import "@neondatabase/auth/ui/css";
import { authClient } from "@/lib/auth/client";
import Image from "next/image";
import Link from "next/link";
import styles from "../authScreens.module.css";

export default function ForgotPassword(){
    return (
        <main className={styles.page}>
            <Link href="/auth/sign-in" className={styles.back} aria-label="Volver a iniciar sesión">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 12H5m6-7-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <h1 className={styles.heading}>¿Olvidaste tu <strong>contraseña?</strong></h1>
            <div className={`${styles.layout} ${styles.forgotLayout}`}>
                <div className={`${styles.monkeyWrap} ${styles.forgotMonkeyWrap}`}>
                    <Image
                        className={`${styles.monkey} ${styles.forgotMonkey}`}
                        src="/mono-olvidaste-contrasena.png"
                        alt="Mono de InSign con las manos en la cintura"
                        width={506}
                        height={768}
                        priority
                    />
                </div>
                <section className={`${styles.card} ${styles.forgotCard}`}>
                <span className={`${styles.iconBadge} ${styles.forgotBadge}`} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2.5"/><path d="M12 14v3" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                <p className={`${styles.description} ${styles.forgotDescription}`}>No te preocupes, escribí tu correo de tu cuenta y te ayudaremos a recuperarla.</p>
                <AuthUIProvider
                    authClient={authClient as never}
                    redirectTo="/auth/reset-password"
                >
                    <ForgotPasswordForm
                        className={`${styles.authForm} ${styles.forgotForm}`}
                        classNames={{
                            label: styles.authLabel,
                            input: `${styles.authInput} ${styles.emailInput}`,
                            error: styles.authError,
                            button: styles.primaryButton,
                            primaryButton: styles.primaryButton,
                        }}
                        localization={{
                            EMAIL: "Correo electrónico",
                            EMAIL_PLACEHOLDER: "Correo electrónico",
                            FORGOT_PASSWORD_ACTION: "Enviar código",
                        }}
                    />
                </AuthUIProvider>
            </section>
            </div>
        </main>
    )
}
