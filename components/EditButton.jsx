"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import obtenerFoto from "./foto.util";
import modalStyles from "./EditButton.module.css";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const AVATAR_SIZE = 512;

function leerArchivo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

function optimizarFoto(file) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const lado = Math.min(image.naturalWidth, image.naturalHeight);
      const origenX = (image.naturalWidth - lado) / 2;
      const origenY = (image.naturalHeight - lado) / 2;

      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      context.drawImage(
        image,
        origenX,
        origenY,
        lado,
        lado,
        0,
        0,
        AVATAR_SIZE,
        AVATAR_SIZE,
      );

      URL.revokeObjectURL(imageUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("La imagen seleccionada no es válida."));
    };

    image.src = imageUrl;
  });
}

export default function EditButton({ className, user }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState(user.name ?? "");
  const [archivo, setArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(obtenerFoto(user.image));
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return undefined;

    const cerrarConEscape = (event) => {
      if (event.key === "Escape" && !guardando) setAbierto(false);
    };

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [abierto, guardando]);

  function abrirModal() {
    setNombre(user.name ?? "");
    setArchivo(null);
    setVistaPrevia(obtenerFoto(user.image));
    setError("");
    setAbierto(true);
  }

  function cerrarModal() {
    if (!guardando) setAbierto(false);
  }

  async function seleccionarFoto(event) {
    const foto = event.target.files?.[0];
    setError("");

    if (!foto) return;
    if (!foto.type.startsWith("image/")) {
      setError("Elegí un archivo de imagen válido.");
      event.target.value = "";
      return;
    }
    if (foto.size > MAX_FILE_SIZE) {
      setError("La imagen debe pesar menos de 8 MB.");
      event.target.value = "";
      return;
    }

    try {
      setArchivo(foto);
      setVistaPrevia(await leerArchivo(foto));
    } catch (readError) {
      setError(readError.message);
    }
  }

  async function guardarPerfil(event) {
    event.preventDefault();
    const nombreLimpio = nombre.trim();

    if (nombreLimpio.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const image = archivo ? await optimizarFoto(archivo) : user.image;
      const { error: updateError } = await authClient.updateUser({
        name: nombreLimpio,
        image,
      });

      if (updateError) throw new Error(updateError.message || "No se pudo guardar el perfil.");

      setAbierto(false);
      router.refresh();
    } catch (updateError) {
      setError(updateError.message || "No se pudo guardar el perfil. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <button className={className} type="button" aria-label="Editar perfil" onClick={abrirModal}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 16.5V20h3.5L18.8 8.7l-3.5-3.5L4 16.5Zm17.5-10.4a.94.94 0 0 0 0-1.3l-2.3-2.3a.94.94 0 0 0-1.3 0l-1.8 1.8 3.5 3.5 1.9-1.7Z" />
        </svg>
      </button>

      {abierto && (
        <div className={modalStyles.overlay} role="presentation" onMouseDown={cerrarModal}>
          <section
            className={modalStyles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="editar-perfil-titulo"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className={modalStyles.closeButton}
              type="button"
              aria-label="Cerrar"
              onClick={cerrarModal}
              disabled={guardando}
            >
              ×
            </button>

            <div className={modalStyles.heading}>
              <span>Tu perfil</span>
              <h2 id="editar-perfil-titulo">Editar perfil</h2>
              <p>Cambiá tu nombre o elegí una nueva foto.</p>
            </div>

            <form className={modalStyles.form} onSubmit={guardarPerfil}>
              <div className={modalStyles.photoEditor}>
                <div className={modalStyles.preview}>
                  <img src={vistaPrevia} alt="Vista previa de la foto de perfil" />
                </div>
                <div>
                  <input
                    ref={inputRef}
                    className={modalStyles.fileInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={seleccionarFoto}
                  />
                  <button
                    className={modalStyles.chooseButton}
                    type="button"
                    onClick={() => inputRef.current?.click()}
                  >
                    Elegir foto
                  </button>
                  <small>PNG, JPG o WEBP · Máximo 8 MB</small>
                </div>
              </div>

              <label className={modalStyles.label} htmlFor="nombre-perfil">
                Nombre del usuario
                <input
                  id="nombre-perfil"
                  type="text"
                  value={nombre}
                  maxLength={40}
                  autoFocus
                  onChange={(event) => setNombre(event.target.value)}
                  disabled={guardando}
                />
              </label>

              {error && <p className={modalStyles.error} role="alert">{error}</p>}

              <div className={modalStyles.actions}>
                <button type="button" onClick={cerrarModal} disabled={guardando}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}>
                  {guardando ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
