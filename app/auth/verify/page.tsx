
"use client"

import { useState, type FormEvent } from "react"
import handleVerify, { handleResend } from "./actions";
import styles from "../form.module.css";

export default function Verify(){

    const [message, setMessage] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setMessage(null)
        setIsSuccess(false)

        const result = await handleVerify(email, code)

        setMessage(result.message)
        setIsSuccess(result.success)
        if (result.success) {
            setCode("")
        }
    }

    const onResend = async () => {
        setMessage(null)
        setIsSuccess(false)

        const result = await handleResend(email)
        setMessage(result.message)
        setIsSuccess(result.success)
    }

    return(
        <main className={styles.page}>
            <section className={styles.card}>
                <p className={styles.logo}>In<span>Sign</span></p>
                <h1 className={styles.title}>Verificá tu correo</h1>
                <p className={styles.description}>Ingresá el código que enviamos a tu dirección de correo.</p>
                <form onSubmit={onSubmit} className={styles.form}>
                <label className={styles.field}>
                    Correo electrónico
                    <input
                    type="email"
                    name="email"
                    placeholder="nombre@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    required
                />
                </label>
                <label className={styles.field}>
                    Código de verificación
                    <input
                    type="text"
                    inputMode="numeric"
                    name="code"
                    placeholder="Ingresá el código"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={styles.input}
                    required
                />
                </label>
                <button type="submit" className={styles.button}>Verificar correo</button>
                <button type="button" onClick={onResend} className={styles.secondaryButton}>Reenviar código</button>
            </form>
            {message && <p className={`${styles.message} ${isSuccess ? styles.success : ""}`} aria-live="polite">{message}</p>}
            </section>
        </main>
    )
}
