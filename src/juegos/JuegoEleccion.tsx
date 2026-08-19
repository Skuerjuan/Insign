"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { completeGame, type GameOrigin } from "@/lib/server/profile.actions";
import PantallaSinVidas from "./Perder"; // Asegúrate de ajustar esta ruta según la ubicación de tu perder.tsx
import fondoCartas from "./fondo.png";
import fondo from "./fondoP.png";

type GifImport = string | { src: string };
type WebpackRequire = NodeJS.Require & {
  context: (
    path: string,
    useSubdirectories: boolean,
    regExp: RegExp
  ) => {
    keys: () => string[];
    (id: string): { default?: GifImport } | GifImport;
  };
};

const diccionarioGifs: Record<string, GifImport> = {};

try {
  const contextoGifs = (require as WebpackRequire).context("../../public/gifs", false, /\.gif$/);

  contextoGifs.keys().forEach((rutaArchivo: string) => {
    const moduloGif = contextoGifs(rutaArchivo);
    const nombrePalabra = rutaArchivo.replace(/^\.\//, "").replace(/\.gif$/, "");
    const gifImport =
      typeof moduloGif === "object" && "default" in moduloGif && moduloGif.default
        ? moduloGif.default
        : moduloGif;

    if (typeof gifImport === "string" || ("src" in gifImport && typeof gifImport.src === "string")) {
      diccionarioGifs[nombrePalabra] = gifImport;
    }
  });
} catch (e) {
  console.warn("No se pudo cargar la carpeta de gifs automáticamente:", e);
}

const palabrasd = Object.keys(diccionarioGifs);
const FALLBACK_FONT_FAMILY = '"Baloo 2", Arial, sans-serif';

interface JuegoEleccionProps {
  palabras?: string[];
  onRondaGanada?: (actuales: number) => void;
  points?: number;
  origin?: GameOrigin;
}

export default function JuegoEleccion({ palabras, onRondaGanada, points = 0, origin = "menu" }: JuegoEleccionProps) {
  const router = useRouter();
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [perdio, setPerdio] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let resultadoGuardado = false;

    const crearJuego = async () => {
      await document.fonts.ready;

      const balooFromNext = getComputedStyle(document.documentElement)
        .getPropertyValue("--font-baloo")
        .trim();
      const fontFamily = balooFromNext || FALLBACK_FONT_FAMILY;

      try {
        await document.fonts.load(`800 32px ${fontFamily}`);
      } catch {
        await document.fonts.load(`800 32px ${FALLBACK_FONT_FAMILY}`);
      }

      const Phaser = await import("phaser");
      if (!gameRef.current || gameInstanceRef.current) return;
      if (cancelado) return;

      const crearPillBadge = (
        scene: Phaser.Scene,
        x: number,
        y: number,
        textoLabel: string,
        icono: string,
        escalaUi: number,
        isRightAligned: boolean = false
      ) => {
        const container = scene.add.container(x, y);
        const fontSizePx = Math.round(Phaser.Math.Clamp(24 * escalaUi, 18, 30));

        const tempText = scene.add.text(0, 0, `${textoLabel} ${icono}`, {
          fontSize: `${fontSizePx}px`,
          fontFamily,
          fontStyle: "800",
        });

        const textWidth = tempText.width;
        tempText.destroy();

        const paddingX = 22 * escalaUi;
        const width = textWidth + paddingX * 2;
        const height = 48 * escalaUi;
        const radius = height / 2;

        const originX = isRightAligned ? -width : 0;

        const bg = scene.add.graphics();
        bg.fillStyle(0xfbc02d, 1);
        bg.fillRoundedRect(originX, -height / 2, width, height, radius);
        bg.lineStyle(3 * escalaUi, 0xa0a0a0, 0.8);
        bg.strokeRoundedRect(originX, -height / 2, width, height, radius);

        const textX = isRightAligned ? -width / 2 : width / 2;
        const mainText = scene.add
          .text(textX, 0, textoLabel, {
            fontSize: `${fontSizePx}px`,
            fontFamily,
            color: "#05215b",
            fontStyle: "800",
          })
          .setOrigin(0.5);

        const iconText = scene.add
          .text(textX + mainText.width / 2 + 12 * escalaUi, 0, icono, {
            fontSize: `${fontSizePx + 2}px`,
            fontFamily,
            color: "#e53935",
          })
          .setOrigin(0, 0.5);

        mainText.setX(textX - iconText.width / 2);
        iconText.setX(mainText.x + mainText.width / 2 + 6);

        container.add([bg, mainText, iconText]);

        return {
          container,
          actualizar: (nuevoTexto: string) => {
            mainText.setText(nuevoTexto);
            mainText.setX(textX - iconText.width / 2);
            iconText.setX(mainText.x + mainText.width / 2 + 6);
          },
        };
      };

      class EleccionScene extends Phaser.Scene {
        private palabraObjetivo = "";
        private opciones: string[] = [];
        private aciertos = 0;
        private intentosFallidos = 0;
        private bloqueado = false;
        private mazoJuego: string[] = [];
        private palabrasUsadas: string[] = [];
        private escalaUiGlobal = 1;

        private textoPalabra: Phaser.GameObjects.Text | null = null;
        private badgeAciertos: ReturnType<typeof crearPillBadge> | null = null;
        private badgeVidas: ReturnType<typeof crearPillBadge> | null = null;

        constructor() {
          super("EleccionScene");
        }

        init(data: { aciertos?: number; palabrasUsadas?: string[]; intentosFallidos?: number }) {
          this.aciertos = data.aciertos || 0;
          this.palabrasUsadas = data.palabrasUsadas || [];
          this.intentosFallidos = data.intentosFallidos || 0;
          this.bloqueado = false;
        }

        preload() {
          this.load.image("fondoFicha", fondoCartas.src);
          this.load.image("fondoPantalla", fondo.src);
        }

        create() {
          const { width, height } = this.scale;
          const escalaUi = Phaser.Math.Clamp(Math.min(width / 500, height / 360), 0.78, 1.35);
          this.escalaUiGlobal = escalaUi;

          const background = this.add.image(0, 0, "fondoPantalla").setOrigin(0, 0);
          background.setDisplaySize(width, height);

          const mazoBase =
            palabrasd.length >= 4
              ? palabrasd
              : ["Hola", "Chau", "Gracias", "Bien", "Mal", "Por favor", "Mamá", "Ayuda"];
          this.mazoJuego = palabras && palabras.length >= 4 ? palabras : mazoBase;

          this.crearHud(width, height, escalaUi);
          this.generarNuevaRonda(width, height, escalaUi);

          this.scale.on("resize", () => {
            this.scene.restart({ aciertos: this.aciertos, palabrasUsadas: this.palabrasUsadas });
          });
        }

        crearHud(width: number, height: number, escalaUi: number) {
          const azul = 0x1e78ff;
          const amarillo = 0xffd32a;
          const azulTexto = "#05215b";
          const topY = Math.max(34 * escalaUi, height * 0.09);

          const botonVolver = this.add.circle(50 * escalaUi, topY - 3 * escalaUi, 20 * escalaUi, azul);
          botonVolver.setInteractive({ useHandCursor: true });
          botonVolver.on("pointerdown", () => window.history.back());

          const flecha = this.add.graphics();
          flecha.lineStyle(5 * escalaUi, 0xffffff, 1);
          flecha.beginPath();
          flecha.moveTo(52 * escalaUi, topY - 15 * escalaUi);
          flecha.lineTo(38 * escalaUi, topY - 3 * escalaUi);
          flecha.lineTo(52 * escalaUi, topY + 9 * escalaUi);
          flecha.moveTo(39 * escalaUi, topY - 3 * escalaUi);
          flecha.lineTo(66 * escalaUi, topY - 3 * escalaUi);
          flecha.strokePath();

          const titleWidth = Phaser.Math.Clamp(width * 0.28, 260 * escalaUi, 460 * escalaUi);
          const titleBg = this.add.graphics();
          titleBg.fillStyle(azul, 0.98);
          titleBg.fillRoundedRect(width / 2 - titleWidth / 2, 10 * escalaUi, titleWidth, 54 * escalaUi, 12 * escalaUi);

          this.add
            .text(width / 2, 37 * escalaUi, "Elección", {
              fontSize: `${Phaser.Math.Clamp(42 * escalaUi, 30, 52)}px`,
              fontFamily,
              color: "#ffffff",
              stroke: "#d28b00",
              strokeThickness: 5 * escalaUi,
              fontStyle: "800",
            })
            .setOrigin(0.5);

          const puntosTexto = `${points} puntos`;
          const scoreWidth = Phaser.Math.Clamp(118 * escalaUi + puntosTexto.length * 7.5 * escalaUi, 160 * escalaUi, 310 * escalaUi);
          const scoreX = width - scoreWidth - 38 * escalaUi;
          const scoreBg = this.add.graphics();
          scoreBg.fillStyle(0xffe174, 1);
          scoreBg.fillRoundedRect(scoreX, 12 * escalaUi, scoreWidth, 48 * escalaUi, 24 * escalaUi);
          scoreBg.lineStyle(3 * escalaUi, 0xf7b928, 1);
          scoreBg.strokeRoundedRect(scoreX, 12 * escalaUi, scoreWidth, 48 * escalaUi, 24 * escalaUi);
          this.add.star(scoreX + 26 * escalaUi, 36 * escalaUi, 5, 11 * escalaUi, 22 * escalaUi, amarillo);
          this.add
            .text(scoreX + 54 * escalaUi, 36 * escalaUi, puntosTexto, {
              fontSize: `${Phaser.Math.Clamp(20 * escalaUi, 16, 26)}px`,
              fontFamily,
              color: azulTexto,
              fontStyle: "800",
            })
            .setOrigin(0, 0.5);

          this.badgeAciertos = crearPillBadge(
            this,
            40 * escalaUi,
            height - 40 * escalaUi,
            `Aciertos: ${this.aciertos}/5`,
            "⭐",
            escalaUi,
            false
          );

          this.badgeVidas = crearPillBadge(
            this,
            width - 40 * escalaUi,
            height - 40 * escalaUi,
            `Intentos: ${Math.max(0, 3 - this.intentosFallidos)}`,
            "❤️",
            escalaUi,
            true
          );
        }

        generarNuevaRonda(width: number, height: number, escalaUi: number) {
          let palabrasDisponiblesFiltradas = this.mazoJuego.filter(
            (p) => !this.palabrasUsadas.includes(p)
          );

          if (palabrasDisponiblesFiltradas.length === 0) {
            this.palabrasUsadas = [];
            palabrasDisponiblesFiltradas = this.mazoJuego;
          }

          const indexRandom = Phaser.Math.Between(0, palabrasDisponiblesFiltradas.length - 1);
          this.palabraObjetivo = palabrasDisponiblesFiltradas[indexRandom];
          this.palabrasUsadas.push(this.palabraObjetivo);

          const distractores = this.mazoJuego.filter((p) => p !== this.palabraObjetivo);
          const distractoresMezclados = Phaser.Utils.Array.Shuffle([...distractores]).slice(0, 3);
          this.opciones = Phaser.Utils.Array.Shuffle([this.palabraObjetivo, ...distractoresMezclados]);

          const azulTexto = "#05215b";
          this.textoPalabra = this.add
            .text(width / 2, 88 * escalaUi, `¿Qué seña es ${this.palabraObjetivo.toUpperCase()}?`, {
              fontSize: `${Phaser.Math.Clamp(26 * escalaUi, 20, 36)}px`,
              fontFamily,
              color: azulTexto,
              fontStyle: "800",
            })
            .setOrigin(0.5)
            .setDepth(10);
          this.textoPalabra.setStroke("#ffffff", 6 * escalaUi);

          this.dibujarGrillaOpciones(width, height, escalaUi);
        }

        dibujarGrillaOpciones(width: number, height: number, escalaUi: number) {
          const cardWidth = Math.round(Phaser.Math.Clamp(width * 0.36, 160 * escalaUi, 230 * escalaUi));
          const cardHeight = Math.round(cardWidth * 0.70);

          const gapX = cardWidth + 20 * escalaUi;
          const gapY = cardHeight + 14 * escalaUi;

          const centroX = width / 2;
          const centroY = height * 0.58;

          const posiciones = [
            { x: centroX - gapX / 2, y: centroY - gapY / 2 },
            { x: centroX + gapX / 2, y: centroY - gapY / 2 },
            { x: centroX - gapX / 2, y: centroY + gapY / 2 },
            { x: centroX + gapX / 2, y: centroY + gapY / 2 },
          ];

          this.opciones.forEach((palabraOpcion, index) => {
            const pos = posiciones[index];

            const ficha = this.add.container(pos.x, pos.y);
            ficha.setSize(cardWidth, cardHeight);
            ficha.setInteractive({ useHandCursor: true });

            const elementoImg = document.createElement("img");
            elementoImg.style.width = `${cardWidth}px`;
            elementoImg.style.height = `${cardHeight}px`;
            elementoImg.style.objectFit = "cover";
            elementoImg.style.borderRadius = `${Math.round(14 * escalaUi)}px`;
            elementoImg.style.pointerEvents = "none";

            const archivoImportado = diccionarioGifs[palabraOpcion];
            if (archivoImportado) {
              const src = typeof archivoImportado === "string" ? archivoImportado : archivoImportado.src;
              elementoImg.src = `${src}?v=${Date.now()}-${Math.random()}`;
            }

            const domGif = this.add.dom(0, 0, elementoImg);

            const cardBg = this.add.graphics();
            cardBg.lineStyle(4 * escalaUi, 0x1e78ff, 1);
            cardBg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14 * escalaUi);

            ficha.add([domGif, cardBg]);

            ficha.setData("valor", palabraOpcion);
            ficha.setData("graphics", cardBg);
            ficha.setData("cardWidth", cardWidth);
            ficha.setData("cardHeight", cardHeight);

            ficha.on("pointerdown", () => this.validarRespuesta(ficha, cardBg, cardWidth, cardHeight, escalaUi));
          });
        }

        lanzarConfeti(origenX: number, origenY: number, escalaUi: number) {
          const colores = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502, 0xeccc68, 0xff6b81, 0x9b59b6, 0x00d2d3];

          for (let i = 0; i < 80; i++) {
            const color = Phaser.Utils.Array.GetRandom(colores);
            const ancho = Phaser.Math.Between(6 * escalaUi, 12 * escalaUi);
            const alto = Phaser.Math.Between(8 * escalaUi, 16 * escalaUi);

            const papelito = this.add.rectangle(origenX, origenY, ancho, alto, color).setDepth(20);
            papelito.setAngle(Phaser.Math.Between(0, 360));

            const angulo = Phaser.Math.FloatBetween(-Math.PI * 1.1, 0.1);
            const velocidad = Phaser.Math.Between(200 * escalaUi, 500 * escalaUi);
            const targetX = origenX + Math.cos(angulo) * velocidad + Phaser.Math.Between(-60, 60);
            const targetY = origenY + Math.sin(angulo) * velocidad + Phaser.Math.Between(100, 250);

            this.tweens.add({
              targets: papelito,
              x: targetX,
              y: targetY,
              angle: papelito.angle + Phaser.Math.Between(720, 1440),
              scaleX: { from: 1, to: Phaser.Math.FloatBetween(0.2, 0.8) },
              alpha: { from: 1, to: 0 },
              duration: Phaser.Math.Between(1300, 2000),
              ease: "Cubic.easeOut",
              onComplete: () => papelito.destroy(),
            });
          }
        }

        validarRespuesta(
          ficha: Phaser.GameObjects.Container,
          cardBg: Phaser.GameObjects.Graphics,
          w: number,
          h: number,
          escalaUi: number
        ) {
          if (this.bloqueado) return;
          this.bloqueado = true;

          const respuestaSeleccionada = ficha.getData("valor");

          if (respuestaSeleccionada === this.palabraObjetivo) {
            cardBg.clear();
            cardBg.lineStyle(6 * escalaUi, 0x2ed573, 1);
            cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14 * escalaUi);

            this.aciertos++;
            this.lanzarConfeti(ficha.x, ficha.y, this.escalaUiGlobal);

            if (this.badgeAciertos) {
              this.badgeAciertos.actualizar(`Aciertos: ${this.aciertos}/5`);
            }

            if (typeof onRondaGanada === "function") {
              onRondaGanada(this.aciertos);
            }

            this.time.delayedCall(1500, () => {
              if (this.aciertos >= 5) {
                this.scene.start("PantallaFin", { errores: this.intentosFallidos });
              } else {
                this.scene.restart({
                  aciertos: this.aciertos,
                  palabrasUsadas: this.palabrasUsadas,
                  intentosFallidos: this.intentosFallidos,
                });
              }
            });
          } else {
            cardBg.clear();
            cardBg.lineStyle(6 * escalaUi, 0xff4757, 1);
            cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14 * escalaUi);

            this.intentosFallidos++;

            if (this.badgeVidas) {
              this.badgeVidas.actualizar(`Intentos: ${Math.max(0, 3 - this.intentosFallidos)}`);
            }

            this.tweens.add({
              targets: ficha,
              x: ficha.x + 8,
              duration: 50,
              yoyo: true,
              repeat: 2,
              onComplete: () => {
                cardBg.clear();
                cardBg.lineStyle(4 * escalaUi, 0x1e78ff, 1);
                cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14 * escalaUi);

                if (this.intentosFallidos >= 3) {
                  this.time.delayedCall(500, () => {
                    // Notifica a React para mostrar la PantallaSinVidas (perder.tsx)
                    if (this.game.events) {
                      this.game.events.emit("jugador-perdio");
                    }
                  });
                } else {
                  this.bloqueado = false;
                }
              },
            });
          }
        }
      }

      class PantallaFin extends Phaser.Scene {
        private errores = 0;

        constructor() {
          super("PantallaFin");
        }

        init(data: { errores?: number }) {
          this.errores = data.errores || 0;
        }

        create() {
          const { width, height } = this.scale;
          const escalaUi = Phaser.Math.Clamp(Math.min(width / 500, height / 360), 0.68, 1.25);

          this.add.image(0, 0, "fondoPantalla").setOrigin(0, 0).setDisplaySize(width, height);

          const panelWidth = Phaser.Math.Clamp(width * 0.68, 240 * escalaUi, 380 * escalaUi);
          const panelHeight = 150 * escalaUi;
          const panelX = width / 2 - panelWidth / 2;
          const panelY = height / 2 - panelHeight / 2;

          const panel = this.add.graphics();
          panel.fillStyle(0xffd32a, 1);
          panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 18 * escalaUi);
          panel.lineStyle(5 * escalaUi, 0x06398a, 1);
          panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 18 * escalaUi);

          const resultadoTexto = this.add
            .text(width / 2, height / 2 - 28 * escalaUi, "¡Excelente trabajo!\nGuardando tus puntos...", {
              fontSize: `${24 * escalaUi}px`,
              fontFamily,
              color: "#003895",
              align: "center",
              fontStyle: "bold",
            })
            .setOrigin(0.5);

          const botonFinal = this.add
            .text(width / 2, height / 2 + 42 * escalaUi, "Guardando...", {
              fontSize: `${20 * escalaUi}px`,
              fontFamily,
              color: "#ffffff",
              backgroundColor: "#7f8c8d",
              padding: { x: 22, y: 8 },
            })
            .setOrigin(0.5);

          const guardarResultado = () => {
            resultadoGuardado = true;
            completeGame("eleccion", this.errores, origin)
              .then((resultado) => {
                resultadoTexto.setText(
                  `¡Partida terminada!\nGanaste ${resultado.pointsAwarded} puntos.`
                );
                // Botón para volver al menú principal
                botonFinal
                  .setText("Volver al Menú")
                  .setBackgroundColor("#2ed573");
                botonFinal.setInteractive({ useHandCursor: true });
                botonFinal.once("pointerdown", () => {
                  router.push("/");
                });
              })
              .catch(() => {
                resultadoGuardado = false;
                resultadoTexto.setText("No pudimos guardar el resultado.\nInténtalo nuevamente.");
                botonFinal.setText("Reintentar").setBackgroundColor("#e67e22");
                botonFinal.setInteractive({ useHandCursor: true });
                botonFinal.once("pointerdown", () => {
                  botonFinal.disableInteractive().setText("Guardando...").setBackgroundColor("#7f8c8d");
                  guardarResultado();
                });
              });
          };

          if (!resultadoGuardado) guardarResultado();
        }
      }

      const config: ConstructorParameters<typeof Phaser.Game>[0] = {
        type: Phaser.AUTO,
        dom: {
          createContainer: true,
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          parent: gameRef.current!,
          width: "100%",
          height: "100%",
        },
        backgroundColor: "#87CEEB",
        scene: [EleccionScene, PantallaFin],
      };

      const game = new Phaser.Game(config);
      gameInstanceRef.current = game;

      // Escuchar cuando el usuario pierde todas las vidas
      game.events.on("jugador-perdio", () => {
        setPerdio(true);
      });
    };

    crearJuego();

    return () => {
      cancelado = true;
      const game = gameInstanceRef.current;
      if (game) {
        game.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, [palabras, onRondaGanada, points, origin, router]);

  return (
    <div className="relative w-full h-full">
      <div ref={gameRef} style={{ width: "100%", height: "100%" }} />

        {perdio && (
    <PantallaSinVidas
      rutaEntrenamiento="/entrenamiento"
      rutaInicio="/menu"
      onVolverInicio={() => router.push("/menu")}
      onIrEntrenamiento={() => router.push("/entrenamiento")}
    />
  )}
    </div>
  );
}