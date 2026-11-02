export type GameRect = { x: number; y: number; width: number; height: number };
export type LetterCell = { x: number; y: number; size: number };

export function getGameFrame(width: number, height: number) {
  const scale = Math.min(width / 800, height / 640, 1.25);
  const margin = 18 * scale;
  const headerBottom = (width < 640 ? 112 : 72) * scale;
  const footerTop = height - 64 * scale;
  return { scale, margin, headerBottom, footerTop, footerY: height - 30 * scale };
}

function letterRows(text: string, size: number, gap: number, maxWidth: number) {
  const rows: Array<Array<{ index: number; width: number }>> = [[]];
  let rowWidth = 0, index = 0;
  for (const char of text) {
    const isSpace = char === " ";
    const token = { index: isSpace ? -1 : index++, width: size * (isSpace ? 0.6 : 1) };
    if (rowWidth + (rowWidth ? gap : 0) + token.width > maxWidth) {
      rows.push([]); rowWidth = 0;
    }
    if (isSpace && !rowWidth) continue;
    rows[rows.length - 1].push(token);
    rowWidth += (rowWidth ? gap : 0) + token.width;
  }
  return rows;
}

export function getSpellingLayout(width: number, height: number, word: string) {
  const frame = getGameFrame(width, height);
  const { scale, margin, headerBottom, footerTop } = frame;
  const size = 56 * scale, gap = 10 * scale, sectionGap = 18 * scale;
  const availableWidth = width - margin * 2;
  const inputRows = letterRows(word, size, gap, availableWidth);
  const keyboardRows = letterRows(word.replace(/ /g, ""), size, gap, availableWidth);
  const rowsHeight = (count: number) => count * size + (count - 1) * gap;
  const questionY = headerBottom + 16 * scale;
  const videoTop = questionY + 26 * scale;
  const lettersHeight = rowsHeight(inputRows.length) + sectionGap + rowsHeight(keyboardRows.length);
  const videoHeight = Math.min(250 * scale, footerTop - videoTop - lettersHeight - sectionGap * 2);
  const videoWidth = Math.min(availableWidth, 460 * scale, videoHeight / 0.60);
  const video: GameRect = { x: (width - videoWidth) / 2, y: videoTop, width: videoWidth, height: videoWidth * 0.60 };
  function place(rows: ReturnType<typeof letterRows>, top: number) {
    const cells: LetterCell[] = [];
    rows.forEach((row, r) => {
      const rowWidth = row.reduce((total, token) => total + token.width, 0) + Math.max(0, row.length - 1) * gap;
      let x = (width - rowWidth) / 2;
      row.forEach((token) => {
        if (token.index >= 0) cells[token.index] = { x: x + size / 2, y: top + r * (size + gap) + size / 2, size };
        x += token.width + gap;
      });
    });
    return cells;
  }
  const inputTop = video.y + video.height + sectionGap;
  return {
    ...frame, questionY, video,
    inputCells: place(inputRows, inputTop),
    keyboardCells: place(keyboardRows, inputTop + rowsHeight(inputRows.length) + sectionGap),
  };
}

export function getChoiceLayout(width: number, height: number) {
  const frame = getGameFrame(width, height);
  const gap = 18 * frame.scale;
  const questionY = frame.headerBottom + 20 * frame.scale;
  const top = questionY + Math.max(44, 60 * frame.scale);
  const bottom = frame.footerTop - gap;
  const cardWidth = Math.min(300 * frame.scale, (width - 2 * frame.margin - gap) / 2, ((bottom - top - gap) / 2) / 0.72);
  const cardHeight = cardWidth * 0.72;
  const centerY = (top + bottom) / 2;
  const cards: GameRect[] = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
    cards.push({ x: width / 2 + (col - 1) * (cardWidth + gap) + gap / 2, y: centerY + (row - 1) * (cardHeight + gap) + gap / 2, width: cardWidth, height: cardHeight });
  }
  return { ...frame, questionY, cards };
}

export function getMultipleChoiceLayout(width: number, height: number, count: number) {
  const frame = getGameFrame(width, height);
  const { scale, margin, headerBottom, footerTop } = frame;
  const columns = width < 640 ? 2 : 3;
  const rows = Math.ceil(count / columns);
  const gap = 14 * scale;
  const buttonWidth = Math.min(360 * scale, (width - 2 * margin - gap * (columns - 1)) / columns);
  const buttonHeight = Math.max(48, 56 * scale);
  const buttonsHeight = rows * buttonHeight + (rows - 1) * gap;
  const buttonsTop = footerTop - 16 * scale - buttonsHeight;
  const videoTop = headerBottom + 16 * scale;
  const videoWidth = Math.min(480 * scale, width - 2 * margin, (buttonsTop - videoTop - 20 * scale) / 0.72);
  const video: GameRect = { x: (width - videoWidth) / 2, y: videoTop, width: videoWidth, height: videoWidth * 0.72 };
  const buttons: GameRect[] = Array.from({ length: count }, (_, index) => ({
    x: (width - columns * buttonWidth - (columns - 1) * gap) / 2 + (index % columns) * (buttonWidth + gap),
    y: buttonsTop + Math.floor(index / columns) * (buttonHeight + gap), width: buttonWidth, height: buttonHeight,
  }));
  return { ...frame, video, buttons };
}
