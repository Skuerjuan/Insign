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

interface JuegoEleccionProps {
  palabras?: string[];
  onRondaGanada?: (actuales: number) => void;
  userName?: string;
}

export default function JuegoEleccion({ palabras, onRondaGanada, userName = "user" }: JuegoEleccionProps) {
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
        private textoMarcador: Phaser.GameObjects.Text | null = null;
        private textoVidas: Phaser.GameObjects.Text | null = null;

        constructor() {
          super("EleccionScene");
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
          const escalaUi = Phaser.Math.Clamp(Math.min(width / 500, height / 360), 0.78, 1.35);
          this.escalaUiGlobal = escalaUi;

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

          const titleWidth = Phaser.Math.Clamp(width * 0.25, 260 * escalaUi, 460 * escalaUi);
          const titleBg = this.add.graphics();
          titleBg.fillStyle(azul, 0.98);
          titleBg.fillRoundedRect(width / 2 - titleWidth / 2, 10 * escalaUi, titleWidth, 62 * escalaUi, 10 * escalaUi);

          this.add
            .text(width / 2, 41 * escalaUi, "Elección", {
              fontSize: `${Phaser.Math.Clamp(48 * escalaUi, 36, 58)}px`,
              fontFamily,
              color: "#ffffff",
              stroke: "#d28b00",
              strokeThickness: 6 * escalaUi,
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

          this.textoMarcador = this.add.text(46 * escalaUi, height - 40 * escalaUi, `Aciertos: ${this.aciertos}/5`, {
            fontSize: `${Phaser.Math.Clamp(22 * escalaUi, 16, 28)}px`,
            fontFamily,
            color: "#ffffff",
            backgroundColor: "#2ed573",
            padding: { x: 14, y: 6 },
          }).setOrigin(0, 0.5);
          this.textoMarcador.setStroke("#0042AD", 4 * escalaUi);

          this.textoVidas = this.add.text(width - 46 * escalaUi, height - 40 * escalaUi, `Intentos: ${3 - this.intentosFallidos} ❤️`, {
            fontSize: `${Phaser.Math.Clamp(22 * escalaUi, 16, 28)}px`,
            fontFamily,
            color: "#ffffff",
            backgroundColor: "#ff4757",
            padding: { x: 14, y: 6 },
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

          const azulTexto = "#05215b";
          this.textoPalabra = this.add
            .text(width / 2, 105 * escalaUi, `¿Qué seña es "${this.palabraObjetivo.toUpperCase()}"?`, {
              fontSize: `${Phaser.Math.Clamp(30 * escalaUi, 22, 36)}px`,
              fontFamily,
              color: azulTexto,
              fontStyle: "800",
            })
            .setOrigin(0.5);
          this.textoPalabra.setStroke("#ffffff", 7 * escalaUi);

          this.dibujarGrillaOpciones(width, height, escalaUi);
        }

        dibujarGrillaOpciones(width: number, height: number, escalaUi: number) {
          const inicioX = width / 2;
          const inicioY = height * 0.43;
          const separacionX = Phaser.Math.Clamp(width * 0.23, 190 * escalaUi, 280 * escalaUi);
          const separacionY = Phaser.Math.Clamp(height * 0.25, 140 * escalaUi, 195 * escalaUi);

          const posiciones = [
            { x: inicioX - separacionX, y: inicioY },
            { x: inicioX,               y: inicioY },
            { x: inicioX + separacionX, y: inicioY },
            { x: inicioX - separacionX, y: inicioY + separacionY },
            { x: inicioX,               y: inicioY + separacionY },
            { x: inicioX + separacionX, y: inicioY + separacionY }
          ];

          const baseWidth = Phaser.Math.Clamp(separacionX * 0.90, 140, 240);
          const baseHeight = baseWidth * 0.78;

          const gifWidth = Math.round(baseWidth * 0.88);
          const gifHeight = Math.round(baseHeight * 0.82);

          const cardWidth = gifWidth + 10;
          const cardHeight = gifHeight + 8;

          this.opciones.forEach((palabraOpicion, index) => {
            const pos = posiciones[index];

            const ficha = this.add.container(pos.x, pos.y);
            ficha.setSize(cardWidth, cardHeight);
            ficha.setInteractive();

            const fondoObj = this.add.image(0, 0, "fondoFicha").setDisplaySize(cardWidth, cardHeight);
            
            const elementoImg = document.createElement("img");
            elementoImg.style.width = `${gifWidth}px`;
            elementoImg.style.height = `${gifHeight}px`;
            elementoImg.style.objectFit = "contain";
            elementoImg.style.borderRadius = "8px";
            elementoImg.style.pointerEvents = "none";

            const archivoImportado = diccionarioGifs[palabraOpicion];
            if (archivoImportado) {
              const src = typeof archivoImportado === "string" ? archivoImportado : archivoImportado.src;
              elementoImg.src = `${src}?v=${Date.now()}-${Math.random()}`;
            }

            const domGif = this.add.dom(0, 0, elementoImg);
            ficha.add([fondoObj, domGif]);

            ficha.setData("valor", palabraOpicion);
            ficha.on("pointerdown", () => this.validarRespuesta(ficha, fondoObj));
          });
        }

        lanzarConfeti(origenX: number, origenY: number, escalaUi: number) {
          const colores = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502, 0xeccc68, 0xff6b81, 0x9b59b6, 0x00d2d3];
          
          for (let i = 0; i < 90; i++) {
            const color = Phaser.Utils.Array.GetRandom(colores);
            const ancho = Phaser.Math.Between(6 * escalaUi, 14 * escalaUi);
            const alto = Phaser.Math.Between(8 * escalaUi, 18 * escalaUi);
            
            const papelito = this.add.rectangle(origenX, origenY, ancho, alto, color);
            papelito.setAngle(Phaser.Math.Between(0, 360));

            const angulo = Phaser.Math.FloatBetween(-Math.PI * 1.1, 0.1); 
            const velocidad = Phaser.Math.Between(200 * escalaUi, 550 * escalaUi);
            const targetX = origenX + Math.cos(angulo) * velocidad + Phaser.Math.Between(-80, 80);
            const targetY = origenY + Math.sin(angulo) * velocidad + Phaser.Math.Between(150, 300); 

            this.tweens.add({
              targets: papelito,
              x: targetX,
              y: targetY,
              angle: papelito.angle + Phaser.Math.Between(720, 1440),
              scaleX: { from: 1, to: Phaser.Math.FloatBetween(0.2, 0.8) },
              alpha: { from: 1, to: 0 },
              duration: Phaser.Math.Between(1400, 2200),
              ease: "Cubic.easeOut",
              onComplete: () => papelito.destroy()
            });
          }
        }

        validarRespuesta(ficha: Phaser.GameObjects.Container, fondoObj: CardBack) {
          if (this.bloqueado) return;
          this.bloqueado = true;

          const respuestaSeleccionada = ficha.getData("valor");

          if (respuestaSeleccionada === this.palabraObjetivo) {
            fondoObj.setTint(0x4be06d); 
            this.aciertos++;

            this.lanzarConfeti(ficha.x, ficha.y, this.escalaUiGlobal);

            if (this.textoMarcador) {
              this.textoMarcador.setText(`Aciertos: ${this.aciertos}/5`);
            }

            if (typeof onRondaGanada === "function") {
              onRondaGanada(this.aciertos);
            }

            // Aumentado a 2.5 segundos de pausa para poder memorizar la seña seleccionada
            const tiempoEspera = this.aciertos >= 5 ? 5000 : 5000;

            this.time.delayedCall(tiempoEspera, () => {
              if (this.aciertos >= 5) {
                this.scene.start("PantallaFin");
              } else {
                this.scene.restart({ aciertos: this.aciertos, palabrasUsadas: this.palabrasUsadas });
              }
            });

          } else {
            fondoObj.setTint(0xff4757); 
            this.intentosFallidos++;

            if (this.textoVidas) {
              this.textoVidas.setText(`Intentos: ${Math.max(0, 3 - this.intentosFallidos)} ❤️`);
            }

            this.tweens.add({
              targets: ficha,
              x: ficha.x + 8,
              duration: 50,
              yoyo: true,
              repeat: 2,
              onComplete: () => {
                fondoObj.clearTint();

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

      class PantallaFin extends Phaser.Scene {
        constructor() {
          super("PantallaFin");
        }

        lanzarConfetiFinal(width: number, height: number, escalaUi: number) {
          const colores = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502, 0xeccc68, 0xff6b81, 0x9b59b6, 0x00d2d3];
          
          for (let i = 0; i < 150; i++) {
            const color = Phaser.Utils.Array.GetRandom(colores);
            const origenX = Phaser.Math.Between(width * 0.1, width * 0.9);
            const origenY = Phaser.Math.Between(height * 0.2, height * 0.5);
            const ancho = Phaser.Math.Between(6 * escalaUi, 14 * escalaUi);
            const alto = Phaser.Math.Between(8 * escalaUi, 18 * escalaUi);
            
            const papelito = this.add.rectangle(origenX, origenY, ancho, alto, color);
            papelito.setAngle(Phaser.Math.Between(0, 360));

            const angulo = Phaser.Math.FloatBetween(-Math.PI, 0); 
            const velocidad = Phaser.Math.Between(150 * escalaUi, 450 * escalaUi);
            const targetX = origenX + Math.cos(angulo) * velocidad + Phaser.Math.Between(-100, 100);
            const targetY = origenY + Math.sin(angulo) * velocidad + Phaser.Math.Between(200, 400); 

            this.tweens.add({
              targets: papelito,
              x: targetX,
              y: targetY,
              angle: papelito.angle + Phaser.Math.Between(720, 1440),
              scaleX: { from: 1, to: Phaser.Math.FloatBetween(0.2, 0.8) },
              alpha: { from: 1, to: 0 },
              duration: Phaser.Math.Between(1800, 2800),
              delay: Phaser.Math.Between(0, 500),
              ease: "Cubic.easeOut",
              onComplete: () => papelito.destroy()
            });
          }
        }

        create() {
          const { width, height } = this.scale;
          const escalaUi = Phaser.Math.Clamp(Math.min(width / 500, height / 360), 0.68, 1.25);

          this.add.image(0, 0, "fondoPantalla").setOrigin(0, 0).setDisplaySize(width, height);

          this.lanzarConfetiFinal(width, height, escalaUi);

          const panelWidth = Phaser.Math.Clamp(width * 0.68, 240 * escalaUi, 380 * escalaUi);
          const panelHeight = 150 * escalaUi;
          const panelX = width / 2 - panelWidth / 2;
          const panelY = height / 2 - panelHeight / 2;
          
          const panel = this.add.graphics();
          panel.fillStyle(0xffd32a, 1);
          panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 18 * escalaUi);
          panel.lineStyle(5 * escalaUi, 0x06398a, 1);
          panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 18 * escalaUi);

          this.add
            .text(width / 2, height / 2 - 28 * escalaUi, "¡Excelente trabajo!\nCompletaste la trivia.", {
              fontSize: `${26 * escalaUi}px`,
              fontFamily,
              color: "#003895",
              align: "center",
              fontStyle: "bold",
            })
            .setOrigin(0.5);

          const botonFinal = this.add
            .text(width / 2, height / 2 + 48 * escalaUi, "Volver", {
              fontSize: `${20 * escalaUi}px`,
              fontFamily,
              color: "#ffffff",
              backgroundColor: "#1e78ff",
              padding: { x: 22, y: 8 },
            })
            .setOrigin(0.5);

          botonFinal.setInteractive({ useHandCursor: true });
          botonFinal.on("pointerdown", () => window.history.back());
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