import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";   
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "sonner"
import { AuthInitializer } from "@/components/auth/AuthInitializer";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "StreamTime",
  description: "Your platform for live streams and videos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <AuthInitializer>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Toaster position="bottom-right" richColors />
          </AuthInitializer>
        </Providers>
      </body>
    </html>
  );
}