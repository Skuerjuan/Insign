"use client";

import { useEffect, useRef } from "react";
import fondoCartas from "./fondo.png"; 
import fondo from "./fondoP.png";

export default function JuegoMemoria() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("phaser").then((Phaser) => {
      
      class MemoryScene extends Phaser.Scene {
        private primeraCarta: any = null;
        private segundaCarta: any = null;
        private bloqueado: boolean = false;

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

          const pares = ["Perro", "Gato", "Casa", "Mamá"];
          const columnaSenias = Phaser.Utils.Array.Shuffle([...pares]);
          const columnaSignificados = Phaser.Utils.Array.Shuffle([...pares]);

          this.crearColumna(columnaSenias, width / 2 - 180, "seña");
          this.crearColumna(columnaSignificados, width / 2 + 180, "significado");
          
          this.add.text(width / 2, height * 0.1, "Relacioná la Seña con su Significado", { 
              fontSize: "28px", 
              fontFamily: "Arial, sans-serif", 
              color: "#ffffff",
              backgroundColor: "#0055ff", 
              padding: { x: 15, y: 10 }
          }).setOrigin(0.5);

          this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            background.setDisplaySize(gameSize.width, gameSize.height);
          });
        }

        crearColumna(items: string[], x: number, tipo: string) {
          const { height } = this.scale;
          const startY = height * 0.3; 

          items.forEach((item, index) => {
            const y = startY + index * 120; 
            
            const carta = this.add.container(x, y);
            carta.setSize(120, 100);
            carta.setInteractive();

            const fondoObj = this.add.image(0, 0, 'fondoFicha').setDisplaySize(120, 100);

            const texto = this.add.text(0, 0, item, { 
              fontSize: "20px", 
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
  }, []);

  return <div ref={gameRef} style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 0, padding: 0, overflow: 'hidden' }} />;
}