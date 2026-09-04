import localFont from "next/font/local";
import { Poppins, Noto_Sans_Devanagari } from "next/font/google";

export const zarathustra = localFont({
  src: "../../public/fonts/zarathustra-v01.otf",
  variable: "--font-zarathustra",
  weight: "400",
  style: "normal",
  display: "swap",
});

// Poppins has no variable cut on Google Fonts, so the weights are listed.
// 400 for paragraphs, 600 for controls and labels, per DESIGN.md section 4.
export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-devanagari",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
