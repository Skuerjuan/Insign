"use client";

import { useState, useEffect, useRef } from "react";
import { getGameFrame, getChoiceLayout } from "@/lib/client/game-layout";
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

interface JuegoEleccionProps {
  nivel?: string;
  palabras?: string[];
  onRondaGanada?: (actuales: number) => void;
  points?: number;
  origin?: GameOrigin;
  level?: number;
  onExamResult?: (mistakes: number) => Promise<void>;
}

export default function JuegoEleccion({ 
  nivel = "presentacion-1",
  palabras: palabrasProp,
  onRondaGanada, 
  points = 0, 
  origin = "menu", 
  level,
  onExamResult,
}: JuegoEleccionProps) {
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

        const paddingX = 20 * escalaUi;
        const width = textWidth + paddingX * 2;
        const height = 50 * escalaUi;
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
            fontSize: `${fontSizePx + 4}px`,
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

        private fichasContainers: Phaser.GameObjects.Container[] = [];
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
          this.fichasContainers = [];
        }

        preload() {
          this.load.image("fondoFicha", fondoCartas.src);
          this.load.image("fondoPantalla", fondoPantallaSrc);
        }

        create() {
          const { width, height } = this.scale;
          const escalaUi = getGameFrame(width, height).scale;
          this.escalaUiGlobal = escalaUi;

          const background = this.add.image(0, 0, "fondoPantalla").setOrigin(0, 0);
          background.setDisplaySize(width, height);

          const mazoObtenido =
            palabras && palabras.length > 0
              ? palabras
              : getPalabrasPorCategoria(nivel) || [];
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
          drawGameHeader(this, width, height, "Elección", points, fontFamily);
          this.badgeAciertos = crearPillBadge(this, frame.margin, frame.footerY,
            `Aciertos: ${this.aciertos}/${targetCount}`, "⭐", escalaUi, false);
          this.badgeVidas = crearPillBadge(this, width - frame.margin, frame.footerY,
            `Intentos: ${Math.max(0, (onExamResult ? 1 : 3) - this.intentosFallidos)}`, "❤️", escalaUi, true);
        }

        generarNuevaRonda(width: number, height: number, escalaUi: number) {
          if (!this.mazoJuego || this.mazoJuego.length === 0) {
            console.error("El mazo de palabras está vacío o no se encontraron palabras para este nivel.");
            return;
          }

          let palabrasDisponiblesFiltradas = this.mazoJuego.filter(
            (p) => !this.palabrasUsadas.includes(p)
          );

          if (palabrasDisponiblesFiltradas.length === 0) {
            this.palabrasUsadas = [];
            palabrasDisponiblesFiltradas = [...this.mazoJuego];
          }

          const indexRandom = Phaser.Math.Between(0, palabrasDisponiblesFiltradas.length - 1);
          this.palabraObjetivo = palabrasDisponiblesFiltradas[indexRandom] || "";

          if (!this.palabraObjetivo) {
            console.error("No se pudo seleccionar una palabra objetivo válida.");
            return;
          }

          this.palabrasUsadas.push(this.palabraObjetivo);

          const distractores = (onExamResult && level ? getLevelWords(level) : this.mazoJuego).filter((p) => getGrupoSena(p) !== getGrupoSena(this.palabraObjetivo));
          const distractoresMezclados = Phaser.Utils.Array.Shuffle([...distractores]).slice(0, 3);
          this.opciones = Phaser.Utils.Array.Shuffle([this.palabraObjetivo, ...distractoresMezclados]);

          const layout = getChoiceLayout(width, height);
          const palabraTextoFormatted = getTextoSena(this.palabraObjetivo).toUpperCase();

          this.textoPalabra = this.add
            .text(width / 2, layout.questionY, `Elegí la seña de «${palabraTextoFormatted}»`, {
              fontSize: `${Math.max(12, 24 * escalaUi)}px`,
              fontFamily,
              color: "#05215b",
              fontStyle: "800",
              align: "center",
              wordWrap: { width: width - 32 * escalaUi },
            })
            .setOrigin(0.5, 0)
            .setDepth(10);
          this.textoPalabra.setStroke("#ffffff", 5 * escalaUi);

          this.dibujarGrillaOpciones(width, height, escalaUi);
        }

        dibujarGrillaOpciones(width: number, height: number, escalaUi: number) {
          this.fichasContainers = [];
          const layout = getChoiceLayout(width, height);
          const cardWidth = layout.cards[0].width;
          const cardHeight = layout.cards[0].height;

          this.opciones.forEach((palabraOpcion, index) => {
            const bounds = layout.cards[index];
            const pos = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

            const ficha = this.add.container(pos.x, pos.y);
            ficha.setSize(cardWidth, cardHeight);
            ficha.setInteractive({ useHandCursor: true });

            const elementoVideo = document.createElement("video");
            elementoVideo.style.width = `${cardWidth}px`;
            elementoVideo.style.height = `${cardHeight}px`;
            elementoVideo.style.objectFit = "cover";
            elementoVideo.style.objectPosition = "center";
            elementoVideo.style.borderRadius = `${Math.round(12 * escalaUi)}px`;
            elementoVideo.style.pointerEvents = "none";
            elementoVideo.autoplay = true;
            elementoVideo.loop = true;
            elementoVideo.muted = true;
            elementoVideo.playsInline = true;

            elementoVideo.src = getVideoPath(level ?? nivel, palabraOpcion) ?? "";

            const domVideo = this.add.dom(0, 0, elementoVideo);

            const cardBg = this.add.graphics();
            cardBg.lineStyle(4 * escalaUi, 0x1e78ff, 1);
            cardBg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12 * escalaUi);

            ficha.add([domVideo, cardBg]);
            signRecorder.record(level ?? nivel, palabraOpcion);

            ficha.setData("valor", palabraOpcion);
            ficha.setData("graphics", cardBg);
            ficha.setData("cardWidth", cardWidth);
            ficha.setData("cardHeight", cardHeight);

            this.fichasContainers.push(ficha);

            ficha.on("pointerdown", () => this.validarRespuesta(ficha, cardBg, cardWidth, cardHeight, escalaUi));
          });
        }

        lanzarConfeti(origenX: number, origenY: number, escalaUi: number) {
          const colores = [0xff4757, 0x2ed573, 0x00ff66, 0x1e90ff, 0xffa502, 0xeccc68, 0xff6b81, 0x9b59b6];

          for (let i = 0; i < 100; i++) {
            const color = Phaser.Utils.Array.GetRandom(colores);
            const size = Phaser.Math.Between(6 * escalaUi, 14 * escalaUi);

            const papelito = this.add.rectangle(origenX, origenY, size, size, color).setDepth(20);
            papelito.setAngle(Phaser.Math.Between(0, 360));

            const angulo = Phaser.Math.FloatBetween(-Math.PI * 1.2, 0.2);
            const velocidad = Phaser.Math.Between(200 * escalaUi, 500 * escalaUi);
            const targetX = origenX + Math.cos(angulo) * velocidad + Phaser.Math.Between(-60, 60);
            const targetY = origenY + Math.sin(angulo) * velocidad + Phaser.Math.Between(100, 300);

            this.tweens.add({
              targets: papelito,
              x: targetX,
              y: targetY,
              angle: papelito.angle + Phaser.Math.Between(720, 1440),
              alpha: 0,
              duration: Phaser.Math.Between(1500, 3000),
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
            
            cardBg.fillStyle(0x00ff66, 0.2);
            cardBg.fillRoundedRect(-w / 2, -h / 2, w, h, 12 * escalaUi);

            cardBg.lineStyle(12 * escalaUi, 0x00ff66, 1);
            cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12 * escalaUi);

            // 💡 Animación de la respuesta correcta e incorrectas
            this.fichasContainers.forEach((f) => {
              if (f === ficha) {
                f.setDepth(15);
                this.tweens.add({
                  targets: f,
                  scaleX: 1.18,
                  scaleY: 1.18,
                  duration: 450,
                  ease: "Back.easeOut",
                });
              } else {
                this.tweens.add({
                  targets: f,
                  scaleX: 0.75,
                  scaleY: 0.75,
                  alpha: 0.55,
                  duration: 400,
                  ease: "Cubic.easeOut",
                });
              }
            });

            this.aciertos++;
            this.lanzarConfeti(ficha.x, ficha.y, this.escalaUiGlobal);

            if (this.badgeAciertos) {
              this.badgeAciertos.actualizar(`Aciertos: ${this.aciertos}/${targetCount}`);
            }

            if (typeof onRondaGanada === "function") {
              onRondaGanada(this.aciertos);
            }

            this.time.delayedCall(5000, () => {
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
            cardBg.clear();
            cardBg.lineStyle(8 * escalaUi, 0xff4757, 1);
            cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12 * escalaUi);

            this.intentosFallidos++;
            if (onExamResult) { void onExamResult(this.intentosFallidos); return; }

            if (this.badgeVidas) {
              this.badgeVidas.actualizar(`Intentos: ${Math.max(0, (onExamResult ? 1 : 3) - this.intentosFallidos)}`);
            }

            this.tweens.add({
              targets: ficha,
              x: ficha.x + 6,
              duration: 40,
              yoyo: true,
              repeat: 2,
              onComplete: () => {
                cardBg.clear();
                cardBg.lineStyle(4 * escalaUi, 0x1e78ff, 1);
                cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12 * escalaUi);

                if (this.intentosFallidos >= 3) {
                  this.time.delayedCall(400, () => {
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

          const panelWidth = Phaser.Math.Clamp(width * 0.8, 220, 360);
          const panelHeight = 140 * escalaUi;
          const panelX = width / 2 - panelWidth / 2;
          const panelY = height / 2 - panelHeight / 2;

          const panel = this.add.graphics();
          panel.fillStyle(0xffd32a, 1);
          panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16 * escalaUi);
          panel.lineStyle(4 * escalaUi, 0x06398a, 1);
          panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 16 * escalaUi);

          const resultadoTexto = this.add
            .text(width / 2, height / 2 - 24 * escalaUi, "¡Excelente trabajo!\nGuardando tus puntos...", {
              fontSize: `${Math.round(20 * escalaUi)}px`,
              fontFamily,
              color: "#003895",
              align: "center",
              fontStyle: "bold",
            })
            .setOrigin(0.5);

          const botonFinal = this.add
            .text(width / 2, height / 2 + 36 * escalaUi, "Guardando...", {
              fontSize: `${Math.round(18 * escalaUi)}px`,
              fontFamily,
              color: "#ffffff",
              backgroundColor: "#7f8c8d",
              padding: { x: 18, y: 6 },
            })
            .setOrigin(0.5);

          const guardarResultado = () => {
            resultadoGuardado = true;
            signRecorder.flush().then(() => completeGame("eleccion", this.errores, origin, level))
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
        scene: [EleccionScene, PantallaFin],
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
  }, [nivel, palabras, onRondaGanada, points, origin, level, router, onExamResult]);

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
