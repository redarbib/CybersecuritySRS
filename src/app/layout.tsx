import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CybersecuritySRS",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Link
          href="/"
          draggable="false"
          aria-label="Go to landing page"
          className="fixed left-5 top-4 z-50 block transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
        >
          <Image
            src="/logo.svg"
            alt="SRS"
            width={390}
            height={340}
            draggable="false"
            priority
            className="h-auto w-[100px] sm:w-[115px]"
          />
        </Link>
        {children}
      </body>
    </html>
  );
}
