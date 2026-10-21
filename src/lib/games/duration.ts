export type DurationInSeconds = number;

const secondsPerMinute = 60;
const secondsPerHour = 60 * secondsPerMinute;

export function durationInSecondsBetween(startedAt: Date, endedAt: Date): DurationInSeconds {
  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
}

const paddedToTwoDigits = (value: number) => String(value).padStart(2, "0");

export function formatDuration(durationInSeconds: DurationInSeconds): string {
  const hours = Math.floor(durationInSeconds / secondsPerHour);
  const minutes = Math.floor((durationInSeconds % secondsPerHour) / secondsPerMinute);
  const seconds = durationInSeconds % secondsPerMinute;
  if (hours > 0) return `${hours}:${paddedToTwoDigits(minutes)}:${paddedToTwoDigits(seconds)}`;
  return `${minutes}:${paddedToTwoDigits(seconds)}`;
}
