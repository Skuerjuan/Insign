import { recordLearnedSign } from "@/lib/server/profile.actions";

export function createSignRecorder() {
  const pending = new Map<string, { level: number | string; word: string; result: Promise<boolean> }>();
  return {
    record(level: number | string, word: string) {
      const key = `${level}:${word}`;
      if (pending.has(key)) return;
      pending.set(key, { level, word, result: recordLearnedSign(level, word).catch(() => false) });
    },
    async flush() {
      for (const [key, entry] of pending) {
        if (!await entry.result) await recordLearnedSign(entry.level, entry.word);
        pending.delete(key);
      }
    },
  };
}
