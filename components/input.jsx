  "use client";

  import { useState } from "react";

  export default function Input({
    placeholder,
    type,
    icon,
    eyeIcon
  }) {

    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="containerIni">

        <img
          src={icon}
          className="icon"
        />

        <input
          type={
            type === "password"
              ? (showPassword ? "text" : "password")
              : type
          }
          placeholder={placeholder}
          className="input"
        />

        {eyeIcon && (
          <img
            src={eyeIcon}
            className="icon eyeIcon"
            onClick={() => setShowPassword(!showPassword)}
          />
        )}

      </div>
    );
  }