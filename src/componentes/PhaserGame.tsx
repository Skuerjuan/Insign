"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function PhaserGame() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight, 
        backgroundColor: "#222222", 
        parent: gameRef.current!, 
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH
        }, 
        scene: {
          create
        }
      };

    const game = new Phaser.Game(config);

    function create(this: Phaser.Scene) {

      this.add.text(550, 300, " funcionando", {
        color: "#ffffff",
        fontSize: "32px"
      });

    }

    return () => {
      game.destroy(true);
    };

  }, []);

  return <div ref={gameRef} />;
}