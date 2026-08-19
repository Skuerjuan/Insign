"use client"

import { useState, type FormEvent } from "react";
import handleChangePassword from "./actions";
import styles from "../form.module.css";

type ChangePasswordFormProps = {
    userName?: string | null;
}

export default function ChangePasswordForm({ userName }: ChangePasswordFormProps){
    const [message, setMessage] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setMessage(null)
        setIsSuccess(false)

        const result = await handleChangePassword(currentPassword, newPassword)

        setMessage(result.message)
        setIsSuccess(result.success)
        setCurrentPassword("")
        setNewPassword("")
    }

    return(
        <main className={styles.page}>
            <section className={styles.card}>
                <p className={styles.logo}>In<span>Sign</span></p>
                <h1 className={styles.title}>Cambiar contraseña</h1>
                <p className={styles.description}>
                    {userName ? `${userName}, elegí una nueva contraseña para proteger tu cuenta.` : "Elegí una nueva contraseña para proteger tu cuenta."}
                </p>
                <form onSubmit={onSubmit} className={styles.form}>
                    <label className={styles.field}>
                        Contraseña actual
                        <input
                            type="password"
                            name="currentPassword"
                            placeholder="Ingresá tu contraseña actual"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </label>
                    <label className={styles.field}>
                        Nueva contraseña
                        <input
                            type="password"
                            name="newPassword"
                            placeholder="Ingresá tu nueva contraseña"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </label>
                    <button type="submit" className={styles.button}>Guardar contraseña</button>
                </form>
                {message && <p className={`${styles.message} ${isSuccess ? styles.success : ""}`} aria-live="polite">{message}</p>}
            </section>
        </main>
    )
}
