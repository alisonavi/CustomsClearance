import type { Metadata, Viewport } from "next";
import { Golos_Text } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/shell";
import "./globals.css";

const golos = Golos_Text({ variable: "--font-golos", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: { default: "Keruen — грузы и машины Китай — Казахстан", template: "%s · Keruen" },
  description: "Найдите машину для груза или груз для машины. Китай — Казахстан и по стране.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${golos.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        {/*
          THESIS: a freight board that a driver who hates apps can use — one question per screen, big type, and the app says WHY a truck or a load fits.
          OWN-WORLD: white screens on a pale blue-grey page, one calm blue (#1d5be0) for every action, green only for "fits / verified", no decoration.
          STORY: client describes cargo → sees matching trucks with reasons → compares bids → chooses → tracks status → rates. Carrier: says where/when the truck is free → gets matching loads → bids.
          FIRST VIEWPORT: Yandex-minimal — a heading and one route box (Откуда / Куда) with one big blue button; frequent routes under it.
          FORM: brief-pinned (white-blue minimal; Yandex search; inDrive filters; DAT One processes) — no direction roll.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
