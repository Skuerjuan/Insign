"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { startExam, finishExamRound } from "@/lib/server/exam.actions";
import { EXAM_GAMES, type ExamRound } from "@/lib/exam";
import { LEVELS, getLevelWords } from "@/src/diccionario/diccionario";
import JuegoEleccion from "@/src/juegos/JuegoEleccion";
import JuegoCompletar from "@/src/juegos/JuegoCompletar";
import JuegoAdivinar from "@/src/juegos/JuegoAdivinar";
import styles from "./FinalExam.module.css";

type Attempt = { id: string; plan: ExamRound[] };
type Screen = "intro" | "playing" | "saving" | "failed" | "passed" | "error";
const components = { eleccion: JuegoEleccion, completar: JuegoCompletar, adivinar: JuegoAdivinar };

export default function FinalExam({ level, title, points }: { level: number; title: string; points: number }) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [round, setRound] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const recordCorrect = useCallback((count: number) => setRoundCorrect(count), []);
  const [screen, setScreen] = useState<Screen>("intro");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef<number | null>(null);
  const inFlight = useRef(false);
  const begin = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const next = await startExam(level);
      setAttempt(next); setRound(0); setRoundCorrect(0); pending.current = null; setScreen("playing");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos iniciar el examen.");
    } finally { inFlight.current = false; setBusy(false); }
  };
  const submit = useCallback(async (mistakes: number) => {
    if (!attempt || inFlight.current) return;
    inFlight.current = true;
    pending.current = mistakes;
    setScreen("saving");
    try {
      const result = await finishExamRound(attempt.id, round, mistakes);
      pending.current = null;
      setRound(result.round);
      setRoundCorrect(0);
      setScreen(result.failed ? "failed" : result.passed ? "passed" : "playing");
    } catch {
      setMessage("No pudimos guardar el resultado. Reintentá para continuar.");
      setScreen("error");
    } finally { inFlight.current = false; }
  }, [attempt, round]);

  // Fast Refresh puede conservar en memoria un intento del examen anterior.
  const outdated = attempt?.plan.some((item) => !EXAM_GAMES.includes(item.game));
  const visibleScreen = outdated ? "intro" : screen;
  const current = outdated ? undefined : attempt?.plan[round];
  const done = (attempt?.plan.slice(0, round).reduce((total, item) => total + item.words.length, 0) ?? 0) + roundCorrect;
  const total = getLevelWords(level).length;
  const Game = current ? components[current.game] : null;
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href={`/nivel/${level}`}>← Volver al nivel</Link>
        <div><h1>Examen final</h1><p>{title}</p></div>
        <div className={styles.examStatus}>
          {attempt && !outdated && <span className={styles.signCount} aria-live="polite">Señas completadas: {Math.min(done, total)}/{total}</span>}
          <strong>Sin errores</strong>
        </div>
      </header>
      {visibleScreen === "playing" && Game && current ? (
        <div className={styles.game}><Game key={`${attempt!.id}:${round}`} level={level} palabras={current.words} points={points} origin="exam" onExamResult={submit} onRondaGanada={recordCorrect} /></div>
      ) : <section className={styles.panel} aria-live="polite">
        {visibleScreen === "intro" && <>
          <h2>¿Listo para el desafío final?</h2>
          <p>Jugá Elección, Completar y Múltiple elección. Evaluaremos las {total} señas del nivel; algunos juegos se repetirán para incluirlas todas.</p>
          <p>Un solo error reinicia el examen completo. El siguiente nivel se habilita cuando aprobás todas las señas sin equivocarte.</p>
          <button onClick={begin} disabled={busy}>{busy ? "Preparando…" : "Comenzar examen"}</button>
          {message && <p role="alert">{message}</p>}
        </>}
        {visibleScreen === "saving" && <><h2>Guardando resultado…</h2><p>Esperá un momento para continuar.</p></>}
        {visibleScreen === "failed" && <>
          <h2>Hubo un error. ¡Volvé a intentarlo!</h2>
          <p>Para aprobar necesitás completar todo el examen sin errores. El próximo intento empieza desde la primera seña.</p>
          <button onClick={begin} disabled={busy}>{busy ? "Preparando…" : "Reiniciar examen completo"}</button>
          {message && <p role="alert">{message}</p>}
        </>}
        {visibleScreen === "error" && <><h2>No se guardó el resultado</h2><p>{message}</p><button onClick={() => void submit(pending.current ?? 1)}>Reintentar guardado</button></>}
        {visibleScreen === "passed" && <>
          <h2>¡Examen aprobado!</h2><p>Completaste las {total} señas y los tres juegos sin errores.</p>
          {level < LEVELS.length ? <Link className={styles.action} href={`/nivel/${level + 1}`}>Ir al siguiente nivel →</Link> : <Link className={styles.action} href="/menu">¡Completaste todos los niveles!</Link>}
        </>}
      </section>}
    </main>
  );
}
