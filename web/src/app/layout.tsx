import type { Metadata, Viewport } from "next";
import {
  Archivo_Black,
  Bodoni_Moda,
  Cormorant_Garamond,
  DM_Sans,
  Fraunces,
  IBM_Plex_Sans,
  Inter,
  Libre_Franklin,
  Source_Sans_3,
  Syne,
} from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import {
  BACKGROUND_COOKIE,
  resolveBackgroundId,
  type BackgroundId,
} from "@/lib/backgrounds";
import { THEME_COOKIE, resolveThemeId, type ThemeId } from "@/lib/themes";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source-sans",
  display: "swap",
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-bodoni",
  display: "swap",
});

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-libre-franklin",
  display: "swap",
});

const fontVariables = [
  syne.variable,
  ibmPlex.variable,
  cormorant.variable,
  inter.variable,
  archivoBlack.variable,
  dmSans.variable,
  fraunces.variable,
  sourceSans.variable,
  bodoniModa.variable,
  libreFranklin.variable,
].join(" ");

export const metadata: Metadata = {
  title: "FeedBaker — scroll, vote, decide",
  description:
    "The fastest way to get honest opinions on your photos. Scroll a feed of visual choices and vote with one tap.",
  openGraph: {
    title: "FeedBaker",
    description: "Scroll, vote, decide. Honest opinions on your photos.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

async function getTheme(): Promise<ThemeId> {
  const jar = await cookies();
  return resolveThemeId(jar.get(THEME_COOKIE)?.value);
}

async function getBackground(): Promise<BackgroundId> {
  const jar = await cookies();
  return resolveBackgroundId(jar.get(BACKGROUND_COOKIE)?.value);
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const theme = await getTheme();
  const background = await getBackground();

  return (
    <html lang="en" data-theme={theme} data-bg={background} className={fontVariables}>
      <body>
        <ThemeProvider theme={theme} background={background}>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
