const MILLISECONDS_PER_DAY = 86_400_000;

export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";

export type StreakState = {
  count: number;
};

const DAYS_PER_WEEK = 7;
const WEEK_MASK = 0b1111111;
const TRAINING_SHIFT = 7;

export type ActivityKind = "game" | "training";

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

export function decodeStreak(value: number | null): StreakState {
  const mask = Math.max(0, Math.trunc(value ?? 0)) & WEEK_MASK;
  let count = 0;

  for (let index = 0; index < DAYS_PER_WEEK; index++) {
    if ((mask & (1 << index)) !== 0) count++;
  }

  return { count };
}

export function getWeekdayIndex(dayNumber: number) {
  return (dayNumber + 3) % DAYS_PER_WEEK;
}

export function getWeekStartDay(dayNumber: number) {
  return dayNumber - getWeekdayIndex(dayNumber);
}

export function getWeeklyActivity(
  value: number | null,
  lastActiveDay: number | null,
  today = getLocalDayNumber(),
  kind: ActivityKind = "game",
) {
  const isCurrentWeek =
    lastActiveDay !== null &&
    getWeekStartDay(lastActiveDay) === getWeekStartDay(today);
  const encodedValue = Math.max(0, Math.trunc(value ?? 0));
  const shift = kind === "training" ? TRAINING_SHIFT : 0;
  let mask = isCurrentWeek ? (encodedValue >> shift) & WEEK_MASK : 0;

  if (isCurrentWeek && lastActiveDay !== null) {
    const lastActiveIndex = getWeekdayIndex(lastActiveDay);
    const lastActiveBit = 1 << lastActiveIndex;

    // Convierte automáticamente la racha numérica anterior al formato semanal.
    if (kind === "game" && encodedValue <= 7 && mask !== 0 && (mask & lastActiveBit) === 0) {
      const legacyCount = Math.min(Math.max(Math.trunc(value ?? 1), 1), 7);
      mask = 0;

      for (let offset = 0; offset < legacyCount; offset++) {
        const index = lastActiveIndex - offset;
        if (index >= 0) mask |= 1 << index;
      }
    }
  }

  return {
    mask,
    count: decodeStreak(mask).count,
    days: Array.from(
      { length: DAYS_PER_WEEK },
      (_, index) => (mask & (1 << index)) !== 0,
    ),
  };
}

export function registerActiveDay(
  currentValue: number,
  lastActiveDay: number | null,
  today: number,
  fromTraining = false,
) {
  const gameActivity = getWeeklyActivity(currentValue, lastActiveDay, today, "game");
  const trainingActivity = getWeeklyActivity(currentValue, lastActiveDay, today, "training");
  const todayBit = 1 << getWeekdayIndex(today);
  const gameMask = gameActivity.mask | todayBit;
  const trainingMask = fromTraining
    ? trainingActivity.mask | todayBit
    : trainingActivity.mask;
  const value = gameMask | (trainingMask << TRAINING_SHIFT);

  if (lastActiveDay === today) {
    return {
      count: decodeStreak(gameMask).count,
      value,
      changed: value !== currentValue,
    };
  }

  return {
    count: decodeStreak(gameMask).count,
    value,
    changed: true,
  };
}
