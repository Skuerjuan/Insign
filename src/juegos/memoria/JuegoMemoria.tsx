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
  const contextoGifs = (require as WebpackRequire).context("../../../public/gifs", false, /\.gif$/);

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
      type GridLayout = {
        cardWidth: number;
        cardHeight: number;
        startY: number;
        centerX: number;
        gapX: number;
        gapY: number;
        escalaUi: number;
      };

      class MemoryScene extends Phaser.Scene {
        private primeraCarta: SelectedCard | null = null;
        private segundaCarta: SelectedCard | null = null;
        private bloqueado = false;
        private aciertos = 0;
        private totalPares = 0;
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

          const escalaUi = Phaser.Math.Clamp(Math.min(width / 500, height / 360), 0.78, 1.35);
          const columnasPorGrupo = 4;
          const filasPorGrupo = Math.max(Math.ceil(pares.length / columnasPorGrupo), 1);
          const marcadorHeight = 48 * escalaUi;
          const marcadorY = height - marcadorHeight - 16 * escalaUi;
          const labelsY = Math.max(132 * escalaUi, height * 0.18);
          const startY = labelsY + 86 * escalaUi;
          const gapX = Phaser.Math.Clamp(width * 0.012, 12 * escalaUi, 26 * escalaUi);
          const gapY = Phaser.Math.Clamp(height * 0.045, 24 * escalaUi, 46 * escalaUi);
          const groupGapX = Phaser.Math.Clamp(width * 0.06, 82 * escalaUi, 160 * escalaUi);
          const anchoDisponible = width * 0.92;
          const cardSizePorAncho = (anchoDisponible - groupGapX - gapX * (columnasPorGrupo - 1) * 2) / (columnasPorGrupo * 2);
          const altoDisponible = Math.max(220, marcadorY - startY - 42 * escalaUi);
          const cardSizePorAlto = (altoDisponible - gapY * (filasPorGrupo - 1)) / filasPorGrupo;
          const cardWidth = Phaser.Math.Clamp(Math.min(205 * escalaUi, cardSizePorAncho, cardSizePorAlto), 110, 218);
          const cardHeight = cardWidth;
          const bloqueWidth = cardWidth * columnasPorGrupo + gapX * (columnasPorGrupo - 1);
          const totalGridWidth = bloqueWidth * 2 + groupGapX;
          const significadosLeft = width / 2 - totalGridWidth / 2;
          const seniasLeft = significadosLeft + bloqueWidth + groupGapX;
          const xSignificados = significadosLeft + bloqueWidth / 2;
          const xSenias = seniasLeft + bloqueWidth / 2;

          this.crearGrupo(significados, "significado", {
            cardWidth,
            cardHeight,
            startY,
            centerX: xSignificados,
            gapX,
            gapY,
            escalaUi,
          });
          this.crearGrupo(senias, "senia", {
            cardWidth,
            cardHeight,
            startY,
            centerX: xSenias,
            gapX,
            gapY,
            escalaUi,
          });

          this.crearHud(width, height, escalaUi, marcadorY, marcadorHeight);
          this.crearEncabezadoColumnas(
            xSignificados,
            xSenias,
            labelsY,
            escalaUi
          );

          this.scale.on("resize", () => {
            this.scene.restart();
          });
        }

        crearHud(width: number, height: number, escalaUi: number, marcadorY: number, marcadorHeight: number) {
          const azul = 0x1e78ff;
          const amarillo = 0xffd32a;
          const azulTexto = "#05215b";
          const topY = Math.max(34 * escalaUi, height * 0.09);

          const botonVolver = this.add.circle(46 * escalaUi, topY - 3 * escalaUi, 20 * escalaUi, azul);
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

          const titleWidth = Phaser.Math.Clamp(width * 0.25, 260 * escalaUi, 460 * escalaUi);
          const titleBg = this.add.graphics();
          titleBg.fillStyle(azul, 0.98);
          titleBg.fillRoundedRect(width / 2 - titleWidth / 2, 10 * escalaUi, titleWidth, 62 * escalaUi, 10 * escalaUi);

          this.add
            .text(width / 2, 41 * escalaUi, "Memoria", {
              fontSize: `${Phaser.Math.Clamp(48 * escalaUi, 36, 58)}px`,
              fontFamily,
              color: "#ffffff",
              stroke: "#d28b00",
              strokeThickness: 6 * escalaUi,
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

          this.add
            .text(width / 2, 100 * escalaUi, "Encuentra los pares", {
              fontSize: `${Phaser.Math.Clamp(30 * escalaUi, 24, 38)}px`,
              fontFamily,
              color: azulTexto,
              fontStyle: "800",
            })
            .setOrigin(0.5)
            .setStroke("#ffffff", 7 * escalaUi);

          const marcadorWidth = Phaser.Math.Clamp(width * 0.24, 210 * escalaUi, 390 * escalaUi);
          const marcadorBg = this.add.graphics();
          marcadorBg.fillStyle(amarillo, 1);
          marcadorBg.fillRoundedRect(width / 2 - marcadorWidth / 2, marcadorY, marcadorWidth, marcadorHeight, 13 * escalaUi);
          marcadorBg.lineStyle(4 * escalaUi, 0x06398a, 1);
          marcadorBg.strokeRoundedRect(width / 2 - marcadorWidth / 2, marcadorY, marcadorWidth, marcadorHeight, 13 * escalaUi);

          this.textoMarcador = this.add
            .text(width / 2, marcadorY + marcadorHeight / 2, `Pares: 0/${this.totalPares}`, {
              fontSize: `${Phaser.Math.Clamp(28 * escalaUi, 22, 34)}px`,
              fontFamily,
              color: "#003895",
              fontStyle: "800",
            })
            .setOrigin(0.5);
        }

        crearEncabezadoColumnas(xSignificados: number, xSenias: number, y: number, escalaUi: number) {
          const crearEtiqueta = (x: number, texto: string) => {
            const widthEtiqueta = 176 * escalaUi;
            const heightEtiqueta = 36 * escalaUi;
            const bg = this.add.graphics();
            bg.fillStyle(0xffd32a, 1);
            bg.fillRoundedRect(x - widthEtiqueta / 2, y - heightEtiqueta / 2, widthEtiqueta, heightEtiqueta, 12 * escalaUi);
            bg.lineStyle(3 * escalaUi, 0x06398a, 1);
            bg.strokeRoundedRect(x - widthEtiqueta / 2, y - heightEtiqueta / 2, widthEtiqueta, heightEtiqueta, 12 * escalaUi);

            this.add
              .text(x, y, texto, {
                fontSize: `${Phaser.Math.Clamp(19 * escalaUi, 16, 24)}px`,
                fontFamily,
                color: "#003895",
                fontStyle: "800",
              })
              .setOrigin(0.5);
          };

          crearEtiqueta(xSignificados, "SIGNIFICADOS");
          crearEtiqueta(xSenias, "SEÑAS");
        }

        crearGrupo(items: string[], tipo: string, layout: GridLayout) {
          const columnas = 4;
          const bloqueWidth = layout.cardWidth * columnas + layout.gapX * (columnas - 1);
          const startX = layout.centerX - bloqueWidth / 2 + layout.cardWidth / 2;

          items.forEach((item, index) => {
            if (!item) return;

            const columna = index % columnas;
            const fila = Math.floor(index / columnas);
            const x = startX + columna * (layout.cardWidth + layout.gapX);
            const y = layout.startY + fila * (layout.cardHeight + layout.gapY);
            const carta = this.add.container(x, y);
            carta.setSize(layout.cardWidth, layout.cardHeight);
            carta.setInteractive();

            const fondoObj = this.add.image(0, 0, "fondoFicha").setDisplaySize(layout.cardWidth, layout.cardHeight);
            let contenidoVisible: CardContent;

            if (tipo === "senia") {
              const elementoImg = document.createElement("img");
              elementoImg.style.width = `${Math.round(layout.cardWidth * 0.86)}px`;
              elementoImg.style.height = `${Math.round(layout.cardHeight * 0.78)}px`;
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
                  fontSize: `${Math.max(18, 24 * layout.escalaUi)}px`,
                  fontFamily,
                  color: "#003895",
                  backgroundColor: "#ffffff",
                  padding: { x: 10, y: 6 },
                  wordWrap: { width: layout.cardWidth * 0.9 },
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
            duration: 150,
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
              this.time.delayedCall(500, () => {
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
                  this.scene.start("PantallaFin");
                } else {
                  this.resetSeleccion();
                }
              });
            } else {
              this.time.delayedCall(1000, () => {
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
            duration: 150,
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
              fontSize: `${26 * escalaUi}px`,
              fontFamily,
              color: "#003895",
              align: "center",
              fontStyle: "bold",
            })
            .setOrigin(0.5);

          const botonFinal = this.add
            .text(width / 2, height / 2 + 48 * escalaUi, "Guardando...", {
              fontSize: `${20 * escalaUi}px`,
              fontFamily,
              color: "#ffffff",
              backgroundColor: "#7f8c8d",
              padding: { x: 22, y: 8 },
            })
            .setOrigin(0.5);

          const guardarResultado = () => {
            resultadoGuardado = true;
            completeGame("memoria", 0, origin)
              .then((resultado) => {
                resultadoTexto.setText(
                  `¡Partida terminada!\nGanaste ${resultado.pointsAwarded} puntos.`,
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

  return <div ref={gameRef} style={{ width: "100%", height: "100%" }} />;
}
