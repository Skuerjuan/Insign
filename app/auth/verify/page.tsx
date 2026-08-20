
"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react"
import handleVerify, { handleResend } from "./actions"
import styles from "../authScreens.module.css"

const CODE_LENGTH = 6

function VerifyForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const registeredEmail = searchParams.get("email") ?? ""
    const [email, setEmail] = useState(registeredEmail)
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""))
    const [message, setMessage] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const inputs = useRef<Array<HTMLInputElement | null>>([])

    const updateDigit = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1)
        const next = [...digits]
        next[index] = digit
        setDigits(next)
        if (digit && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus()
    }

    const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus()
        if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus()
        if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus()
    }

    const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
        event.preventDefault()
        const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH)
        if (!pasted) return
        const next = Array(CODE_LENGTH).fill("")
        pasted.split("").forEach((digit, index) => { next[index] = digit })
        setDigits(next)
        inputs.current[Math.min(pasted.length, CODE_LENGTH) - 1]?.focus()
    }

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setMessage(null)
        setIsSuccess(false)
        const code = digits.join("")
        if (code.length !== CODE_LENGTH) {
            setMessage("Ingresá los 6 números del código.")
            return
        }
        setIsPending(true)
        const result = await handleVerify(email, code)
        setIsPending(false)
        setMessage(result.message)
        setIsSuccess(result.success)
        if (result.success) router.push("/menu")
    }

    const onResend = async () => {
        setMessage(null)
        setIsSuccess(false)
        setIsPending(true)
        const result = await handleResend(email)
        setIsPending(false)
        setMessage(result.message)
        setIsSuccess(result.success)
    }

    return (
        <main className={styles.page}>
            <Link href="/auth/sign-up" className={styles.back} aria-label="Volver al registro">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 12H5m6-7-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <h1 className={styles.heading}>Verificá tu correo</h1>
            <div className={`${styles.layout} ${styles.layoutVerify}`}>
                <section className={`${styles.card} ${styles.verifyCard}`}>
                    <span className={`${styles.iconBadge} ${styles.mailBadge}`} aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M3 6.5 12 13l9-6.5M4 5h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
                        <span className={styles.check}>✓</span>
                    </span>
                    <p className={styles.description}>Te enviamos un código para verificar tu correo electrónico</p>
                    <form onSubmit={onSubmit}>
                        {!registeredEmail && (
                            <input className={styles.fallbackEmail} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Correo electrónico" aria-label="Correo electrónico" required />
                        )}
                        <div className={styles.codeRow} onPaste={onPaste}>
                            {digits.map((digit, index) => (
                                <input key={index} ref={(element) => { inputs.current[index] = element }} className={styles.codeInput} value={digit} onChange={(event) => updateDigit(index, event.target.value)} onKeyDown={(event) => onKeyDown(index, event)} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} aria-label={`Dígito ${index + 1} del código`} maxLength={1} required />
                            ))}
                        </div>
                        <p className={styles.resend}>¿No recibiste el código? <button type="button" onClick={onResend} disabled={isPending}>Reenviar código</button></p>
                        <button type="submit" className={styles.continueButton} disabled={isPending}>{isPending ? "Verificando..." : "Continuar"}</button>
                    </form>
                    {message && <p className={`${styles.message} ${isSuccess ? styles.success : ""}`} aria-live="polite">{message}</p>}
                </section>
                <div className={styles.monkeyWrap}>
                    <Image className={`${styles.monkey} ${styles.verifyMonkey}`} src="/mono-abecedario.png" alt="Mono de InSign" width={373} height={498} priority />
                </div>
            </div>
        </main>
    )
}

export default function Verify() {
    return <Suspense fallback={null}><VerifyForm /></Suspense>
}
