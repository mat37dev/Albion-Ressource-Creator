import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSilver(amount: number): string {
  return Math.round(amount).toLocaleString("fr-FR");
}

export function formatPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function getProfitColor(profit: number): string {
  if (profit > 0) return "text-green-400";
  if (profit < 0) return "text-red-400";
  return "text-gray-400";
}

export function getProfitBadgeVariant(profit: number): "success" | "destructive" | "secondary" {
  if (profit > 0) return "success";
  if (profit < 0) return "destructive";
  return "secondary";
}

/**
 * Format a quantity value, removing unnecessary decimals for integers
 */
export function formatQuantity(value: number): string {
  return value % 1 === 0 ? value.toString() : value.toFixed(2);
}
