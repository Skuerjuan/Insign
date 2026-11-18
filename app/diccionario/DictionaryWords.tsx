"use client";

import { useRef, useState } from "react";
import styles from "./styles.module.css";

type Sign = { word: string; label: string; video: string };
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

export default function DictionaryWords({ signs }: { signs: Sign[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Sign | null>(null);
  const [videoError, setVideoError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const matches = signs.filter((sign) => normalize(sign.label).includes(normalize(query.trim())));

  function open(sign: Sign) {
    setSelected(sign);
    setVideoError(false);
    dialog.current?.showModal();
  }

  return (
    <>
      <label htmlFor="dictionary-search" className={styles.searchLabel}>Buscar una seña</label>
      <input id="dictionary-search" type="search" className={styles.search} placeholder="Por ejemplo: Bien" value={query} onChange={(event) => setQuery(event.target.value)} />
      <p className={styles.resultCount} role="status">{matches.length} {matches.length === 1 ? "seña" : "señas"}</p>
      {matches.length > 0 ? (
        <div className={styles.wordGrid}>
          {matches.map((sign) => (
            <button type="button" className={styles.word} key={sign.word} onClick={() => open(sign)} aria-label={`Ver seña: ${sign.label}`} aria-haspopup="dialog">
              <span>{sign.label}</span><span className={styles.play} aria-hidden="true">▶</span>
            </button>
          ))}
        </div>
      ) : <p className={styles.notice}>{signs.length ? "No encontramos esa seña en esta unidad. Probá con otra palabra." : "Todavía no hay señas disponibles en esta unidad."}</p>}
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="sign-title" onClose={() => setSelected(null)} onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }}>
        {selected && (
          <div className={styles.player}>
            <div className={styles.playerHeader}>
              <h2 id="sign-title">{selected.label}</h2>
              <button type="button" autoFocus className={styles.close} onClick={() => dialog.current?.close()} aria-label="Cerrar video">✕</button>
            </div>
            <video key={selected.video} src={selected.video} controls autoPlay loop playsInline preload="metadata" aria-label={`Seña en LSA: ${selected.label}`} onError={() => setVideoError(true)} />
            {videoError && <p role="alert">No pudimos cargar el video. Cerralo y volvé a abrirlo para intentar de nuevo.</p>}
          </div>
        )}
      </dialog>
    </>
  );
}
