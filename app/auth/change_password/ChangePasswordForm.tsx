"use client"

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import handleChangePassword from "./actions";
import styles from "../authScreens.module.css";

type ChangePasswordFormProps = {
    userName?: string | null;
}

type PasswordFieldProps = {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
}

function PasswordField({ label, name, value, onChange }: PasswordFieldProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <label className={styles.changeField}>
            <span className={styles.authLabel}>{label}</span>
            <span className={styles.passwordField}>
                <input
                    type={isVisible ? "text" : "password"}
                    name={name}
                    placeholder={label}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className={`${styles.authInput} ${styles.changeInput}`}
                    required
                />
                <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setIsVisible((visible) => !visible)}
                    aria-label={isVisible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
                >
                    <Image src="/eye.png" alt="" width={28} height={28} aria-hidden="true" />
                </button>
            </span>
        </label>
    );
}

export default function ChangePasswordForm({ userName }: ChangePasswordFormProps) {
    const [message, setMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPending, setIsPending] = useState(false);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        setIsSuccess(false);

        if (newPassword !== confirmPassword) {
            setMessage("Las contraseñas nuevas no coinciden.");
            return;
        }

        setIsPending(true);
        const result = await handleChangePassword(currentPassword, newPassword);
        setIsPending(false);
        setMessage(result.message);
        setIsSuccess(result.success);

        if (result.success) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
    };

    return (
        <main className={styles.page}>
            <Link href="/configuracion" className={styles.back} aria-label="Volver a configuración">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 12H5m6-7-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </Link>

            <h1 className={styles.heading}>Una nueva <strong>contraseña</strong></h1>

            <div className={`${styles.layout} ${styles.resetLayout}`}>
                <div className={`${styles.monkeyWrap} ${styles.resetMonkeyWrap}`}>
                    <Image
                        className={`${styles.monkey} ${styles.resetMonkey}`}
                        src="/mono-nueva-contrasena.png"
                        alt="Mono de InSign señalando hacia arriba"
                        width={506}
                        height={730}
                        priority
                    />
                </div>

                <section className={`${styles.card} ${styles.resetCard} ${styles.changeCard}`}>
                    <h2 className={styles.title}>¡Ya casi está!</h2>
                    <p className={styles.description}>
                        {userName ? `${userName}, creá tu nueva contraseña para seguir aprendiendo y jugando.` : "Creá tu nueva contraseña para seguir aprendiendo y jugando."}
                    </p>

                    <form onSubmit={onSubmit} className={`${styles.authForm} ${styles.changeForm}`}>
                        <PasswordField label="Contraseña actual" name="currentPassword" value={currentPassword} onChange={setCurrentPassword} />
                        <PasswordField label="Nueva contraseña" name="newPassword" value={newPassword} onChange={setNewPassword} />
                        <PasswordField label="Repetir contraseña" name="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} />

                        <button type="submit" disabled={isPending} className={`${styles.primaryButton} ${styles.resetButton} ${styles.changeButton}`}>
                            {isPending ? "Guardando..." : "Continuar"}
                        </button>
                    </form>

                    {message && (
                        <p className={`${styles.message} ${isSuccess ? styles.success : ""}`} aria-live="polite">
                            {message}
                        </p>
                    )}
                </section>
            </div>
        </main>
    );
}
