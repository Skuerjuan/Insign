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
    let nombrePalabra = rutaArchivo.replace(/^\.\//, "").replace(/\.gif$/, "");
    if (nombrePalabra === "Chau") {
      nombrePalabra = "Chau"; 
    }
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

interface JuegoMemoriaProps {
  palabras?: string[]; 
  onParAdivinado?: (actuales: number) => void; 
}

export default function JuegoMemoria({ palabras, onParAdivinado }: JuegoMemoriaProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    import("phaser").then((Phaser) => {
      if (!gameRef.current || gameInstanceRef.current) return;

      type CardBack = InstanceType<typeof Phaser.GameObjects.Image>;
      type CardContent =
        | InstanceType<typeof Phaser.GameObjects.DOMElement>
        | InstanceType<typeof Phaser.GameObjects.Text>;
      type SelectedCard = {
        carta: InstanceType<typeof Phaser.GameObjects.Container>;
        fondoObj: CardBack;
        contenidoVisible: CardContent;
      };
      
      // =======================================================
      // 1. ESCENA DEL JUEGO PRINCIPAL
      // =======================================================
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
          this.load.image('fondoFicha', fondoCartas.src);
          this.load.image('fondoPantalla', fondo.src);
        }

        create() {
          const { width, height } = this.scale;

          const background = this.add.image(0, 0, 'fondoPantalla').setOrigin(0, 0);
          background.setDisplaySize(width, height);

          this.primeraCarta = null;
          this.segundaCarta = null;
          this.bloqueado = false;
          this.aciertos = 0;

          const mazoBase = palabrasd.length > 0 
            ? palabrasd 
            : ["Hola", "Adiós", "Gracias", "Bien", "Mal", "Por favor", "Mamá", "Ayuda"]; 
          const pares = palabras && palabras.length > 0 ? palabras : mazoBase;
          this.totalPares = pares.length; 

          const columnaSenias = Phaser.Utils.Array.Shuffle([...pares]);
          const columnaSignificados = Phaser.Utils.Array.Shuffle([...pares]);

          const mitadMazo = Math.ceil(pares.length / 2);

          const seniasCol1 = columnaSenias.slice(0, mitadMazo);
          const seniasCol2 = columnaSenias.slice(mitadMazo, pares.length);

          const significadosCol1 = columnaSignificados.slice(0, mitadMazo);
          const significadosCol2 = columnaSignificados.slice(mitadMazo, pares.length);

          const posXSenias1 = width / 2 + 380;
          const posXSenias2 = width / 2  + 140;
          const posXSignificados1 = width / 2 - 140;
          const posXSignificados2 = width / 2 - 380;

          this.crearColumna(seniasCol1, posXSenias1, "seña");
          this.crearColumna(seniasCol2, posXSenias2, "seña");
          this.crearColumna(significadosCol1, posXSignificados1, "significado");
          this.crearColumna(significadosCol2, posXSignificados2, "significado");
          
          this.add.text(width / 2, height * 0.06, "Relacioná la Seña con su Significado", { 
              fontSize: "28px", 
              fontFamily: "var(--font-baloo), Arial, sans-serif", 
              color: "#ffffff",
              backgroundColor: "#0042AD", 
              padding: { x: 1280, y: 20 },
          }).setOrigin(0.5, 0.6);

          this.textoMarcador = this.add.text(width / 2, height * 0.12, `Pares encontrados: 0 de ${this.totalPares}`, {
            fontSize: "22px",
            fontFamily: "var(--font-baloo), Arial, sans-serif",
            color: "#ffffff",
            backgroundColor: "#2ed573", 
            padding: { x: 25, y: 8 },
          }).setOrigin(0.5);

          this.add.text((posXSenias1 + posXSenias2) / 2, height * 0.18, "SEÑAS", {
              fontSize: "20px",
              fontFamily: "var(--font-baloo), Arial, sans-serif",
              color: "#0042AD",
              backgroundColor: "#ffd32a", 
              padding: { x: 20, y: 6 },
          }).setOrigin(0.5, 1);

          this.add.text((posXSignificados1 + posXSignificados2) / 2, height * 0.18, "SIGNIFICADOS", {
              fontSize: "20px",
              fontFamily: "var(--font-baloo), Arial, sans-serif",
              color: "#0042AD",
              backgroundColor: "#ffd32a", 
              padding: { x: 20, y: 6 },
          }).setOrigin(0.5, 1);

          this.scale.on('resize', (gameSize: { width: number; height: number }) => {
            background.setDisplaySize(gameSize.width, gameSize.height);
            if (this.textoMarcador) {
              this.textoMarcador.setPosition(gameSize.width / 2, gameSize.height * 0.12);
            }
          });
        }

        crearColumna(items: string[], x: number, tipo: string) {
          const { height } = this.scale;
          const startY = height * 0.26; 

          items.forEach((item, index) => {
            if (!item) return; 

            const y = startY + index * 135; 
            
            const carta = this.add.container(x, y);
            carta.setSize(160, 125);
            carta.setInteractive();

            const fondoObj = this.add.image(0, 0, 'fondoFicha').setDisplaySize(160, 125);
            let contenidoVisible: CardContent;

            if (tipo === "seña") {
              const elementoImg = document.createElement('img');
              elementoImg.style.width = '140px';
              elementoImg.style.height = '110px';
              elementoImg.style.objectFit = 'contain';
              elementoImg.style.borderRadius = '8px';
              elementoImg.style.pointerEvents = 'none';

              const archivoImportado = diccionarioGifs[item];
              if (archivoImportado) {
                const src = typeof archivoImportado === "string" ? archivoImportado : archivoImportado.src;
                elementoImg.src = `${src}?v=${Date.now()}-${Math.random()}`;
              }
              contenidoVisible = this.add.dom(0, 0, elementoImg);
            } else {
              contenidoVisible = this.add.text(0, 0, item, { 
                fontSize: "20px", 
                fontFamily: "var(--font-baloo), Arial, sans-serif",
                color: "#000000",
                backgroundColor: "#ffffff",
                padding: { x: 10, y: 6 }
              }).setOrigin(0.5);
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

          // === VALIDACIÓN: Evitar elegir dos del mismo tipo ===
          if (this.primeraCarta) {
            const tipoPrimera = this.primeraCarta.carta.getData("tipo");
            const tipoActual = carta.getData("tipo");
            
            if (tipoPrimera === tipoActual) {
              // Si intenta clickear otra del mismo tipo, no hace nada
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
            onComplete: () => this.verificarPar(carta, fondoObj, contenidoVisible)
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

            // Ya no hace falta verificar (tipo1 !== tipo2) aquí porque la validación anterior lo asegura
            if (valor1 === valor2) {
              this.time.delayedCall(500, () => {
                if (!this.primeraCarta || !this.segundaCarta) return;

                this.primeraCarta.fondoObj.setTint(0x00ff00); 
                this.segundaCarta.fondoObj.setTint(0x00ff00);
                
                this.aciertos++;
                
                if (this.textoMarcador) {
                  this.textoMarcador.setText(`Pares encontrados: ${this.aciertos} de ${this.totalPares}`);
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
            }
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

          this.cameras.main.setBackgroundColor("#2ed573");

          this.add.text(width / 2, height / 2 - 40, "¡Excelente Trabajo!\nCompletaste el juego.", {
            fontSize: "36px",
            fontFamily: "var(--font-baloo), Arial, sans-serif",
            color: "#ffffff",
            align: "center"
          }).setOrigin(0.5);

          const botonFinal = this.add.text(width / 2, height / 2 + 80, " Volver a inicio ", {
            fontSize: "22px",
            fontFamily: "Arial, sans-serif",
            color: "#ffffff",
            backgroundColor: "#ff4757", 
            padding: { x: 20, y: 10 }
          }).setOrigin(0.5);

          botonFinal.setInteractive({ useHandCursor: true });

          botonFinal.on("pointerdown", () => {
            this.scene.start("page");
          });
        }
      }

      const config: ConstructorParameters<typeof Phaser.Game>[0] = {
        type: Phaser.AUTO,
        dom: {
          createContainer: true
        },
        scale: {
          mode: Phaser.Scale.RESIZE, 
          parent: gameRef.current!,
          width: '100%',
          height: '100%'
        },
        backgroundColor: "#87CEEB", 
        scene: [MemoryScene, PantallaFin] 
      };

      const game = new Phaser.Game(config);
      gameInstanceRef.current = game;
    });

    return () => {
      const game = gameInstanceRef.current;
      if (game) {
        game.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, [palabras, onParAdivinado]);

  return <div ref={gameRef} style={{ width: '100%', height: '100%' }} />;
}
