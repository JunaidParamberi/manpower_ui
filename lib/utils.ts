import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The refined type scale (text-body / text-meta / text-label / text-card-title,
// see styles/globals.css @theme) are font sizes. Without this, tailwind-merge
// reads them as colours and drops them next to any text colour class.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["body", "meta", "label", "card-title"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
