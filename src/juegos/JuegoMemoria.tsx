"use client";

import { useEffect, useRef } from "react";
import fondoCartas from "./fondo.png"; 
import fondo from "./fondoP.png";

const diccionarioGifs: Record<string, any> = {};

try {
  const contextoGifs = require.context("../../public/gifs", false, /\.gif$/);
  
  contextoGifs.keys().forEach((rutaArchivo) => {
    const moduloGif = contextoGifs(rutaArchivo);
    let nombrePalabra = rutaArchivo.replace(/^\.\//, "").replace(/\.gif$/, "");
    if (nombrePalabra === "Chau") {
      nombrePalabra = "Chau"; 
    }
    diccionarioGifs[nombrePalabra] = moduloGif.default || moduloGif;
  });
} catch (e) {
  console.warn("No se pudo cargar la carpeta de gifs automáticamente:", e);
}

const palabrasDisponiblesAutomáticas = Object.keys(diccionarioGifs);

interface JuegoMemoriaProps {
  palabras?: string[]; 
  onParAdivinado?: (actuales: number) => void; 
}

export default function JuegoMemoria({ palabras, onParAdivinado }: JuegoMemoriaProps) {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("phaser").then((Phaser) => {
      
      // =======================================================
      // 1. ESCENA DEL JUEGO PRINCIPAL
      // =======================================================
      class MemoryScene extends Phaser.Scene {
        private primeraCarta: any = null;
        private segundaCarta: any = null;
        private bloqueado: boolean = false;
        private aciertos: number = 0;
        private totalPares: number = 0; 

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

          const mazoBase = palabrasDisponiblesAutomáticas.length > 0 
            ? palabrasDisponiblesAutomáticas 
            : ["Hola", "Adiós"]; 

          const pares = palabras && palabras.length > 0 ? palabras : mazoBase;
          this.totalPares = pares.length; // Anotamos cuántos pares hay en total

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

          this.add.text((posXSenias1 + posXSenias2) / 2, height * 0.16, "SEÑAS", {
              fontSize: "20px",
              fontFamily: "var(--font-baloo), Arial, sans-serif",
              color: "#0042AD",
              backgroundColor: "#ffd32a", 
              padding: { x: 20, y: 6 },
          }).setOrigin(0.5, 1);

          this.add.text((posXSignificados1 + posXSignificados2) / 2, height * 0.16, "SIGNIFICADOS", {
              fontSize: "20px",
              fontFamily: "var(--font-baloo), Arial, sans-serif",
              color: "#0042AD",
              backgroundColor: "#ffd32a", 
              padding: { x: 20, y: 6 },
          }).setOrigin(0.5, 1);

          this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            background.setDisplaySize(gameSize.width, gameSize.height);
          });
        }

        crearColumna(items: string[], x: number, tipo: string) {
          const { height } = this.scale;
          const startY = height * 0.24; 

          items.forEach((item, index) => {
            if (!item) return; 

            const y = startY + index * 135; 
            
            const carta = this.add.container(x, y);
            carta.setSize(160, 125);
            carta.setInteractive();

            const fondoObj = this.add.image(0, 0, 'fondoFicha').setDisplaySize(160, 125);
            let contenidoVisible: any;

            if (tipo === "seña") {
              const elementoImg = document.createElement('img');
              elementoImg.style.width = '140px';
              elementoImg.style.height = '110px';
              elementoImg.style.objectFit = 'contain';
              elementoImg.style.borderRadius = '8px';
              elementoImg.style.pointerEvents = 'none';

              const archivoImportado = diccionarioGifs[item];
              if (archivoImportado) {
                elementoImg.src = `${archivoImportado.src}?v=${Date.now()}-${Math.random()}`;
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

        voltearCarta(carta: Phaser.GameObjects.Container, fondoObj: any, contenidoVisible: any) {
          if (this.bloqueado || carta.getData("volteada")) return;

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

        verificarPar(carta: Phaser.GameObjects.Container, fondoObj: any, contenidoVisible: any) {
          if (!this.primeraCarta) {
            this.primeraCarta = { carta, fondoObj, contenidoVisible };
          } else {
            this.segundaCarta = { carta, fondoObj, contenidoVisible };
            this.bloqueado = true; 

            const valor1 = this.primeraCarta.carta.getData("valor");
            const valor2 = this.segundaCarta.carta.getData("valor");
            const tipo1 = this.primeraCarta.carta.getData("tipo");
            const tipo2 = this.segundaCarta.carta.getData("tipo");

            if (valor1 === valor2 && tipo1 !== tipo2) {
              this.time.delayedCall(500, () => {
                this.primeraCarta.fondoObj.setTint(0x00ff00); 
                this.segundaCarta.fondoObj.setTint(0x00ff00);
                
                this.aciertos++;
                
                if (typeof onParAdivinado === "function") {
                  onParAdivinado(this.aciertos);
                }

                // CONDICIÓN DE VICTORIA: Si encontramos todos los pares...
                if (this.aciertos === this.totalPares) {
                  // Viajamos a la escena de fin de juego
                  this.scene.start("PantallaFin");
                } else {
                  this.resetSeleccion();
                }
              });
            } else {
              this.time.delayedCall(1000, () => {
                this.ocultarCarta(this.primeraCarta);
                this.ocultarCarta(this.segundaCarta);
                this.resetSeleccion();
              });
            }
          }
        }

        ocultarCarta(obj: any) {
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

      // =======================================================
      // 2. NUEVA ESCENA SIMPLE: PANTALLA DE FIN DE JUEGO
      // =======================================================
      class PantallaFin extends Phaser.Scene {
        constructor() {
          super("PantallaFin"); // El nombre de identificación de esta pantalla
        }

        create() {
          const { width, height } = this.scale;

          // Pintamos el fondo de un color verde lindo
          this.cameras.main.setBackgroundColor("#2ed573");

          // Añadimos el cartel de "¡Excelente!" centrado
          this.add.text(width / 2, height / 2 - 40, "¡Excelente Trabajo!\nCompletaste el juego.", {
            fontSize: "36px",
            fontFamily: "var(--font-baloo), Arial, sans-serif",
            color: "#ffffff",
            align: "center"
          }).setOrigin(0.5);

          // Creamos un botón simple para volver a jugar
          const botonReiniciar = this.add.text(width / 2, height / 2 + 80, " Jugar de nuevo ", {
            fontSize: "22px",
            fontFamily: "Arial, sans-serif",
            color: "#ffffff",
            backgroundColor: "#ff4757", // Fondo rojo para el botón
            padding: { x: 20, y: 10 }
          }).setOrigin(0.5);

          // Hacemos que el botón reaccione al mouse/dedo y cambie el cursor
          botonReiniciar.setInteractive({ useHandCursor: true });

          // Al hacer clic, le decimos al árbitro que apague esta pantalla y vuelva a la principal
          botonReiniciar.on("pointerdown", () => {
            this.scene.start("MemoryScene");
          });
        }
      }

      // =======================================================
      // 3. REGISTRO DE ESCENAS
      // =======================================================
      const config: Phaser.Types.Core.GameConfig = {
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
        // Añadimos la nueva escena a la lista de habitaciones permitidas del juego
        scene: [MemoryScene, PantallaFin] 
      };

      const game = new Phaser.Game(config);
      (gameRef as any).current._gameInstance = game;
    });

    return () => {
      if (gameRef.current && (gameRef as any).current._gameInstance) {
        (gameRef as any).current._gameInstance.destroy(true);
      }
    };
  }, [palabras, onParAdivinado]);

  return <div ref={gameRef} style={{ width: '100%', height: '100%' }} />;
}