import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}
