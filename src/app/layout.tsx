import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BottomNav } from "@/components/navigation/BottomNav";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import { UserSwitcher } from "@/components/user/UserSwitcher";
import { getCurrentUser } from "@/lib/currentUser";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM",
  description: "CRM PWA UI foundation",
  manifest: "/manifest.json",
  themeColor: "#0B0B0C",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
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
      <body className={`${inter.className} min-h-full bg-[var(--bg)] text-[var(--text-primary)]`}>
        <div className="mx-auto flex min-h-dvh w-full flex-col pt-[env(safe-area-inset-top)] pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
          <UserSwitcher initialUser={currentUser} />
          {children}
        </div>
        <BottomNav />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
