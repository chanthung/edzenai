import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CANONICAL_ORIGIN = "https://www.edzenai.com";

export function slugifyName(name: string): string {
  return name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getParentPortalUrl(studentName: string, accessToken: string): string {
  return `${CANONICAL_ORIGIN}/view/${slugifyName(studentName)}/${accessToken}`;
}
