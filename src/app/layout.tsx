import type { Metadata, Viewport } from "next";
import { Sofia_Sans, Sofia_Sans_Extra_Condensed } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/shell";
import "./globals.css";

const body = Sofia_Sans({ variable: "--font-body", subsets: ["latin", "cyrillic"] });
const cond = Sofia_Sans_Extra_Condensed({ variable: "--font-cond", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: { default: "Keruen — грузы и машины через Хоргос", template: "%s · Keruen" },
  description: "Биржа грузоперевозок: клиент называет цену, водитель принимает или торгуется.",
};

export const viewport: Viewport = {
  themeColor: "#a2391f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${body.variable} ${cond.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        {/*
          THESIS: a freight board for the Khorgos corridor where the route and the price are read first, not a generic blue logistics dashboard.
          OWN-WORLD: Khorgos dry-port yard. Oxide-red corrugated container steel for headers, concrete ground, white door panels with corner castings,
          loads drawn as container door markings, trucks as KZ licence plates, hi-vis seal yellow for the one action, seal green for sealed deals, stamp-ink blue for customs.
          STORY: client posts a load with a price → drivers accept or counter → client accepts → deal gets a bolt seal → chat. Drivers post a free truck → it pops up for clients.
          FIRST VIEWPORT: oxide panel with greeting + yellow primary action; below, the live feed of trucks (client) or loads (driver).
          FORM: grounded candidate 4 (container stencils & door markings), seed b28cf44f.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
