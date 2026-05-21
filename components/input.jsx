"use client";

import { useState } from "react";
import styles from "./input.module.css";

export default function Input({ placeholder, type, icon, eyeIcon }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.containerIni}>
      <img src={icon} className={styles.icon} />

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
      />

      {eyeIcon && (
        <img
          src={eyeIcon}
          className={`${styles.icon} ${styles.eyeIcon}`}
          onClick={() => setShowPassword(!showPassword)}
        />
      )}
    </div>
  );
}