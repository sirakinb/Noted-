import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  formatDistanceToNow,
  differenceInHours,
  parseISO,
  isValid,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MAIN_LANGUAGES = [
  {
    value: "en",
    name: "English",
  },
  {
    value: "fr",
    name: "French",
  },
  {
    value: "es",
    name: "Spanish",
  },
  {
    value: "de",
    name: "German",
  },
  {
    value: "it",
    name: "Italian",
  },
  {
    value: "pt",
    name: "Portuguese",
  },
  {
    value: "ja",
    name: "Japanese",
  },
  {
    value: "ko",
    name: "Korean",
  },
  {
    value: "zh",
    name: "Chinese",
  },
];

/**
 * Formats a timestamp string according to the following rules:
 * - If less than 12 hours ago: "HH:mm - X hours ago"
 * - If 12 hours or more: "HH:mm - M/D/YYYY"
 * @param timestamp ISO string or Date
 * @returns formatted string
 */
export function formatWhisperTimestamp(timestamp: string | Date): string {
  let date: Date;
  if (typeof timestamp === "string") {
    date = parseISO(timestamp);
    if (!isValid(date)) {
      // fallback for non-ISO strings
      date = new Date(timestamp);
    }
  } else {
    date = timestamp;
  }
  const now = new Date();
  const hoursAgo = differenceInHours(now, date);
  const timePart = format(date, "HH:mm");
  if (hoursAgo < 12) {
    // e.g. "03:21 - 3 hours ago"
    return `${timePart} - ${formatDistanceToNow(date, {
      addSuffix: true,
    }).replace("about ", "")}`;
  } else {
    // e.g. "03:55 - 6/30/2025"
    return `${timePart} - ${format(date, "M/d/yyyy")}`;
  }
}

export const RECORDING_TYPES: {
  name: string;
  value: string;
}[] = [
  {
    name: "Summary",
    value: "summary",
  },
  {
    name: "Quick Note",
    value: "quick-note",
  },
  {
    name: "List",
    value: "list",
  },
  {
    name: "Blog post",
    value: "blog",
  },
  {
    name: "Email",
    value: "email",
  },
  // {
  //   name: "Custom Prompt",
  //   value: "custom-prompt",
  // },
];
