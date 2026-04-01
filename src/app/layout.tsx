import type { Metadata, Viewport } from "next";
import { Kurale, Poppins } from "next/font/google";
import { BottomNav } from "@/components/navigation/BottomNav";
import { HeaderTitle } from "@/components/navigation/HeaderTitle";
import { HamburgerMenu } from "@/components/navigation/HamburgerMenu";
import { ScrollToTopOnRouteChange } from "@/components/navigation/ScrollToTopOnRouteChange";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import { UserSwitcher } from "@/components/user/UserSwitcher";
import { getCurrentUser } from "@/lib/currentUser";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const kurale = Kurale({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-kurale",
});

export const viewport: Viewport = {
  themeColor: "#f3f4f7",
};

export const metadata: Metadata = {
  title: "CRM",
  description: "CRM PWA UI foundation",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CRM",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${poppins.variable} ${kurale.variable} min-h-full bg-[var(--bg)] font-[var(--font-poppins)] text-[var(--text-primary)]`}>
        <div className="mx-auto flex min-h-dvh w-full flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
          <ScrollToTopOnRouteChange />
          <header className="sticky top-0 z-30 bg-[var(--bg)] pt-[env(safe-area-inset-top)]">
            <div className="mx-auto flex h-14 min-h-14 w-full max-w-[480px] items-center justify-between gap-3 px-5">
              <HamburgerMenu />
              <div className="min-w-0 flex-1 text-center">
                <HeaderTitle />
              </div>
              <UserSwitcher initialUser={currentUser} compact />
            </div>
          </header>
          <InstallPrompt />
          {children}
        </div>
        <BottomNav />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
