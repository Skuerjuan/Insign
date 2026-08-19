
"use client"

import { useState, type FormEvent } from "react"
import handleVerify from "./actions";

export default function Verify(){

    const [message, setMessage] = useState<string | null>(null)
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setMessage(null)

        const result = await handleVerify(email, code)

        setMessage(result.message)
        if (result.success) {
            setCode("")
        }
    }

    return(
        <div>
            <form onSubmit={onSubmit}>
                <input
                    type="email"
                    name="email"
                    placeholder="ingresar email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="text"
                    inputMode="numeric"
                    name="code"
                    placeholder="ingresar codigo"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                />
                <button type="submit">bege</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    )
}
