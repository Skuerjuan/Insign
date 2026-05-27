"use client";

import { useEffect, useRef } from "react";
import fondoCartas from "./fondo.png"; 
import fondo from "./fondoP.png";

interface JuegoMemoriaProps {
  palabras?: string[]; 
  onParAdivinado: (actuales: number) => void; 
}

export default function JuegoMemoria({ palabras, onParAdivinado }: JuegoMemoriaProps) {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("phaser").then((Phaser) => {
      
      class MemoryScene extends Phaser.Scene {
        private primeraCarta: any = null;
        private segundaCarta: any = null;
        private bloqueado: boolean = false;
        private aciertos: number = 0;

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

          const pares = palabras && palabras.length > 0 
            ? palabras 
            : ["Hola", "Adiós", "Casa", "Dónde", "Gracias", "Por favor", "Mamá", "Papá", "Ayuda", "Bien"];
          
          const columnaSenias = Phaser.Utils.Array.Shuffle([...pares]);
          const columnaSignificados = Phaser.Utils.Array.Shuffle([...pares]);

          const seniasCol1 = columnaSenias.slice(0, 5);
          const seniasCol2 = columnaSenias.slice(5, 10);

          const significadosCol1 = columnaSignificados.slice(0, 5);
          const significadosCol2 = columnaSignificados.slice(5, 10);

          const posXSenias1 = width / 2 - 380;
          const posXSenias2 = width / 2 - 140;
          const posXSignificados1 = width / 2 + 140;
          const posXSignificados2 = width / 2 + 380;

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
            const y = startY + index * 105; 
            
            const carta = this.add.container(x, y);
            carta.setSize(120, 95);
            carta.setInteractive();

            const fondoObj = this.add.image(0, 0, 'fondoFicha').setDisplaySize(120, 95);

            const texto = this.add.text(0, 0, item, { 
              fontSize: "18px", 
              fontFamily: "var(--font-baloo), Arial, sans-serif",
              color: "#000000",
              backgroundColor: "#ffffff",
              padding: { x: 8, y: 4 }
            }).setOrigin(0.5);
            texto.setVisible(false); 

            carta.add([fondoObj, texto]);
            carta.setData("valor", item);
            carta.setData("tipo", tipo);
            carta.setData("volteada", false);

            carta.on("pointerdown", () => this.voltearCarta(carta, fondoObj, texto));
          });
        }

        voltearCarta(carta: Phaser.GameObjects.Container, fondoObj: any, texto: any) {
          if (this.bloqueado || carta.getData("volteada")) return;

          this.tweens.add({
            targets: carta,
            scaleX: 0,
            duration: 150,
            yoyo: true,
            onYoyo: () => {
              texto.setVisible(true);
              carta.setData("volteada", true);
            },
            onComplete: () => this.verificarPar(carta, fondoObj, texto)
          });
        }

        verificarPar(carta: Phaser.GameObjects.Container, fondoObj: any, texto: any) {
          if (!this.primeraCarta) {
            this.primeraCarta = { carta, fondoObj, texto };
          } else {
            this.segundaCarta = { carta, fondoObj, texto };
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
                onParAdivinado(this.aciertos);

                this.resetSeleccion();
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
              obj.texto.setVisible(false);
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

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        scale: {
          mode: Phaser.Scale.RESIZE, 
          parent: gameRef.current!,
          width: '100%',
          height: '100%'
        },
        backgroundColor: "#87CEEB", 
        scene: MemoryScene 
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