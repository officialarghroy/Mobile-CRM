import type { Metadata, Viewport } from "next";
import { Kurale, Poppins } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/navigation/BottomNav";
import { HamburgerMenu } from "@/components/navigation/HamburgerMenu";
import { ScrollToTopOnRouteChange } from "@/components/navigation/ScrollToTopOnRouteChange";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import { getMenuUserProfile } from "@/lib/menuUserProfile";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
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
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && pathname !== "/login") {
    redirect("/login");
  }

  if (user && pathname === "/login") {
    redirect("/leads");
  }

  const menuUserProfile = await getMenuUserProfile();
  const isLoginRoute = pathname === "/login";

  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${poppins.variable} ${kurale.variable} min-h-full font-[var(--font-poppins)] text-[var(--text-primary)] ${
          isLoginRoute ? "bg-white" : "bg-[var(--bg)]"
        }`}
      >
        <div
          className={`mx-auto flex min-h-dvh w-full flex-col ${
            isLoginRoute ? "pb-[env(safe-area-inset-bottom)]" : "pb-[calc(5.25rem+env(safe-area-inset-bottom))]"
          }`}
        >
          <ScrollToTopOnRouteChange />
          {!isLoginRoute ? (
            <header className="sticky top-0 z-30 bg-[var(--bg)] pt-[env(safe-area-inset-top)]">
              <div className="mx-auto flex h-14 min-h-14 w-full max-w-[480px] items-center justify-between gap-3 px-5">
                <HamburgerMenu initialProfile={menuUserProfile} />
                {user ? (
                  <span
                    className="crm-meta max-w-[50%] truncate text-right"
                    title={menuUserProfile.email ?? undefined}
                  >
                    {menuUserProfile.displayName}
                  </span>
                ) : null}
              </div>
            </header>
          ) : (
            <div className="shrink-0 pt-[env(safe-area-inset-top)]" aria-hidden />
          )}
          <InstallPrompt />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
        {!isLoginRoute ? <BottomNav /> : null}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
