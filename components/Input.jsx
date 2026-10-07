"use client";

import { useState } from "react";
import styles from "./input.module.css";

export default function Input({ placeholder, type, icon, eyeIcon, idInput }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.containerIni}>
      <img src={icon} className={styles.icon} alt="" />

      <input
        type={
          type === "password"
            ? showPassword
              ? "text"
              : "password"
            : type
        }
        placeholder={placeholder}
        className={styles.input}
        id={idInput}
        name={idInput}
        required
      />

      {eyeIcon && (
        <img
          src={eyeIcon}
          className={`${styles.icon} ${styles.eyeIcon}`}
          onClick={() => setShowPassword(!showPassword)}
          alt={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setShowPassword(!showPassword);
            }
          }}
        />
      )}
    </div>
  );
}
