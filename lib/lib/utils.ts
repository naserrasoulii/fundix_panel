import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SUPPORTED_LANGS, type SupportedLang, DEFAULT_LANG } from "../i18n/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract active language from a pathname like `/fa/dashboard` or `/en`.
 * Falls back to DEFAULT_LANG if no valid language found.
 */
export function getLangFromPath(pathname: string): SupportedLang {
  const segment = pathname.split("/")[1];
  return SUPPORTED_LANGS.includes(segment as SupportedLang)
    ? (segment as SupportedLang)
    : DEFAULT_LANG;
}
