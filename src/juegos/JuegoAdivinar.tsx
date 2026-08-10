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

interface JuegoAdivinarProps {
  palabras?: string[];
  onRondaGanada?: (actuales: number) => void;
  userName?: string;
}

export default function JuegoAdivinar({ palabras, onRondaGanada, userName = "user" }: JuegoAdivinarProps) {
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

      class AdivinarScene extends Phaser.Scene {
        private palabraObjetivo = "";
        private opciones: string[] = [];
        private aciertos = 0;
        private intentosFallidos = 0; 
        private bloqueado = false;
        private mazoJuego: string[] = [];
        private palabrasUsadas: string[] = [];

        private textoMarcador: Phaser.GameObjects.Text | null = null;
        private textoVidas: Phaser.GameObjects.Text | null = null;

        constructor() {
          super("AdivinarScene");
        }

        init(data: { aciertos?: number; palabrasUsadas?: string[] }) {
          this.aciertos = data.aciertos || 0;
          this.palabrasUsadas = data.palabrasUsadas || [];
          this.intentosFallidos = 0; 
          this.bloqueado = false;
        }

        preload() {
          this.load.image("fondoFicha", fondoCartas.src);
          this.load.image("fondoPantalla", fondo.src);
        }

        create() {
          const { width, height } = this.scale;
          const escalaUi = Phaser.Math.Clamp(Math.min(width / 500, height / 360), 0.75, 1.15);

          const background = this.add.image(0, 0, "fondoPantalla").setOrigin(0, 0);
          background.setDisplaySize(width, height);

          const mazoBase = palabrasd.length >= 6
            ? palabrasd
            : ["Hola", "Chau", "Gracias", "Bien", "Mal", "Por favor", "Mamá", "Ayuda"];
          this.mazoJuego = palabras && palabras.length >= 6 ? palabras : mazoBase;

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

          const titleWidth = Phaser.Math.Clamp(width * 0.25, 240 * escalaUi, 380 * escalaUi);
          const titleBg = this.add.graphics();
          titleBg.fillStyle(azul, 0.98);
          titleBg.fillRoundedRect(width / 2 - titleWidth / 2, 10 * escalaUi, titleWidth, 52 * escalaUi, 10 * escalaUi);

          this.add
            .text(width / 2, 36 * escalaUi, "Elección", {
              fontSize: `${Phaser.Math.Clamp(40 * escalaUi, 30, 48)}px`,
              fontFamily,
              color: "#ffffff",
              stroke: "#d28b00",
              strokeThickness: 5 * escalaUi,
              fontStyle: "800",
            })
            .setOrigin(0.5);

          const puntosTexto = `${userName} puntos`;
          const scoreWidth = Phaser.Math.Clamp(100 * escalaUi + puntosTexto.length * 7 * escalaUi, 140 * escalaUi, 280 * escalaUi);
          const scoreX = width - scoreWidth - 38 * escalaUi;
          const scoreBg = this.add.graphics();
          scoreBg.fillStyle(0xffe174, 1);
          scoreBg.fillRoundedRect(scoreX, 12 * escalaUi, scoreWidth, 42 * escalaUi, 21 * escalaUi);
          scoreBg.lineStyle(3 * escalaUi, 0xf7b928, 1);
          scoreBg.strokeRoundedRect(scoreX, 12 * escalaUi, scoreWidth, 42 * escalaUi, 21 * escalaUi);
          this.add.star(scoreX + 22 * escalaUi, 33 * escalaUi, 5, 9 * escalaUi, 18 * escalaUi, amarillo);
          this.add
            .text(scoreX + 46 * escalaUi, 33 * escalaUi, puntosTexto, {
              fontSize: `${Phaser.Math.Clamp(18 * escalaUi, 14, 22)}px`,
              fontFamily,
              color: azulTexto,
              fontStyle: "800",
            })
            .setOrigin(0, 0.5);

          this.add
            .text(width / 2, 105 * escalaUi, "Adivina esta seña", {
              fontSize: `${Phaser.Math.Clamp(24 * escalaUi, 18, 28)}px`,
              fontFamily,
              color: "#ffffff",
              fontStyle: "800",
            })
            .setOrigin(0.5)
            .setStroke("#0042AD", 5 * escalaUi);

          this.textoMarcador = this.add.text(35 * escalaUi, height - 30 * escalaUi, `Aciertos: ${this.aciertos}/5`, {
            fontSize: `${Phaser.Math.Clamp(16 * escalaUi, 13, 20)}px`,
            fontFamily,
            color: "#ffffff",
            backgroundColor: "#2ed573",
            padding: { x: 10, y: 4 },
          }).setOrigin(0, 0.5);
          this.textoMarcador.setStroke("#0042AD", 4 * escalaUi);

          this.textoVidas = this.add.text(width - 35 * escalaUi, height - 30 * escalaUi, `Intentos: ${3 - this.intentosFallidos} ❤️`, {
            fontSize: `${Phaser.Math.Clamp(16 * escalaUi, 13, 20)}px`,
            fontFamily,
            color: "#ffffff",
            backgroundColor: "#ff4757",
            padding: { x: 10, y: 4 },
          }).setOrigin(1, 0.5);
          this.textoVidas.setStroke("#0042AD", 4 * escalaUi);
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

          const distractores = this.mazoJuego.filter(p => p !== this.palabraObjetivo);
          const distractoresMezclados = Phaser.Utils.Array.Shuffle([...distractores]).slice(0, 5);

          this.opciones = Phaser.Utils.Array.Shuffle([this.palabraObjetivo, ...distractoresMezclados]);

          this.dibujarPanelGifPrincipal(width, height, escalaUi);
          this.dibujarBotoneraColumnas(width, height, escalaUi);
        }

        dibujarPanelGifPrincipal(width: number, height: number, escalaUi: number) {
          const panelWidth = Phaser.Math.Clamp(width * 0.32, 210 * escalaUi, 300 * escalaUi);
          const panelHeight = panelWidth * 0.70;
          const centroX = width / 2;
          const centroY = height * 0.42;

          const elementoImg = document.createElement("img");
          elementoImg.style.width = `${Math.round(panelWidth)}px`;
          elementoImg.style.height = `${Math.round(panelHeight)}px`;
          elementoImg.style.objectFit = "contain";
          elementoImg.style.borderRadius = "12px";
          elementoImg.style.pointerEvents = "none";

          const archivoImportado = diccionarioGifs[this.palabraObjetivo];
          if (archivoImportado) {
            const src = typeof archivoImportado === "string" ? archivoImportado : archivoImportado.src;
            elementoImg.src = `${src}?v=${Date.now()}-${Math.random()}`;
          }

          this.add.dom(centroX, centroY, elementoImg);
        }

        dibujarBotoneraColumnas(width: number, height: number, escalaUi: number) {
          const botonWidth = Phaser.Math.Clamp(width * 0.26, 160 * escalaUi, 260 * escalaUi);
          const botonHeight = 65 * escalaUi;
          
          const centroX = width / 2;
          const inicioY = height * 0.67; 
          
          const difX = botonWidth + (28 * escalaUi); 
          const difY = botonHeight + (20 * escalaUi); 

          const posiciones = [
            { x: centroX - difX, y: inicioY }, 
            { x: centroX,        y: inicioY }, 
            { x: centroX + difX, y: inicioY },
            
            { x: centroX - difX, y: inicioY + difY }, 
            { x: centroX,        y: inicioY + difY }, 
            { x: centroX + difX, y: inicioY + difY }
          ];

          this.opciones.forEach((palabraOpcion, index) => {
            if (index >= posiciones.length) return;
            const pos = posiciones[index];

            const contenedorBoton = this.add.container(pos.x, pos.y);
            contenedorBoton.setSize(botonWidth, botonHeight);
            contenedorBoton.setInteractive({ useHandCursor: true });

            const backgroundBoton = this.add.graphics();
            backgroundBoton.fillStyle(0xffd32a, 1);
            backgroundBoton.fillRoundedRect(-botonWidth / 2, -botonHeight / 2, botonWidth, botonHeight, 18 * escalaUi);

            const textoBoton = this.add.text(0, 0, palabraOpcion, {
              fontSize: `${Phaser.Math.Clamp(22 * escalaUi, 16, 26)}px`,
              fontFamily,
              color: "#05215b",
              fontStyle: "800",
              align: "center"
            }).setOrigin(0.5);

            contenedorBoton.add([backgroundBoton, textoBoton]);
            contenedorBoton.setData("valor", palabraOpcion);

            contenedorBoton.on("pointerdown", () => 
              this.validarRespuesta(contenedorBoton, backgroundBoton, botonWidth, botonHeight, escalaUi)
            );
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

        validarRespuesta(
          contenedor: Phaser.GameObjects.Container, 
          graficoBg: Phaser.Graphics, 
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
            graficoBg.fillRoundedRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, 14 * escalaUi);
            
            this.tweens.add({
              targets: contenedor,
              scaleX: 1.15,
              scaleY: 1.15,
              duration: 100,
              yoyo: true,
              ease: "Quad.easeOut"
            });

            this.lanzarConfeti(contenedor.x, contenedor.y, escalaUi);

            this.aciertos++;
            if (this.textoMarcador) this.textoMarcador.setText(`Aciertos: ${this.aciertos}/5`);

            if (typeof onRondaGanada === "function") {
              onRondaGanada(this.aciertos);
            }

            this.time.delayedCall(3500, () => {
              if (this.aciertos >= 5) {
                window.history.back();
              } else {
                this.scene.restart({ aciertos: this.aciertos, palabrasUsadas: this.palabrasUsadas });
              }
            });

          } else {
            graficoBg.clear();
            graficoBg.fillStyle(0xff4757, 1);
            graficoBg.fillRoundedRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, 14 * escalaUi);
            
            this.intentosFallidos++;
            if (this.textoVidas) {
              this.textoVidas.setText(`Intentos: ${Math.max(0, 3 - this.intentosFallidos)} ❤️`);
            }

            this.tweens.add({
              targets: contenedor,
              x: contenedor.x + 8,
              duration: 50,
              yoyo: true,
              repeat: 2,
              onComplete: () => {
                graficoBg.clear();
                graficoBg.fillStyle(0xffd32a, 1);
                graficoBg.fillRoundedRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, 14 * escalaUi);

                if (this.intentosFallidos >= 3) {
                  this.time.delayedCall(400, () => {
                    this.scene.restart({ aciertos: 0, palabrasUsadas: [] });
                  });
                } else {
                  this.bloqueado = false;
                }
              }
            });
          }
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
        scene: [AdivinarScene],
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
  }, [palabras, onRondaGanada, userName]);

  return <div ref={gameRef} style={{ width: "100%", height: "100%" }} />;
}