import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Bricolage_Grotesque({ subsets: ["latin"], variable: "--sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--serif" });

export const metadata = {
  title: "Agent Team",
  description: "Watch a team of AI agents plan, research, analyze and write.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`}>{children}</body>
    </html>
  );
}
