"use client";

import { useEffect, useRef } from "react";
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
  userName?: string;
}

export default function JuegoMemoria({ palabras, onParAdivinado, userName = "user" }: JuegoMemoriaProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    let cancelado = false;

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

          const escalaUi = Phaser.Math.Clamp(Math.min(width / 500, height / 360), 0.75, 1.3);
          this.escalaUiGlobal = escalaUi;
          const columnasPorGrupo = 4;
          const filasPorGrupo = Math.max(Math.ceil(pares.length / columnasPorGrupo), 1);
          const marcadorHeight = 48 * escalaUi;
          const marcadorY = height - marcadorHeight - 16 * escalaUi;

          // Ajustes de espacio para evitar que las etiquetas tapen las cartas
          const labelsY = Math.max(120 * escalaUi, height * 0.17);
          const gapX = Phaser.Math.Clamp(width * 0.012, 10 * escalaUi, 22 * escalaUi);
          const gapY = Phaser.Math.Clamp(height * 0.025, 14 * escalaUi, 28 * escalaUi);
          const groupGapX = Phaser.Math.Clamp(width * 0.04, 40 * escalaUi, 90 * escalaUi);
          
          const anchoDisponible = width * 0.94;
          const cardSizePorAncho = (anchoDisponible - groupGapX - gapX * (columnasPorGrupo - 1) * 2) / (columnasPorGrupo * 2);
          
          // Cálculo del límite vertical disponible
          const topLimite = labelsY + 30 * escalaUi;
          const altoDisponible = Math.max(200, marcadorY - topLimite - 15 * escalaUi);
          const cardSizePorAlto = (altoDisponible - gapY * (filasPorGrupo - 1)) / filasPorGrupo;
          
          const cardWidth = Phaser.Math.Clamp(Math.min(230 * escalaUi, cardSizePorAncho, cardSizePorAlto), 115, 230);
          const cardHeight = cardWidth;

          // Alineación vertical precisa (centro de la primera fila)
          const startY = topLimite + cardHeight / 2;

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
          const topY = Math.max(34 * escalaUi, height * 0.08);

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
          titleBg.fillRoundedRect(width / 2 - titleWidth / 2, 10 * escalaUi, titleWidth, 58 * escalaUi, 10 * escalaUi);

          this.add
            .text(width / 2, 39 * escalaUi, "Memoria", {
              fontSize: `${Phaser.Math.Clamp(44 * escalaUi, 32, 54)}px`,
              fontFamily,
              color: "#ffffff",
              stroke: "#d28b00",
              strokeThickness: 5 * escalaUi,
              fontStyle: "800",
            })
            .setOrigin(0.5);

          const puntosTexto = `${userName} puntos`;
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
            .text(width / 2, 92 * escalaUi, "Encuentra los pares", {
              fontSize: `${Phaser.Math.Clamp(28 * escalaUi, 22, 36)}px`,
              fontFamily,
              color: azulTexto,
              fontStyle: "800",
            })
            .setOrigin(0.5)
            .setStroke("#ffffff", 6 * escalaUi);

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
              elementoImg.style.width = `${Math.round(layout.cardWidth * 0.96)}px`;
              elementoImg.style.height = `${Math.round(layout.cardHeight * 0.96)}px`;
              elementoImg.style.objectFit = "contain";
              elementoImg.style.borderRadius = "12px";
              elementoImg.style.pointerEvents = "none";

              const archivoImportado = diccionarioGifs[item];
              if (archivoImportado) {
                const src = typeof archivoImportado === "string" ? archivoImportado : archivoImportado.src;
                elementoImg.src = `${src}?v=${Date.now()}-${Math.random()}`;
              }
              contenidoVisible = this.add.dom(0, 0, elementoImg);
            } else {
              // Texto sin fondo blanco plano y con borde blanco sutil para legibilidad
              contenidoVisible = this.add
                .text(0, 0, item, {
                  fontSize: `${Math.max(20, 26 * layout.escalaUi)}px`,
                  fontFamily,
                  color: "#003895",
                  stroke: "#ffffff",
                  strokeThickness: 3 * layout.escalaUi,
                  fontStyle: "800",
                  wordWrap: { width: layout.cardWidth * 0.85 },
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
          
          for (let i = 0; i < 35; i++) {
            const color = Phaser.Utils.Array.GetRandom(colores);
            const size = Phaser.Math.Between(6 * escalaUi, 12 * escalaUi);
            
            const papelito = this.add.rectangle(origenX, origenY, size, size, color);
            papelito.setAngle(Phaser.Math.Between(0, 360));

            const angulo = Phaser.Math.FloatBetween(-Math.PI, 0); 
            const velocidad = Phaser.Math.Between(150 * escalaUi, 350 * escalaUi);
            const targetX = origenX + Math.cos(angulo) * velocidad;
            const targetY = origenY + Math.sin(angulo) * velocidad + 150; 

            this.tweens.add({
              targets: papelito,
              x: targetX,
              y: targetY,
              angle: papelito.angle + Phaser.Math.Between(360, 720),
              alpha: 0,
              duration: Phaser.Math.Between(1000, 1600),
              ease: "Cubic.easeOut",
              onComplete: () => papelito.destroy()
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
              this.lanzarConfeti(this.primeraCarta.carta.x, this.primeraCarta.carta.y, this.escalaUiGlobal);
              this.lanzarConfeti(this.segundaCarta.carta.x, this.segundaCarta.carta.y, this.escalaUiGlobal);

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
                  this.time.delayedCall(7000, () => {
                    window.history.back();
                  });
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
        scene: [MemoryScene],
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
  }, [palabras, onParAdivinado, userName]);

  return <div ref={gameRef} style={{ width: "100%", height: "100%" }} />;
}