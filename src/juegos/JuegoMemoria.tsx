"use client";

import { useEffect, useRef } from "react";
import { completeGame, type GameOrigin } from "@/lib/server/profile.actions";
import fondoCartas from "./fondo.png";
import fondo from "./fondoP.png";

const PALABRAS_DEFECTO = [
  "Hola",
  "Chau",
  "Gracias",
  "Bien",
  "Mal",
  "Por favor",
];

const FALLBACK_FONT_FAMILY = '"Baloo 2", Arial, sans-serif';

interface JuegoMemoriaProps {
  palabras?: string[];
  onParAdivinado?: (actuales: number) => void;
  points?: number;
  origin?: GameOrigin;
}

export default function JuegoMemoria({ palabras, onParAdivinado, points = 0, origin = "menu" }: JuegoMemoriaProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

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

      type CardBack = InstanceType<typeof Phaser.GameObjects.Image>;
      type CardContent =
        | InstanceType<typeof Phaser.GameObjects.DOMElement>
        | InstanceType<typeof Phaser.GameObjects.Text>;
      type SelectedCard = {
        carta: InstanceType<typeof Phaser.GameObjects.Container>;
        fondoObj: CardBack;
        contenidoVisible: CardContent;
      };

      class MemoryScene extends Phaser.Scene {
        private primeraCarta: SelectedCard | null = null;
        private segundaCarta: SelectedCard | null = null;
        private bloqueado = false;
        private aciertos = 0;
        private totalPares = 0;
        private escalaUiGlobal = 1;
        private textoMarcador: Phaser.GameObjects.Text | null = null;

        constructor() {
          super("MemoryScene");
        }

        preload() {
          this.load.image("fondoFicha", fondoCartas.src);
          this.load.image("fondoPantalla", fondo.src);
        }

        create() {
          const { width, height } = this.scale;

          const background = this.add.image(0, 0, "fondoPantalla").setOrigin(0, 0);
          background.setDisplaySize(width, height);

          this.primeraCarta = null;
          this.segundaCarta = null;
          this.bloqueado = false;
          this.aciertos = 0;

          const pares = palabras && palabras.length > 0 ? palabras : PALABRAS_DEFECTO;
          this.totalPares = pares.length;

          const senias = Phaser.Utils.Array.Shuffle([...pares]);
          const significados = Phaser.Utils.Array.Shuffle([...pares]);

          const escalaUi = Phaser.Math.Clamp(Math.min(width / 480, height / 700), 0.65, 1.15);
          this.escalaUiGlobal = escalaUi;

          const isPortrait = width < height || width < 650;
          const marcadorHeight = 38 * escalaUi;
          const marcadorY = height - marcadorHeight - 12 * escalaUi;

          this.crearHud(width, height, escalaUi, marcadorY, marcadorHeight);

          const cols = Math.min(pares.length, 3);
          const gapX = 8 * escalaUi;
          const gapY = 8 * escalaUi;
          const topY = 110 * escalaUi;
          const availHeight = marcadorY - topY - 20 * escalaUi;

          const rowsTotal = Math.ceil(pares.length / cols) * 2;
          const cardSizeByHeight = (availHeight - (rowsTotal + 1) * gapY) / rowsTotal;
          const cardSizeByWidth = (width * 0.92 - (cols - 1) * gapX) / cols;

          const cardWidth = Math.floor(Math.min(cardSizeByWidth, cardSizeByHeight));
          const cardHeight = cardWidth;

          const significadosRows = Math.ceil(significados.length / cols);
          const ySignificadosStart = topY + 25 * escalaUi;

          significados.forEach((palabra, index) => {
            const r = Math.floor(index / cols);
            const c = index % cols;
            const itemsInRow = r === significadosRows - 1 ? significados.length - r * cols : cols;
            const rowWidth = itemsInRow * cardWidth + (itemsInRow - 1) * gapX;
            const startX = width / 2 - rowWidth / 2 + cardWidth / 2;

            const x = startX + c * (cardWidth + gapX);
            const y = ySignificadosStart + r * (cardHeight + gapY);

            this.crearCartaTexto(x, y, cardWidth, cardHeight, palabra, escalaUi);
          });

          const ySeniasStart = ySignificadosStart + significadosRows * (cardHeight + gapY) + 20 * escalaUi;

          senias.forEach((palabra, index) => {
            const r = Math.floor(index / cols);
            const c = index % cols;
            const itemsInRow = r === Math.ceil(senias.length / cols) - 1 ? senias.length - r * cols : cols;
            const rowWidth = itemsInRow * cardWidth + (itemsInRow - 1) * gapX;
            const startX = width / 2 - rowWidth / 2 + cardWidth / 2;

            const x = startX + c * (cardWidth + gapX);
            const y = ySeniasStart + r * (cardHeight + gapY);

            this.crearCartaVideo(x, y, cardWidth, cardHeight, palabra, escalaUi);
          });
        }

        crearHud(width: number, height: number, escalaUi: number, marcadorY: number, marcadorHeight: number) {
          const azul = 0x1e78ff;
          const amarillo = 0xffd32a;
          const azulTexto = "#05215b";
          const topY = Math.max(30 * escalaUi, height * 0.06);

          const botonVolver = this.add.circle(36 * escalaUi, topY + 12 * escalaUi, 18 * escalaUi, azul);
          botonVolver.setInteractive({ useHandCursor: true });
          botonVolver.on("pointerdown", () => window.history.back());

          const flecha = this.add.graphics();
          flecha.lineStyle(4 * escalaUi, 0xffffff, 1);
          flecha.beginPath();
          flecha.moveTo(38 * escalaUi, topY + 2 * escalaUi);
          flecha.lineTo(26 * escalaUi, topY + 12 * escalaUi);
          flecha.lineTo(38 * escalaUi, topY + 22 * escalaUi);
          flecha.moveTo(27 * escalaUi, topY + 12 * escalaUi);
          flecha.lineTo(48 * escalaUi, topY + 12 * escalaUi);
          flecha.strokePath();

          const titleWidth = Phaser.Math.Clamp(width * 0.35, 180 * escalaUi, 320 * escalaUi);
          const titleBg = this.add.graphics();
          titleBg.fillStyle(azul, 0.98);
          titleBg.fillRoundedRect(width / 2 - titleWidth / 2, 8 * escalaUi, titleWidth, 44 * escalaUi, 10 * escalaUi);

          this.add
            .text(width / 2, 30 * escalaUi, "Memoria", {
              fontSize: `${Phaser.Math.Clamp(32 * escalaUi, 22, 42)}px`,
              fontFamily,
              color: "#ffffff",
              stroke: "#d28b00",
              strokeThickness: 4 * escalaUi,
              fontStyle: "800",
            })
            .setOrigin(0.5);

          const puntosTexto = `${points} pts`;
          const scoreWidth = Phaser.Math.Clamp(80 * escalaUi + puntosTexto.length * 6 * escalaUi, 110 * escalaUi, 200 * escalaUi);
          const scoreX = width - scoreWidth - 16 * escalaUi;
          const scoreBg = this.add.graphics();
          scoreBg.fillStyle(0xffe174, 1);
          scoreBg.fillRoundedRect(scoreX, 8 * escalaUi, scoreWidth, 38 * escalaUi, 19 * escalaUi);
          scoreBg.lineStyle(2 * escalaUi, 0xf7b928, 1);
          scoreBg.strokeRoundedRect(scoreX, 8 * escalaUi, scoreWidth, 38 * escalaUi, 19 * escalaUi);
          this.add.star(scoreX + 16 * escalaUi, 27 * escalaUi, 5, 7 * escalaUi, 14 * escalaUi, amarillo);
          this.add
            .text(scoreX + 34 * escalaUi, 27 * escalaUi, puntosTexto, {
              fontSize: `${Phaser.Math.Clamp(15 * escalaUi, 12, 19)}px`,
              fontFamily,
              color: azulTexto,
              fontStyle: "800",
            })
            .setOrigin(0, 0.5);

          const scoreParesBg = this.add.graphics();
          scoreParesBg.fillStyle(0xfbc02d, 1);
          scoreParesBg.fillRoundedRect(width / 2 - 80 * escalaUi, marcadorY, 160 * escalaUi, marcadorHeight, marcadorHeight / 2);

          this.textoMarcador = this.add
            .text(width / 2, marcadorY + marcadorHeight / 2, `Pares: 0/${this.totalPares}`, {
              fontSize: `${Math.round(18 * escalaUi)}px`,
              fontFamily,
              color: "#05215b",
              fontStyle: "800",
            })
            .setOrigin(0.5);
        }

        crearCartaTexto(x: number, y: number, w: number, h: number, palabra: string, escalaUi: number) {
          const container = this.add.container(x, y);
          container.setSize(w, h);
          container.setInteractive({ useHandCursor: true });

          const fondoFicha = this.add.image(0, 0, "fondoFicha").setDisplaySize(w, h);

          const texto = this.add
            .text(0, 0, palabra, {
              fontSize: `${Math.round(18 * escalaUi)}px`,
              fontFamily,
              color: "#05215b",
              fontStyle: "bold",
              align: "center",
              wordWrap: { width: w - 10 },
            })
            .setOrigin(0.5)
            .setVisible(false);

          container.add([fondoFicha, texto]);

          container.setData("palabra", palabra);
          container.setData("tipo", "texto");

          container.on("pointerdown", () => this.alHacerClicCarta(container, fondoFicha, texto));
        }

        crearCartaVideo(x: number, y: number, w: number, h: number, palabra: string, escalaUi: number) {
          const container = this.add.container(x, y);
          container.setSize(w, h);
          container.setInteractive({ useHandCursor: true });

          const fondoFicha = this.add.image(0, 0, "fondoFicha").setDisplaySize(w, h);

          const elementoVideo = document.createElement("video");
          elementoVideo.style.width = `${w - 8}px`;
          elementoVideo.style.height = `${h - 8}px`;
          elementoVideo.style.objectFit = "cover";
          elementoVideo.style.borderRadius = `${Math.round(8 * escalaUi)}px`;
          elementoVideo.style.pointerEvents = "none";
          elementoVideo.autoplay = true;
          elementoVideo.loop = true;
          elementoVideo.muted = true;
          elementoVideo.playsInline = true;

          elementoVideo.src = `/nivel1/${palabra}.mp4`;

          const domVideo = this.add.dom(0, 0, elementoVideo).setVisible(false);

          container.add([fondoFicha, domVideo]);

          container.setData("palabra", palabra);
          container.setData("tipo", "video");

          container.on("pointerdown", () => this.alHacerClicCarta(container, fondoFicha, domVideo));
        }

        alHacerClicCarta(
          carta: InstanceType<typeof Phaser.GameObjects.Container>,
          fondoObj: CardBack,
          contenidoVisible: CardContent
        ) {
          if (this.bloqueado) return;
          if (this.primeraCarta && this.primeraCarta.carta === carta) return;

          this.voltearCarta(carta, fondoObj, contenidoVisible, true);

          if (!this.primeraCarta) {
            this.primeraCarta = { carta, fondoObj, contenidoVisible };
          } else {
            this.segundaCarta = { carta, fondoObj, contenidoVisible };
            this.bloqueado = true;
            this.verificarPareja();
          }
        }

        voltearCarta(
          carta: InstanceType<typeof Phaser.GameObjects.Container>,
          fondoObj: CardBack,
          contenidoVisible: CardContent,
          mostrarContenido: boolean
        ) {
          this.tweens.add({
            targets: carta,
            scaleX: 0,
            duration: 120,
            onComplete: () => {
              fondoObj.setVisible(!mostrarContenido);
              contenidoVisible.setVisible(mostrarContenido);

              this.tweens.add({
                targets: carta,
                scaleX: 1,
                duration: 120,
              });
            },
          });
        }

        verificarPareja() {
          if (!this.primeraCarta || !this.segundaCarta) return;

          const p1 = this.primeraCarta.carta.getData("palabra");
          const p2 = this.segundaCarta.carta.getData("palabra");
          const t1 = this.primeraCarta.carta.getData("tipo");
          const t2 = this.segundaCarta.carta.getData("tipo");

          if (p1 === p2 && t1 !== t2) {
            this.aciertos++;
            if (this.textoMarcador) {
              this.textoMarcador.setText(`Pares: ${this.aciertos}/${this.totalPares}`);
            }

            if (typeof onParAdivinado === "function") {
              onParAdivinado(this.aciertos);
            }

            this.time.delayedCall(400, () => {
              if (this.primeraCarta && this.segundaCarta) {
                this.lanzarConfeti(this.primeraCarta.carta.x, this.primeraCarta.carta.y, this.escalaUiGlobal);
                this.lanzarConfeti(this.segundaCarta.carta.x, this.segundaCarta.carta.y, this.escalaUiGlobal);

                this.primeraCarta.carta.disableInteractive();
                this.segundaCarta.carta.disableInteractive();

                this.primeraCarta = null;
                this.segundaCarta = null;
                this.bloqueado = false;

                if (this.aciertos >= this.totalPares) {
                  this.time.delayedCall(800, () => {
                    this.scene.start("PantallaFin");
                  });
                }
              }
            });
          } else {
            this.time.delayedCall(800, () => {
              if (this.primeraCarta && this.segundaCarta) {
                this.voltearCarta(
                  this.primeraCarta.carta,
                  this.primeraCarta.fondoObj,
                  this.primeraCarta.contenidoVisible,
                  false
                );
                this.voltearCarta(
                  this.segundaCarta.carta,
                  this.segundaCarta.fondoObj,
                  this.segundaCarta.contenidoVisible,
                  false
                );

                this.primeraCarta = null;
                this.segundaCarta = null;
                this.bloqueado = false;
              }
            });
          }
        }

        lanzarConfeti(origenX: number, origenY: number, escalaUi: number) {
          const colores = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502, 0xeccc68, 0xff6b81];

          for (let i = 0; i < 20; i++) {
            const color = Phaser.Utils.Array.GetRandom(colores);
            const size = Phaser.Math.Between(4 * escalaUi, 8 * escalaUi);

            const papelito = this.add.rectangle(origenX, origenY, size, size, color);
            papelito.setAngle(Phaser.Math.Between(0, 360));

            const angulo = Phaser.Math.FloatBetween(-Math.PI, 0);
            const velocidad = Phaser.Math.Between(80 * escalaUi, 200 * escalaUi);
            const targetX = origenX + Math.cos(angulo) * velocidad;
            const targetY = origenY + Math.sin(angulo) * velocidad + 80;

            this.tweens.add({
              targets: papelito,
              x: targetX,
              y: targetY,
              angle: papelito.angle + Phaser.Math.Between(360, 720),
              alpha: 0,
              duration: Phaser.Math.Between(800, 1200),
              ease: "Cubic.easeOut",
              onComplete: () => papelito.destroy(),
            });
          }
        }
      }

      class PantallaFin extends Phaser.Scene {
        constructor() {
          super("PantallaFin");
        }

        create() {
          const { width, height } = this.scale;
          const escalaUi = Phaser.Math.Clamp(Math.min(width / 480, height / 650), 0.65, 1.15);

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
            completeGame("memoria", 0, origin)
              .then((resultado) => {
                resultadoTexto.setText(
                  `¡Partida terminada!\nGanaste ${resultado.pointsAwarded} puntos.`
                );
                botonFinal.setText("¡Felicidades!").setBackgroundColor("#2ed573");
                botonFinal.setInteractive({ useHandCursor: true });
                botonFinal.once("pointerdown", () => {
                  window.location.href = "/juegos/felicitar";
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
        scene: [MemoryScene, PantallaFin],
      };

      const game = new Phaser.Game(config);
      gameInstanceRef.current = game;
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
  }, [palabras, onParAdivinado, points, origin]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={gameRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}