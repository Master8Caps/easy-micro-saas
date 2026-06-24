import type { Metadata } from "next";
import { Outfit, DM_Sans, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE_VARIANT, BRAND } from "@/lib/variant";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: BRAND.metaTitle,
  description: BRAND.metaDescription,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headingFont =
    SITE_VARIANT === "calm" ? "var(--font-fraunces)" : "var(--font-outfit)";
  const fontVars = {
    ["--font-heading"]: headingFont,
    ["--font-body"]: "var(--font-dm-sans)",
  } as React.CSSProperties;

  return (
    <html
      lang="en"
      data-variant={SITE_VARIANT}
      className={`${outfit.variable} ${dmSans.variable} ${fraunces.variable}`}
      style={fontVars}
    >
      <head>
        {BRAND.gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${BRAND.gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${BRAND.gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="font-body">{children}</body>
    </html>
  );
}
