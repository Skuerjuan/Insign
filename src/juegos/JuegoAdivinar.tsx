"use client";

import { useState, useEffect, useRef } from "react";
import { getGameFrame, getMultipleChoiceLayout } from "@/lib/client/game-layout";
import { drawGameHeader } from "@/lib/client/game-header";
import { useGameWords } from "@/lib/client/use-game-words";
import { createSignRecorder } from "@/lib/client/learned-signs";
import { useRouter } from "next/navigation";
import { completeGame, type GameOrigin } from "@/lib/server/profile.actions";
import { getLevelWords, getPalabrasPorCategoria, getVideoPath } from "@/src/diccionario/diccionario";
import PantallaSinVidas from "./Perder";
import fondoCartas from "./fondo-mangos.webp";
import fondo from "./fondoP.webp";
import { getTextoSena, getGrupoSena } from "@/src/diccionario/textos";

const FALLBACK_FONT_FAMILY = '"Baloo 2", Arial, sans-serif';

interface JuegoAdivinarProps {
  nivel?: string;
  palabras?: string[];
  onRondaGanada?: (actuales: number) => void;
  userName?: string;
  points?: number;
  origin?: GameOrigin;
  level?: number;
  onExamResult?: (mistakes: number) => Promise<void>;
}

export default function JuegoAdivinar({
  nivel = "presentacion-1",
  palabras: palabrasProp,
  onRondaGanada,
  userName = "user",
  points = 0,
  origin = "menu",
  level,
  onExamResult,
}: JuegoAdivinarProps) {
  const router = useRouter();
  const palabras = useGameWords(palabrasProp);
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [perdio, setPerdio] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let resultadoGuardado = false;
    const targetCount = onExamResult ? palabras?.length ?? 5 : 5;
    // El examen guarda las señas al aprobar, sin refrescar rutas mientras se juega.
    const signRecorder = createSignRecorder(origin !== "exam");

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
      const fondoPantallaSrc =
        document.documentElement.dataset.theme === "dark" ? "/fondo-modo-oscuro.webp" : fondo.src;

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
        const fontSizePx = Math.max(10, Math.round(22 * escalaUi));

        const tempText = scene.add.text(0, 0, `${textoLabel} ${icono}`, {
          fontSize: `${fontSizePx}px`,
          fontFamily,
          fontStyle: "800",
        });

        const textWidth = tempText.width;
        tempText.destroy();

        const paddingX = 18 * escalaUi;
        const width = textWidth + paddingX * 2;
        const height = 45 * escalaUi;
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
          .text(textX + mainText.width / 2 + 10 * escalaUi, 0, icono, {
            fontSize: `${fontSizePx + 2}px`,
            fontFamily,
            color: "#e53935",
          })
          .setOrigin(0, 0.5);

        mainText.setX(textX - iconText.width / 2);
        iconText.setX(mainText.x + mainText.width / 2 + 4);

        container.add([bg, mainText, iconText]);

        return {
          container,
          actualizar: (nuevoTexto: string) => {
            mainText.setText(nuevoTexto);
            mainText.setX(textX - iconText.width / 2);
            iconText.setX(mainText.x + mainText.width / 2 + 4);
          },
        };
      };

      class AdivinarScene extends Phaser.Scene {
        private palabraObjetivo = "";
        private opciones: string[] = [];
        private aciertos = 0;
        private intentosFallidos = 0;
        private bloqueado = false;
        private mazoJuego: string[] = [];
        private palabrasUsadas: string[] = [];

        private badgeAciertos: ReturnType<typeof crearPillBadge> | null = null;
        private badgeVidas: ReturnType<typeof crearPillBadge> | null = null;

        constructor() {
          super("AdivinarScene");
        }

        init(data: { aciertos?: number; palabrasUsadas?: string[]; intentosFallidos?: number }) {
          this.aciertos = data.aciertos || 0;
          this.palabrasUsadas = data.palabrasUsadas || [];
          this.intentosFallidos = data.intentosFallidos || 0;
          this.bloqueado = false;
        }

        preload() {
          this.load.image("fondoFicha", fondoCartas.src);
          this.load.image("fondoPantalla", fondoPantallaSrc);
        }

        create() {
          const { width, height } = this.scale;
          const escalaUi = getGameFrame(width, height).scale;

          const background = this.add.image(0, 0, "fondoPantalla").setOrigin(0, 0);
          background.setDisplaySize(width, height);

          const mazoObtenido = palabras && palabras.length > 0 ? palabras : getPalabrasPorCategoria(nivel);
          this.mazoJuego = mazoObtenido;

          this.crearHud(width, height, escalaUi);
          this.generarNuevaRonda(width, height, escalaUi);

          const onResize = () => {
            this.scene.restart({
              aciertos: this.aciertos,
              palabrasUsadas: this.palabrasUsadas,
              intentosFallidos: this.intentosFallidos,
            });
          };
          // FIT ajusta el examen sin recrear videos, opciones ni letras ingresadas.
          if (!onExamResult) {
            this.scale.on("resize", onResize);
            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
              this.scale.off("resize", onResize);
            });
          }
        }

        crearHud(width: number, height: number, escalaUi: number) {
          const frame = getGameFrame(width, height);
          drawGameHeader(this, width, height, "Múltiple elección", points, fontFamily);
          this.badgeAciertos = crearPillBadge(this, frame.margin, frame.footerY,
            `Aciertos: ${this.aciertos}/${targetCount}`, "⭐", escalaUi, false);
          this.badgeVidas = crearPillBadge(this, width - frame.margin, frame.footerY,
            `Intentos: ${Math.max(0, (onExamResult ? 1 : 3) - this.intentosFallidos)}`, "❤️", escalaUi, true);
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

          const distractores = (onExamResult && level ? getLevelWords(level) : this.mazoJuego).filter((p) => getGrupoSena(p) !== getGrupoSena(this.palabraObjetivo));
          const distractoresMezclados = Phaser.Utils.Array.Shuffle([...distractores]).slice(0, 5);

          this.opciones = Phaser.Utils.Array.Shuffle([this.palabraObjetivo, ...distractoresMezclados]);

          this.dibujarPanelVideoPrincipal(width, height);
          this.dibujarBotoneraColumnas(width, height, escalaUi);
        }

        dibujarPanelVideoPrincipal(width: number, height: number) {
          const layout = getMultipleChoiceLayout(width, height, this.opciones.length);
          const panelWidth = layout.video.width;
          const panelHeight = layout.video.height;
          const centroX = layout.video.x + panelWidth / 2;
          const centroY = layout.video.y + panelHeight / 2;

          const elementoVideo = document.createElement("video");
          elementoVideo.style.width = `${Math.round(panelWidth)}px`;
          elementoVideo.style.height = `${Math.round(panelHeight)}px`;
          elementoVideo.style.objectFit = "cover";
          elementoVideo.style.objectPosition = "center";
          elementoVideo.style.borderRadius = "14px";
          elementoVideo.style.pointerEvents = "none";

          elementoVideo.autoplay = true;
          elementoVideo.loop = true;
          elementoVideo.muted = true;
          elementoVideo.playsInline = true;

          elementoVideo.src = getVideoPath(level ?? nivel, this.palabraObjetivo) ?? "";

          this.add.dom(centroX, centroY, elementoVideo);
          signRecorder.record(level ?? nivel, this.palabraObjetivo);
        }

        dibujarBotoneraColumnas(width: number, height: number, escalaUi: number) {
          const layout = getMultipleChoiceLayout(width, height, this.opciones.length);
          this.opciones.forEach((palabraOpcion, index) => {
            const bounds = layout.buttons[index];
            const botonWidth = bounds.width;
            const botonHeight = bounds.height;
            const posX = bounds.x + botonWidth / 2;
            const posY = bounds.y + botonHeight / 2;

            const contenedorBoton = this.add.container(posX, posY);
            contenedorBoton.setSize(botonWidth, botonHeight);
            contenedorBoton.setInteractive({ useHandCursor: true });

            const backgroundBoton = this.add.graphics();
            backgroundBoton.fillStyle(0xffd32a, 1);
            backgroundBoton.fillRoundedRect(-botonWidth / 2, -botonHeight / 2, botonWidth, botonHeight, 16 * escalaUi);
            backgroundBoton.lineStyle(3 * escalaUi, 0x1e78ff, 1);
            backgroundBoton.strokeRoundedRect(-botonWidth / 2, -botonHeight / 2, botonWidth, botonHeight, 16 * escalaUi);

            const textoBoton = this.add
              .text(0, 0, getTextoSena(palabraOpcion), {
                fontSize: `${Math.max(12, 20 * escalaUi)}px`,
                fontFamily,
                color: "#05215b",
                fontStyle: "800",
                align: "center",
                wordWrap: { width: botonWidth - 16 * escalaUi },
              })
              .setOrigin(0.5);

            // Ajustar también etiquetas largas dentro de los límites de su botón.
            textoBoton.setScale(Math.min(1,
              (botonWidth - 16 * escalaUi) / textoBoton.width,
              (botonHeight - 12 * escalaUi) / textoBoton.height));
            contenedorBoton.add([backgroundBoton, textoBoton]);
            contenedorBoton.setData("valor", palabraOpcion);

            contenedorBoton.on("pointerdown", () =>
              this.validarRespuesta(contenedorBoton, backgroundBoton, botonWidth, botonHeight, escalaUi)
            );
          });
        }

        lanzarConfeti(origenX: number, origenY: number, escalaUi: number) {
          const colores = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502, 0xeccc68, 0xff6b81];

          for (let i = 0; i < 30; i++) {
            const color = Phaser.Utils.Array.GetRandom(colores);
            const size = Phaser.Math.Between(5 * escalaUi, 10 * escalaUi);

            const papelito = this.add.rectangle(origenX, origenY, size, size, color);
            papelito.setAngle(Phaser.Math.Between(0, 360));

            const angulo = Phaser.Math.FloatBetween(-Math.PI, 0);
            const velocidad = Phaser.Math.Between(120 * escalaUi, 280 * escalaUi);
            const targetX = origenX + Math.cos(angulo) * velocidad;
            const targetY = origenY + Math.sin(angulo) * velocidad + 120;

            this.tweens.add({
              targets: papelito,
              x: targetX,
              y: targetY,
              angle: papelito.angle + Phaser.Math.Between(360, 720),
              alpha: 0,
              duration: Phaser.Math.Between(900, 1400),
              ease: "Cubic.easeOut",
              onComplete: () => papelito.destroy(),
            });
          }
        }

        validarRespuesta(
          contenedor: Phaser.GameObjects.Container,
          graficoBg: Phaser.GameObjects.Graphics,
          bWidth: number,
          bHeight: number,
          escalaUi: number
        ) {
          if (this.bloqueado) return;
          this.bloqueado = true;

          const respuestaSeleccionada = contenedor.getData("valor");

          if (respuestaSeleccionada === this.palabraObjetivo) {
            graficoBg.clear();
            graficoBg.fillStyle(0x58cc02, 1);
            graficoBg.fillRoundedRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, 16 * escalaUi);
            graficoBg.lineStyle(3 * escalaUi, 0x10ac84, 1);
            graficoBg.strokeRoundedRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, 16 * escalaUi);

            this.tweens.add({
              targets: contenedor,
              scaleX: 1.1,
              scaleY: 1.1,
              duration: 100,
              yoyo: true,
              ease: "Quad.easeOut",
            });

            this.lanzarConfeti(contenedor.x, contenedor.y, escalaUi);

            this.aciertos++;
            if (this.badgeAciertos) {
              this.badgeAciertos.actualizar(`Aciertos: ${this.aciertos}/${targetCount}`);
            }

            if (typeof onRondaGanada === "function") {
              onRondaGanada(this.aciertos);
            }

            this.time.delayedCall(3000, () => {
              if (this.aciertos >= targetCount) {
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
            graficoBg.clear();
            graficoBg.fillStyle(0xff4757, 1);
            graficoBg.fillRoundedRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, 16 * escalaUi);
            graficoBg.lineStyle(3 * escalaUi, 0xb2bec3, 1);
            graficoBg.strokeRoundedRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, 16 * escalaUi);

            this.intentosFallidos++;
            if (onExamResult) { void onExamResult(this.intentosFallidos); return; }
            if (this.badgeVidas) {
              this.badgeVidas.actualizar(`Intentos: ${Math.max(0, (onExamResult ? 1 : 3) - this.intentosFallidos)}`);
            }

            this.tweens.add({
              targets: contenedor,
              x: contenedor.x + 6,
              duration: 40,
              yoyo: true,
              repeat: 2,
              onComplete: () => {
                graficoBg.clear();
                graficoBg.fillStyle(0xffd32a, 1);
                graficoBg.fillRoundedRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, 16 * escalaUi);
                graficoBg.lineStyle(3 * escalaUi, 0x1e78ff, 1);
                graficoBg.strokeRoundedRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, 16 * escalaUi);

                if (this.intentosFallidos >= 3) {
                  this.time.delayedCall(300, () => {
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
          if (onExamResult) {
            void onExamResult(this.errores);
            return;
          }
          const { width, height } = this.scale;
          const escalaUi = getGameFrame(width, height).scale;

          this.add.image(0, 0, "fondoPantalla").setOrigin(0, 0).setDisplaySize(width, height);

          const panelWidth = Phaser.Math.Clamp(width * 0.85, 240, 400);
          const panelHeight = 150 * escalaUi;
          const panelX = width / 2 - panelWidth / 2;
          const panelY = height / 2 - panelHeight / 2;

          const panel = this.add.graphics();
          panel.fillStyle(0xffd32a, 1);
          panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16 * escalaUi);
          panel.lineStyle(4 * escalaUi, 0x06398a, 1);
          panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 16 * escalaUi);

          const resultadoTexto = this.add
            .text(width / 2, height / 2 - 24 * escalaUi, "¡Excelente trabajo!\nGuardando tus puntos...", {
              fontSize: `${Math.round(22 * escalaUi)}px`,
              fontFamily,
              color: "#003895",
              align: "center",
              fontStyle: "bold",
            })
            .setOrigin(0.5);

          const botonFinal = this.add
            .text(width / 2, height / 2 + 36 * escalaUi, "Guardando...", {
              fontSize: `${Math.round(20 * escalaUi)}px`,
              fontFamily,
              color: "#ffffff",
              backgroundColor: "#7f8c8d",
              padding: { x: 20, y: 8 },
            })
            .setOrigin(0.5);

          const guardarResultado = () => {
            resultadoGuardado = true;
            signRecorder.flush().then(() => completeGame("adivinar", this.errores, origin, level))
              .then((resultado) => {
                resultadoTexto.setText(
                  `¡Partida terminada!\nGanaste ${resultado.pointsAwarded} puntos.`
                );
                botonFinal.setText("¡Felicidades!").setBackgroundColor("#2ed573");
                botonFinal.setInteractive({ useHandCursor: true });
                botonFinal.once("pointerdown", () => {
                  router.push(level ? `/nivel/${level}${origin === "training" ? "?origen=entrenamiento" : ""}` : origin === "training" ? "/menu?origen=entrenamiento" : "/menu");
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
          mode: onExamResult ? Phaser.Scale.FIT : Phaser.Scale.RESIZE,
          autoCenter: onExamResult ? Phaser.Scale.CENTER_BOTH : Phaser.Scale.NO_CENTER,
          parent: gameRef.current!,
          width: onExamResult ? gameRef.current!.clientWidth : "100%",
          height: onExamResult ? gameRef.current!.clientHeight : "100%",
        },
        backgroundColor: "#87CEEB",
        scene: [AdivinarScene, PantallaFin],
      };

      const game = new Phaser.Game(config);
      gameInstanceRef.current = game;

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
  }, [nivel, palabras, onRondaGanada, userName, points, origin, level, router, onExamResult]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={gameRef} style={{ width: "100%", height: "100%" }} />

      {perdio && (
        <PantallaSinVidas
          rutaEntrenamiento="/entrenamiento"
          rutaInicio="/menu"
          onVolverInicio={() => router.push(origin === "training" ? "/menu?origen=entrenamiento" : "/menu")}
          onIrEntrenamiento={() => router.push("/entrenamiento")}
        />
      )}
    </div>
  );
}
