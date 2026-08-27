"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { completeGame, type GameOrigin } from "@/lib/server/profile.actions";
import PantallaSinVidas from "./Perder";
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

const normalizarTexto = (texto: string, mantenerEspacios: boolean = false) => {
  const normalizado = texto
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  
  return mantenerEspacios ? normalizado : normalizado.replace(/\s+/g, "");
};

interface JuegoCompletarProps {
  palabras?: string[];
  onRondaGanada?: (actuales: number) => void;
  onJuegoTerminado?: (puntos: number, aciertos: number) => void;
  points?: number;
  origin?: GameOrigin;
}

export default function JuegoCompletarCeldas({
  palabras,
  onRondaGanada,
  onJuegoTerminado,
  points = 0,
  origin = "menu",
}: JuegoCompletarProps) {
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
        const fontSizePx = Math.round(Phaser.Math.Clamp(20 * escalaUi, 14, 26));

        const tempText = scene.add.text(0, 0, `${textoLabel} ${icono}`, {
          fontSize: `${fontSizePx}px`,
          fontFamily,
          fontStyle: "800",
        });

        const textWidth = tempText.width;
        tempText.destroy();

        const paddingX = 16 * escalaUi;
        const width = textWidth + paddingX * 2;
        const height = 40 * escalaUi;
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
          .text(textX + mainText.width / 2 + 8 * escalaUi, 0, icono, {
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

      class CompletarScene extends Phaser.Scene {
        private palabraObjetivo = "";
        private palabraObjetivoNormalizada = "";
        private palabraObjetivoConEspacios = "";
        private aciertos = 0;
        private intentosFallidos = 0;
        private bloqueado = false;
        private mazoJuego: string[] = [];
        private palabrasUsadas: string[] = [];
        private escalaUiGlobal = 1;

        private badgeAciertos: ReturnType<typeof crearPillBadge> | null = null;
        private badgeVidas: ReturnType<typeof crearPillBadge> | null = null;
        private availableChars: { char: string; active: boolean; id: number }[] = [];
        private inputtedChars: { char: string; originalId: number }[] = [];
        private inputSlots: Phaser.GameObjects.Container[] = [];
        private keyboardTiles: Phaser.GameObjects.Container[] = [];

        constructor() {
          super("CompletarScene");
        }

        init(data: { aciertos?: number; palabrasUsadas?: string[]; intentosFallidos?: number }) {
          this.aciertos = data.aciertos || 0;
          this.palabrasUsadas = data.palabrasUsadas || [];
          this.intentosFallidos = data.intentosFallidos || 0;
          this.bloqueado = false;
          this.inputtedChars = [];
          this.inputSlots = [];
          this.keyboardTiles = [];
        }

        preload() {
          this.load.image("fondoPantalla", fondo.src);
        }

        create() {
          const { width, height } = this.scale;
          const escalaUi = Phaser.Math.Clamp(Math.min(width / 480, height / 700), 0.65, 1.15);
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
            this.scene.restart({
              aciertos: this.aciertos,
              palabrasUsadas: this.palabrasUsadas,
              intentosFallidos: this.intentosFallidos,
            });
          });

          this.input.on("pointerdown", () => {
            if (this.game.canvas) {
              this.game.canvas.focus();
            }
          });

          this.input.keyboard.on("keydown", this.alPresionarTecla, this);
        }

        crearHud(width: number, height: number, escalaUi: number) {
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
            .text(width / 2, 30 * escalaUi, "Completar", {
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

          const bottomY = height - 28 * escalaUi;
          this.badgeAciertos = crearPillBadge(
            this,
            16 * escalaUi,
            bottomY,
            `Aciertos: ${this.aciertos}/5`,
            "⭐",
            escalaUi,
            false
          );

          this.badgeVidas = crearPillBadge(
            this,
            width - 16 * escalaUi,
            bottomY,
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
          
          this.palabraObjetivoConEspacios = normalizarTexto(this.palabraObjetivo, true);
          this.palabraObjetivoNormalizada = normalizarTexto(this.palabraObjetivo, false);
          this.palabrasUsadas.push(this.palabraObjetivo);

          const isPortrait = width < height;
          const textoPregunta = this.add
            .text(width / 2, 72 * escalaUi, "Escribe la palabra correcta", {
              fontSize: `${Phaser.Math.Clamp(20 * escalaUi, 16, 26)}px`,
              fontFamily,
              color: "#05215b",
              fontStyle: "800",
            })
            .setOrigin(0.5);
          textoPregunta.setStroke("#ffffff", 4 * escalaUi);

          const gifWidth = Math.round(Phaser.Math.Clamp(width * (isPortrait ? 0.6 : 0.3), 160, 280));
          const gifHeight = Math.round(gifWidth * 0.65);
          const centroX = width / 2;
          const centroY = isPortrait ? height * 0.28 : height * 0.34;

          const elementoImg = document.createElement("img");
          elementoImg.style.width = `${gifWidth}px`;
          elementoImg.style.height = `${gifHeight}px`;
          elementoImg.style.objectFit = "cover";
          elementoImg.style.borderRadius = `${Math.round(14 * escalaUi)}px`;

          const archivoImportado = diccionarioGifs[this.palabraObjetivo];
          if (archivoImportado) {
            const src = typeof archivoImportado === "string" ? archivoImportado : archivoImportado.src;
            elementoImg.src = `${src}?v=${Date.now()}-${Math.random()}`;
          }

          this.add.dom(centroX, centroY, elementoImg);

          const cardBg = this.add.graphics();
          cardBg.lineStyle(4 * escalaUi, 0x1e78ff, 1);
          cardBg.strokeRoundedRect(centroX - gifWidth / 2, centroY - gifHeight / 2, gifWidth, gifHeight, 14 * escalaUi);

          const chars = this.palabraObjetivoNormalizada.split("");
          this.availableChars = Phaser.Utils.Array.Shuffle([...chars]).map((c, i) => ({
            char: c,
            active: true,
            id: i,
          }));

          this.crearGrillasDeLetras(width, height, escalaUi, centroY + gifHeight / 2 + 35 * escalaUi);
        }

        crearGrillasDeLetras(width: number, height: number, escalaUi: number, gapY: number) {
          const availableLength = this.availableChars.length;
          const palabraConEspacios = this.palabraObjetivoConEspacios.split("");

          const maxAvailableWidth = width * 0.92;
          let cellSize = Math.floor(maxAvailableWidth / (palabraConEspacios.length || 1));
          cellSize = Phaser.Math.Clamp(cellSize, 32, 58);
          const cellSpacing = Math.round(Math.min(6 * escalaUi, cellSize * 0.15));
          const spaceWidth = cellSize * 0.5;

          let inputGridWidth = 0;
          palabraConEspacios.forEach((char, i) => {
            inputGridWidth += char === " " ? spaceWidth : cellSize;
            if (i < palabraConEspacios.length - 1) {
              inputGridWidth += cellSpacing;
            }
          });

          let currentX = width / 2 - inputGridWidth / 2;
          let slotIndex = 0;

          palabraConEspacios.forEach((char) => {
            if (char === " ") {
              currentX += spaceWidth + cellSpacing;
            } else {
              const centerX = currentX + cellSize / 2;
              const container = this.crearCelda(
                centerX,
                gapY,
                cellSize,
                escalaUi,
                0xffffff,
                0x1e78ff,
                true,
                slotIndex,
                false
              );
              this.inputSlots.push(container);
              
              currentX += cellSize + cellSpacing;
              slotIndex++;
            }
          });

          const maxColsPerRow = Math.max(1, Math.floor(maxAvailableWidth / (cellSize + cellSpacing)));
          const rowsCount = Math.ceil(availableLength / maxColsPerRow);
          const keyboardStartY = gapY + cellSize + 20 * escalaUi;

          for (let i = 0; i < availableLength; i++) {
            const r = Math.floor(i / maxColsPerRow);
            const c = i % maxColsPerRow;
            const itemsInRow = (r === rowsCount - 1) ? (availableLength - r * maxColsPerRow) : maxColsPerRow;

            const rowWidth = itemsInRow * cellSize + (itemsInRow - 1) * cellSpacing;
            const rowStartX = width / 2 - rowWidth / 2 + cellSize / 2;

            const data = this.availableChars[i];
            const posX = rowStartX + c * (cellSize + cellSpacing);
            const posY = keyboardStartY + r * (cellSize + cellSpacing);

            const container = this.crearCelda(
              posX,
              posY,
              cellSize,
              escalaUi,
              0xffd32a,
              0xd28b00,
              true,
              i,
              true,
              data.char
            );
            this.keyboardTiles.push(container);
          }
        }

        crearCelda(
          x: number,
          y: number,
          size: number,
          escalaUi: number,
          bgColor: number,
          borderColor: number,
          interactive: boolean,
          id: number,
          isKeyboard: boolean,
          char: string = ""
        ) {
          const container = this.add.container(x, y);
          container.setSize(size, size);
          if (interactive) {
            container.setInteractive({ useHandCursor: true });
          }

          const graphics = this.add.graphics();
          const radius = Math.round(8 * escalaUi);
          graphics.fillStyle(bgColor, 1);
          graphics.fillRoundedRect(-size / 2, -size / 2, size, size, radius);
          graphics.lineStyle(Math.round(3 * escalaUi), borderColor, 1);
          graphics.strokeRoundedRect(-size / 2, -size / 2, size, size, radius);
          container.add(graphics);
          container.setData("graphics", graphics);

          const fontSizePx = Math.round(size * 0.55);
          const text = this.add
            .text(0, 0, char, {
              fontSize: `${fontSizePx}px`,
              fontFamily,
              color: "#05215b",
              fontStyle: "800",
            })
            .setOrigin(0.5);
          container.add(text);
          container.setData("text", text);

          container.setData("id", id);
          container.setData("char", char);
          container.setData("size", size);

          if (interactive) {
            if (isKeyboard) {
              container.on("pointerdown", () => this.alHacerClicEnTecla(container, id, char));
            } else {
              container.on("pointerdown", () => this.alHacerClicEnSlot(container, id));
            }
          }

          return container;
        }

        alHacerClicEnTecla(tile: Phaser.GameObjects.Container, id: number, char: string) {
          if (this.bloqueado) return;
          const data = this.availableChars[id];
          if (!data.active) return;

          const currentLen = this.inputtedChars.length;
          if (currentLen >= this.palabraObjetivoNormalizada.length) return;

          const slotText = this.inputSlots[currentLen].getData("text") as Phaser.GameObjects.Text;
          slotText.setText(char);
          this.inputtedChars.push({ char, originalId: id });

          data.active = false;
          tile.setAlpha(0.3);

          this.tweens.add({
            targets: this.inputSlots[currentLen],
            scale: { from: 0.8, to: 1 },
            duration: 120,
            ease: "Back.easeOut",
          });

          if (this.inputtedChars.length === this.palabraObjetivoNormalizada.length) {
            this.time.delayedCall(120, () => {
              this.validarRespuestaConDelay();
            });
          }
        }

        alHacerClicEnSlot(slot: Phaser.GameObjects.Container, id: number) {
          if (this.bloqueado) return;
          if (id >= this.inputtedChars.length) return;

          const originalChar = this.inputtedChars[id];
          this.inputtedChars.splice(id, 1);

          this.availableChars[originalChar.originalId].active = true;
          this.keyboardTiles[originalChar.originalId].setAlpha(1);

          this.reordenarSlots();
        }

        reordenarSlots() {
          for (let i = 0; i < this.inputSlots.length; i++) {
            const slotText = this.inputSlots[i].getData("text") as Phaser.GameObjects.Text;
            if (i < this.inputtedChars.length) {
              slotText.setText(this.inputtedChars[i].char);
            } else {
              slotText.setText("");
            }
          }
        }

        alPresionarTecla(event: KeyboardEvent) {
          if (this.bloqueado) return;

          if (event.key === "Backspace") {
            if (this.inputtedChars.length > 0) {
              const lastIndex = this.inputtedChars.length - 1;
              this.alHacerClicEnSlot(this.inputSlots[lastIndex], lastIndex);
            }
            return;
          }

          const quitarTildes = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const pressedChar = quitarTildes(event.key.toUpperCase());
          
          const matchIndex = this.availableChars.findIndex(
            (c) => c.char === pressedChar && c.active
          );

          if (matchIndex !== -1) {
            this.alHacerClicEnTecla(
              this.keyboardTiles[matchIndex],
              matchIndex,
              pressedChar
            );
          }
        }

        validarRespuestaConDelay() {
          if (this.bloqueado) return;
          this.bloqueado = true;

          const wordFormed = this.inputtedChars.map((c) => c.char).join("");

          if (wordFormed === this.palabraObjetivoNormalizada) {
            const letrasConTilde = this.palabraObjetivo.toUpperCase().replace(/\s+/g, "").split("");
            
            this.inputSlots.forEach((slot, index) => {
              const slotText = slot.getData("text") as Phaser.GameObjects.Text;
              slotText.setText(letrasConTilde[index]);
            });

            this.lanzarConfeti(this.scale.width / 2, this.scale.height * 0.5, this.escalaUiGlobal);
            this.aciertos++;

            if (this.badgeAciertos) {
              this.badgeAciertos.actualizar(`Aciertos: ${this.aciertos}/5`);
            }

            if (typeof onRondaGanada === "function") {
              onRondaGanada(this.aciertos);
            }

            this.tweens.add({
              targets: this.inputSlots,
              scale: 1.1,
              duration: 200,
              yoyo: true,
              ease: "Back.easeOut",
              onStart: () => this.setSlotsVisualFeedback(0x00ff66, true),
            });

            this.time.delayedCall(1500, () => {
              if (this.aciertos >= 5) {
                if (typeof onJuegoTerminado === "function") {
                  onJuegoTerminado(this.aciertos * 10, this.aciertos);
                } else {
                  this.scene.start("PantallaFin", { errores: this.intentosFallidos });
                }
              } else {
                this.scene.restart({
                  aciertos: this.aciertos,
                  palabrasUsadas: this.palabrasUsadas,
                  intentosFallidos: this.intentosFallidos,
                });
              }
            });
          } else {
            this.intentosFallidos++;

            if (this.badgeVidas) {
              this.badgeVidas.actualizar(`Intentos: ${Math.max(0, 3 - this.intentosFallidos)}`);
            }

            this.tweens.add({
              targets: this.inputSlots,
              x: "+=6",
              duration: 50,
              yoyo: true,
              repeat: 3,
              onStart: () => this.setSlotsVisualFeedback(0xff4757),
              onComplete: () => {
                this.inputtedChars = [];
                this.availableChars.forEach((c) => (c.active = true));
                this.keyboardTiles.forEach((tile) => tile.setAlpha(1));
                this.reordenarSlots();
                this.setSlotsVisualFeedback(0x1e78ff, false, 0xffffff);

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

        setSlotsVisualFeedback(color: number, isWin: boolean = false, bgColor: number = isWin ? 0xe8fae8 : 0xffffff) {
          this.inputSlots.forEach((slot) => {
            const graphics = slot.getData("graphics") as Phaser.GameObjects.Graphics;
            const size = slot.getData("size") as number;
            const radius = Math.round(8 * this.escalaUiGlobal);
            graphics.clear();
            graphics.fillStyle(bgColor, 1);
            graphics.fillRoundedRect(-size / 2, -size / 2, size, size, radius);
            graphics.lineStyle(Math.round(3 * this.escalaUiGlobal), color, 1);
            graphics.strokeRoundedRect(-size / 2, -size / 2, size, size, radius);
          });
        }

        lanzarConfeti(origenX: number, origenY: number, escalaUi: number) {
          const colores = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502, 0xeccc68, 0xff6b81];

          for (let i = 0; i < 50; i++) {
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
              duration: Phaser.Math.Between(1000, 1600),
              ease: "Cubic.easeOut",
              onComplete: () => papelito.destroy(),
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
            completeGame("completar", this.errores, origin)
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
        scene: [CompletarScene, PantallaFin],
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
  }, [palabras, onRondaGanada, onJuegoTerminado, points, origin, router]);

  return (
    <div className="relative w-full h-full overflow-hidden">
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