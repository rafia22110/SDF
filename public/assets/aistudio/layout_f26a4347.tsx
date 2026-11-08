import type { Metadata, Viewport } from "next";
import { Rubik, Heebo } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
  display: "swap",
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "אִיֵּי אוֹר | עוֹלָם לְמִידָה עֲתִידָנִי",
  description:
    "אִיֵּי אוֹר — עוֹלָם לְמִידָה מְשֻׂחָק וְעֲתִידָנִי בְּעִבְרִית: אִיִּים צָפִים, מִשְׂחקֵי קְרִיאָה, חֶשְׁבּוֹן, מַדָּע, יְצִירָה וְחֲשִׁיבָה, וּכְלֵי נִהוּל לַמּוֹרֶה.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0a1f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${heebo.variable}`}>
      <body className="antialiased">
        <div className="starfield" aria-hidden="true" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
