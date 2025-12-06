import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "台灣新聞聚合 | Taiwan News Aggregator",
  description: "從泛綠、中立、泛藍三種角度，全方位了解台灣新聞事件。基於 Media Bias Fact Check 方法論，提供客觀的新聞來源分析。",
  keywords: ["台灣新聞", "新聞聚合", "泛綠", "泛藍", "中立", "媒體偏見", "Taiwan News", "News Aggregator"],
  authors: [{ name: "Taiwan News Aggregator" }],
  openGraph: {
    title: "台灣新聞聚合 | Taiwan News Aggregator",
    description: "從多元角度理解台灣新聞",
    type: "website",
  },
};
import Footer from "@/components/Footer";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
