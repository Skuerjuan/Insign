import Link from "next/link";

export default function JuegoPalabra() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        textAlign: "center",
        background: "url('/FondoInicioSesion.png') center / cover no-repeat",
        fontFamily: "var(--font-baloo)",
      }}
    >
      <section
        style={{
          width: "min(520px, 100%)",
          padding: "40px 28px",
          border: "4px solid #06398a",
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.94)",
          color: "#003895",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "clamp(36px, 8vw, 58px)" }}>Juego de palabras</h1>
        <p style={{ margin: "16px 0 28px", fontSize: "clamp(20px, 4vw, 28px)" }}>
          Este nivel estará disponible próximamente.
        </p>
        <Link
          href="/menu"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            borderRadius: "12px",
            background: "#0042ad",
            color: "white",
            fontSize: "22px",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Volver al menú
        </Link>
      </section>
    </main>
  );
}
