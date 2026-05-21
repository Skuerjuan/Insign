"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

class MemoryScene extends Phaser.Scene {
  private primeraCarta: any;
  private segundaCarta: any;
  private bloqueado: boolean;

  constructor() {
    super("MemoryScene");
    this.primeraCarta = null;
    this.segundaCarta = null;
    this.bloqueado = false;
  }

  preload() {
    // this.load.image('fondoFicha', '/fondo-ficha.png');
    this.load.image('')
  }

  create() {
    this.primeraCarta = null;
    this.segundaCarta = null;
    this.bloqueado = false;

    const pares = ["Perro", "Gato", "Casa", "Mamá"];

    const columnaSenias = Phaser.Utils.Array.Shuffle([...pares]);
    const columnaSignificados = Phaser.Utils.Array.Shuffle([...pares]);

    this.crearColumna(columnaSenias, 250, "seña");
    this.crearColumna(columnaSignificados, 550, "significado");
    
    this.add.text(400, 50, "Relacioná la Seña con su Significado", { 
        fontSize: "24px", color: "#ffffff" 
    }).setOrigin(0.5);
  }

  crearColumna(items: string[], x: number, tipo: string) {
    items.forEach((item, index) => {
      const y = 150 + index * 120; 

      const carta = this.add.container(x, y);
      carta.setSize(120, 100);
      carta.setInteractive();

      // Fondo por defecto
      const fondo = this.add.rectangle(0, 0, 120, 100, 0x4a90e2);
      
      const texto = this.add.text(0, 0, item, { 
          fontSize: "20px", color: "#000000" 
      }).setOrigin(0.5);
      texto.setVisible(false); 

      carta.add([fondo, texto]);

      carta.setData("valor", item);
      carta.setData("tipo", tipo);
      carta.setData("volteada", false);

      carta.on("pointerdown", () => this.voltearCarta(carta, fondo, texto));
    });
  }

  voltearCarta(carta: Phaser.GameObjects.Container, fondo: any, texto: any) {
    if (this.bloqueado || carta.getData("volteada")) return;

    this.tweens.add({
      targets: carta,
      scaleX: 0,
      duration: 150,
      yoyo: true,
      onYoyo: () => {
        fondo.fillColor = 0xffffff; 
        texto.setVisible(true);
        carta.setData("volteada", true);
      },
      onComplete: () => this.verificarPar(carta, fondo, texto)
    });
  }

  verificarPar(carta: Phaser.GameObjects.Container, fondo: any, texto: any) {
    if (!this.primeraCarta) {
      this.primeraCarta = { carta, fondo, texto };
    } else {
      this.segundaCarta = { carta, fondo, texto };
      this.bloqueado = true; 

      const valor1 = this.primeraCarta.carta.getData("valor");
      const valor2 = this.segundaCarta.carta.getData("valor");
      const tipo1 = this.primeraCarta.carta.getData("tipo");
      const tipo2 = this.segundaCarta.carta.getData("tipo");

      if (valor1 === valor2 && tipo1 !== tipo2) {
        this.time.delayedCall(500, () => {
          this.primeraCarta.fondo.fillColor = 0x00ff00; 
          this.segundaCarta.fondo.fillColor = 0x00ff00;
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
        obj.fondo.fillColor = 0x4a90e2; 
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

export default function PhaserGame() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      backgroundColor: "#222222",
      parent: gameRef.current!,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: MemoryScene 
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={gameRef} style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />;
}