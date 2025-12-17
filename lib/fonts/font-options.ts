export const FONT_OPTIONS = {
  geist: {
    name: "Geist Sans",
    value: "geist-sans",
    className: "font-sans",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  inter: {
    name: "Inter",
    value: "inter",
    className: "font-inter",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  roboto: {
    name: "Roboto",
    value: "roboto",
    className: "font-roboto",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  opensans: {
    name: "Open Sans",
    value: "open-sans",
    className: "font-open-sans",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  lato: {
    name: "Lato",
    value: "lato",
    className: "font-lato",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  montserrat: {
    name: "Montserrat",
    value: "montserrat",
    className: "font-montserrat",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  poppins: {
    name: "Poppins",
    value: "poppins",
    className: "font-poppins",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  playfair: {
    name: "Playfair Display",
    value: "playfair",
    className: "font-playfair",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  sourcecodepro: {
    name: "Source Code Pro",
    value: "source-code-pro",
    className: "font-source-code-pro",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  noto: {
    name: "Noto Sans",
    value: "noto-sans",
    className: "font-noto-sans",
    preview: "The quick brown fox jumps over the lazy dog",
  },
} as const

export type FontOption = keyof typeof FONT_OPTIONS

export function getFontClassName(font: FontOption): string {
  return FONT_OPTIONS[font]?.className || FONT_OPTIONS.geist.className
}
