import type Phaser from "phaser";
import { getGameFrame } from "./game-layout";

export function drawGameHeader(scene: Phaser.Scene, width: number, height: number, title: string, points: number, fontFamily: string) {
  const { scale: s, margin } = getGameFrame(width, height);
  const compact = width < 640;
  const backX = 32 * s, backY = 30 * s;
  scene.add.circle(backX, backY, 21 * s, 0x1e78ff).setInteractive({ useHandCursor: true }).on("pointerdown", () => window.history.back());
  const arrow = scene.add.graphics();
  arrow.lineStyle(4 * s, 0xffffff, 1);
  arrow.beginPath(); arrow.moveTo(backX + 5 * s, backY - 10 * s);
  arrow.lineTo(backX - 7 * s, backY); arrow.lineTo(backX + 5 * s, backY + 10 * s);
  arrow.moveTo(backX - 7 * s, backY); arrow.lineTo(backX + 12 * s, backY); arrow.strokePath();
  const titleWidth = Math.min(280 * s, compact ? width - 110 * s : width * 0.32);
  const bg = scene.add.graphics();
  bg.fillStyle(0x1e78ff, 1); bg.fillRoundedRect((width - titleWidth) / 2, 8 * s, titleWidth, 44 * s, 12 * s);
  scene.add.text(width / 2, 30 * s, title, { fontFamily, fontSize: `${26 * s}px`, fontStyle: "800", color: "#ffffff", stroke: "#d28b00", strokeThickness: 3 * s }).setOrigin(0.5);
  const scoreWidth = 230 * s, scoreHeight = 40 * s;
  const scoreX = compact ? (width - scoreWidth) / 2 : width - margin - scoreWidth;
  const scoreY = (compact ? 80 : 30) * s;
  const score = scene.add.graphics();
  score.fillStyle(0xffe174, 1); score.fillRoundedRect(scoreX, scoreY - scoreHeight / 2, scoreWidth, scoreHeight, 20 * s);
  score.lineStyle(2 * s, 0xf7b928, 1); score.strokeRoundedRect(scoreX, scoreY - scoreHeight / 2, scoreWidth, scoreHeight, 20 * s);
  scene.add.star(scoreX + 23 * s, scoreY, 5, 9 * s, 18 * s, 0xffd32a);
  scene.add.text(scoreX + 48 * s, scoreY, `${points} puntos`, { fontFamily, fontSize: `${18 * s}px`, fontStyle: "800", color: "#05215b" }).setOrigin(0, 0.5);
}
