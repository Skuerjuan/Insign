const DAY_MODULUS = 32_768;
const MILLISECONDS_PER_DAY = 86_400_000;
const MAX_STREAK = Math.floor((MILLISECONDS_PER_DAY - 1) / DAY_MODULUS);

export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";

export type StreakState = {
  count: number;
  lastActiveDay: number | null;
};

export function getLocalDayNumber(
  date = new Date(),
  timeZone = APP_TIME_ZONE,
) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return Math.floor(Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY);
}

export function decodeStreak(value: Date | null): StreakState {
  if (!value) return { count: 0, lastActiveDay: null };

  const encoded =
    value.getUTCHours() * 3_600_000 +
    value.getUTCMinutes() * 60_000 +
    value.getUTCSeconds() * 1_000 +
    value.getUTCMilliseconds();

  const count = Math.floor(encoded / DAY_MODULUS);
  const lastActiveDay = encoded % DAY_MODULUS;

  if (count < 1 || count > MAX_STREAK) {
    return { count: 0, lastActiveDay: null };
  }

  return { count, lastActiveDay };
}

export function encodeStreak(count: number, activeDay: number) {
  const safeCount = Math.min(Math.max(Math.trunc(count), 1), MAX_STREAK);
  const encoded = safeCount * DAY_MODULUS + (activeDay % DAY_MODULUS);

  return new Date(encoded);
}

export function registerActiveDay(value: Date | null, today: number) {
  const current = decodeStreak(value);
  const todayModulo = today % DAY_MODULUS;

  if (current.lastActiveDay === todayModulo) {
    return { count: current.count, value, changed: false };
  }

  const yesterdayModulo = (todayModulo - 1 + DAY_MODULUS) % DAY_MODULUS;
  const nextCount =
    current.lastActiveDay === yesterdayModulo ? current.count + 1 : 1;

  return {
    count: Math.min(nextCount, MAX_STREAK),
    value: encodeStreak(nextCount, today),
    changed: true,
  };
}
