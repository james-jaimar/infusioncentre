import { addDays, format } from "date-fns";
import type { CourseFrequency } from "@/hooks/useCourseTemplates";

const GAP_DAYS: Partial<Record<CourseFrequency, number>> = {
  single: 0,
  weekly: 7,
  twice_weekly: 4, // ~3-4 days between sessions
  biweekly: 14,
  monthly: 30,
};

export function computeExpectedEndDate(
  start: Date,
  sessions: number,
  frequency: CourseFrequency | null | undefined
): Date | null {
  if (!start || !sessions || sessions < 1) return null;
  if (!frequency) return null;
  const gap = GAP_DAYS[frequency];
  if (gap === undefined) return null; // as_needed / custom_schedule
  if (sessions === 1) return start;
  return addDays(start, gap * (sessions - 1));
}

export const FREQUENCY_LABEL: Record<CourseFrequency, string> = {
  single: "single session",
  weekly: "weekly",
  twice_weekly: "twice weekly",
  biweekly: "every 2 weeks",
  monthly: "monthly",
  as_needed: "as needed",
  custom_schedule: "custom schedule",
};

export function formatEndDateHint(end: Date): string {
  return format(end, "EEE d MMM yyyy");
}