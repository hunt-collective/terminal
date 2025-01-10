import { Style } from "@textjs/core"

export const dimensions = {
  width: 75,
  height: 20,
}

export const styles: Record<string, Style> = {
  white: { color: "white" },
  gray: { color: "#666" },
  orange: { color: "#ff4800" },
}

export function formatPrice(price: number): string {
  return `$${price / 100}`
}
