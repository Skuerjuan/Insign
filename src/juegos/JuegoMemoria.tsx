"use client";

import { useEffect, useRef } from "react";
import { completeGame, type GameOrigin } from "@/lib/server/profile.actions";
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
  console.warn("No se pudo cargar la carpeta de gifs automaticamente:", e);
}

const palabrasd = Object.keys(diccionarioGifs);
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

          const mazoBase =
            palabrasd.length > 0
              ? palabrasd
              : ["Hola", "Adios", "Gracias", "Bien", "Mal", "Por favor", "Mama", "Ayuda"];
          const pares = palabras && palabras.length > 0 ? palabras : mazoBase;
          this.totalPares = pares.length;

          const senias = Phaser.Utils.Array.Shuffle([...pares]);
          const significados = Phaser.Utils.Array.Shuffle([...pares]);

          const escalaUi = Phaser.Math.Clamp(Math.min(width / 480, height / 700), 0.65, 1.15);
          this.escalaUiGlobal = escalaUi;

          const isPortrait = width < height || width < 650;
          const marcadorHeight = 38 * escalaUi;
          const marcadorY = height - marcadorHeight - 12 * escalaUi;

          this.crearHud(width, height, escalaUi, marcadorY, marcadorHeight);

          if (isPortrait) {
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
            const section1Height = significadosRows * cardHeight + (significadosRows - 1) * gapY;
            const ySignificadosStart = topY + 25 * escalaUi;

            this.crearEtiqueta(width / 2, topY + 10 * escalaUi, "SIGNIFICADOS", escalaUi);
            this.crearGrupoLayout(significados, "significado", {
              cols,
              cardWidth,
              cardHeight,
              startX: width / 2,
              startY: ySignificadosStart + cardHeight / 2,
              gapX,
              gapY,
              escalaUi,
            });

            const ySeniasHeader = ySignificadosStart + section1Height + 15 * escalaUi;
            const ySeniasStart = ySeniasHeader + 15 * escalaUi;

            this.crearEtiqueta(width / 2, ySeniasHeader, "SEÑAS", escalaUi);
            this.crearGrupoLayout(senias, "senia", {
              cols,
              cardWidth,
              cardHeight,
              startX: width / 2,
              startY: ySeniasStart + cardHeight / 2,
              gapX,
              gapY,
              escalaUi,
            });
          } else {
            const cols = 4;
            const gapX = 10 * escalaUi;
            const gapY = 10 * escalaUi;
            const groupGapX = 24 * escalaUi;
            const labelsY = 85 * escalaUi;
            const startY = labelsY + 35 * escalaUi;

            const totalWidthAvailable = width * 0.94;
            const blockWidth = (totalWidthAvailable - groupGapX) / 2;
            const cardWidth = Math.floor((blockWidth - (cols - 1) * gapX) / cols);
            const cardHeight = cardWidth;

            const leftBlockCenterX = width / 2 - blockWidth / 2 - groupGapX / 2;
            const rightBlockCenterX = width / 2 + blockWidth / 2 + groupGapX / 2;

            this.crearEtiqueta(leftBlockCenterX, labelsY, "SIGNIFICADOS", escalaUi);
            this.crearGrupoLayout(significados, "significado", {
              cols,
              cardWidth,
              cardHeight,
              startX: leftBlockCenterX,
              startY: startY + cardHeight / 2,
              gapX,
              gapY,
              escalaUi,
            });

            this.crearEtiqueta(rightBlockCenterX, labelsY, "SEÑAS", escalaUi);
            this.crearGrupoLayout(senias, "senia", {
              cols,
              cardWidth,
              cardHeight,
              startX: rightBlockCenterX,
              startY: startY + cardHeight / 2,
              gapX,
              gapY,
              escalaUi,
            });
          }

          this.scale.on("resize", () => {
            this.scene.restart();
          });
        }

        crearHud(width: number, height: number, escalaUi: number, marcadorY: number, marcadorHeight: number) {
          const azul = 0x1e78ff;
          const amarillo = 0xffd32a;
          const azulTexto = "#05215b";
          const topY = Math.max(30 * escalaUi, height * 0.05);

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

          const marcadorWidth = Phaser.Math.Clamp(width * 0.4, 160, 260);
          const marcadorBg = this.add.graphics();
          marcadorBg.fillStyle(amarillo, 1);
          marcadorBg.fillRoundedRect(width / 2 - marcadorWidth / 2, marcadorY, marcadorWidth, marcadorHeight, 10 * escalaUi);
          marcadorBg.lineStyle(3 * escalaUi, 0x06398a, 1);
          marcadorBg.strokeRoundedRect(width / 2 - marcadorWidth / 2, marcadorY, marcadorWidth, marcadorHeight, 10 * escalaUi);

          this.textoMarcador = this.add
            .text(width / 2, marcadorY + marcadorHeight / 2, `Pares: 0/${this.totalPares}`, {
              fontSize: `${Phaser.Math.Clamp(20 * escalaUi, 15, 26)}px`,
              fontFamily,
              color: "#003895",
              fontStyle: "800",
            })
            .setOrigin(0.5);
        }

        crearEtiqueta(x: number, y: number, texto: string, escalaUi: number) {
          const widthEtiqueta = 140 * escalaUi;
          const heightEtiqueta = 28 * escalaUi;
          const bg = this.add.graphics();
          bg.fillStyle(0xffd32a, 1);
          bg.fillRoundedRect(x - widthEtiqueta / 2, y - heightEtiqueta / 2, widthEtiqueta, heightEtiqueta, 8 * escalaUi);
          bg.lineStyle(2 * escalaUi, 0x06398a, 1);
          bg.strokeRoundedRect(x - widthEtiqueta / 2, y - heightEtiqueta / 2, widthEtiqueta, heightEtiqueta, 8 * escalaUi);

          this.add
            .text(x, y, texto, {
              fontSize: `${Phaser.Math.Clamp(14 * escalaUi, 11, 18)}px`,
              fontFamily,
              color: "#003895",
              fontStyle: "800",
            })
            .setOrigin(0.5);
        }

        crearGrupoLayout(
          items: string[],
          tipo: string,
          config: {
            cols: number;
            cardWidth: number;
            cardHeight: number;
            startX: number;
            startY: number;
            gapX: number;
            gapY: number;
            escalaUi: number;
          }
        ) {
          const totalWidth = config.cols * config.cardWidth + (config.cols - 1) * config.gapX;
          const originX = config.startX - totalWidth / 2 + config.cardWidth / 2;

          items.forEach((item, index) => {
            if (!item) return;

            const c = index % config.cols;
            const r = Math.floor(index / config.cols);

            const x = originX + c * (config.cardWidth + config.gapX);
            const y = config.startY + r * (config.cardHeight + config.gapY);

            const carta = this.add.container(x, y);
            carta.setSize(config.cardWidth, config.cardHeight);
            carta.setInteractive({ useHandCursor: true });

            const fondoObj = this.add.image(0, 0, "fondoFicha").setDisplaySize(config.cardWidth, config.cardHeight);
            let contenidoVisible: CardContent;

            if (tipo === "senia") {
              const elementoImg = document.createElement("img");
              elementoImg.style.width = `${Math.round(config.cardWidth * 0.92)}px`;
              elementoImg.style.height = `${Math.round(config.cardHeight * 0.92)}px`;
              elementoImg.style.objectFit = "contain";
              elementoImg.style.borderRadius = "8px";
              elementoImg.style.pointerEvents = "none";

              const archivoImportado = diccionarioGifs[item];
              if (archivoImportado) {
                const src = typeof archivoImportado === "string" ? archivoImportado : archivoImportado.src;
                elementoImg.src = `${src}?v=${Date.now()}-${Math.random()}`;
              }
              contenidoVisible = this.add.dom(0, 0, elementoImg);
            } else {
              contenidoVisible = this.add
                .text(0, 0, item, {
                  fontSize: `${Math.round(Phaser.Math.Clamp(config.cardWidth * 0.22, 12, 22))}px`,
                  fontFamily,
                  color: "#003895",
                  stroke: "#ffffff",
                  strokeThickness: 2 * config.escalaUi,
                  fontStyle: "800",
                  wordWrap: { width: config.cardWidth * 0.85 },
                  align: "center",
                })
                .setOrigin(0.5);
            }

            contenidoVisible.setVisible(false);

            carta.add([fondoObj, contenidoVisible]);
            carta.setData("valor", item);
            carta.setData("tipo", tipo);
            carta.setData("volteada", false);

            carta.on("pointerdown", () => this.voltearCarta(carta, fondoObj, contenidoVisible));
          });
        }

        lanzarConfeti(origenX: number, origenY: number, escalaUi: number) {
          const colores = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502, 0xeccc68, 0xff6b81];

          for (let i = 0; i < 40; i++) {
            const color = Phaser.Utils.Array.GetRandom(colores);
            const size = Phaser.Math.Between(5 * escalaUi, 10 * escalaUi);

            const papelito = this.add.rectangle(origenX, origenY, size, size, color);
            papelito.setAngle(Phaser.Math.Between(0, 360));

            const angulo = Phaser.Math.FloatBetween(-Math.PI * 1.1, 0.1);
            const velocidad = Phaser.Math.Between(150 * escalaUi, 350 * escalaUi);
            const targetX = origenX + Math.cos(angulo) * velocidad;
            const targetY = origenY + Math.sin(angulo) * velocidad + 100;

            this.tweens.add({
              targets: papelito,
              x: targetX,
              y: targetY,
              angle: papelito.angle + Phaser.Math.Between(360, 720),
              alpha: 0,
              duration: Phaser.Math.Between(1000, 1500),
              ease: "Cubic.easeOut",
              onComplete: () => papelito.destroy(),
            });
          }
        }

        voltearCarta(
          carta: Phaser.GameObjects.Container,
          fondoObj: CardBack,
          contenidoVisible: CardContent
        ) {
          if (this.bloqueado || carta.getData("volteada")) return;

          if (this.primeraCarta) {
            const tipoPrimera = this.primeraCarta.carta.getData("tipo");
            const tipoActual = carta.getData("tipo");

            if (tipoPrimera === tipoActual) {
              return;
            }
          }

          this.tweens.add({
            targets: carta,
            scaleX: 0,
            duration: 120,
            yoyo: true,
            onYoyo: () => {
              contenidoVisible.setVisible(true);
              carta.setData("volteada", true);
            },
            onComplete: () => this.verificarPar(carta, fondoObj, contenidoVisible),
          });
        }

        verificarPar(
          carta: Phaser.GameObjects.Container,
          fondoObj: CardBack,
          contenidoVisible: CardContent
        ) {
          if (!this.primeraCarta) {
            this.primeraCarta = { carta, fondoObj, contenidoVisible };
          } else {
            this.segundaCarta = { carta, fondoObj, contenidoVisible };
            this.bloqueado = true;

            const valor1 = this.primeraCarta.carta.getData("valor");
            const valor2 = this.segundaCarta.carta.getData("valor");

            if (valor1 === valor2) {
              this.lanzarConfeti(this.primeraCarta.carta.x, this.primeraCarta.carta.y, this.escalaUiGlobal);
              this.lanzarConfeti(this.segundaCarta.carta.x, this.segundaCarta.carta.y, this.escalaUiGlobal);

              this.time.delayedCall(400, () => {
                if (!this.primeraCarta || !this.segundaCarta) return;

                this.primeraCarta.fondoObj.setTint(0x4be06d);
                this.segundaCarta.fondoObj.setTint(0x4be06d);

                this.aciertos++;

                if (this.textoMarcador) {
                  this.textoMarcador.setText(`Pares: ${this.aciertos}/${this.totalPares}`);
                }

                if (typeof onParAdivinado === "function") {
                  onParAdivinado(this.aciertos);
                }

                if (this.aciertos === this.totalPares) {
                  this.time.delayedCall(2000, () => {
                    this.scene.start("PantallaFin");
                  });
                } else {
                  this.resetSeleccion();
                }
              });
            } else {
              this.time.delayedCall(800, () => {
                if (this.primeraCarta && this.segundaCarta) {
                  this.ocultarCarta(this.primeraCarta);
                  this.ocultarCarta(this.segundaCarta);
                }
                this.resetSeleccion();
              });
            }
          }
        }

        ocultarCarta(obj: SelectedCard) {
          this.tweens.add({
            targets: obj.carta,
            scaleX: 0,
            duration: 120,
            yoyo: true,
            onYoyo: () => {
              obj.fondoObj.clearTint();
              obj.contenidoVisible.setVisible(false);
              obj.carta.setData("volteada", false);
            },
          });
        }

        resetSeleccion() {
          this.primeraCarta = null;
          this.segundaCarta = null;
          this.bloqueado = false;
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
                botonFinal.setText("Volver").setBackgroundColor("#1e78ff");
                botonFinal.setInteractive({ useHandCursor: true });
                botonFinal.once("pointerdown", () => window.history.back());
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