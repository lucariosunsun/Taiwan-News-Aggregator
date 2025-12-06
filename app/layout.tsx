import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer"; // <--- Import Footer
export const metadata: Metadata = {
  title: "台灣新聞聚合 | Taiwan News Aggregator",
  description: "從泛綠、中立、泛藍三種角度，全方位了解台灣新聞事件。",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <div className="flex-grow">
          {children}
        </div>
        {/* Footer Added Here */}
        <Footer /> 
      </body>
    </html>
  );
}
