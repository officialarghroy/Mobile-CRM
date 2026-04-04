import type { Metadata, Viewport } from "next";
import { Kurale, Poppins } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/navigation/AppHeader";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ScrollToTopOnRouteChange } from "@/components/navigation/ScrollToTopOnRouteChange";
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
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f3f4f7",
  colorScheme: "light",
};

const appDescription = "TSS CRM: manage leads and activity with your team";

export const metadata: Metadata = {
  title: "TSS CRM",
  description: appDescription,
  applicationName: "TSS CRM",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/Logo.webp", sizes: "512x512", type: "image/webp" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TSS CRM",
  },
  formatDetection: {
    telephone: false,
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
          className={`box-border mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] ${
            isLoginRoute
              ? "pb-[env(safe-area-inset-bottom)]"
              : "pb-[calc(var(--app-bottom-nav-reserved)+env(safe-area-inset-bottom))]"
          }`}
        >
          <ScrollToTopOnRouteChange />
          {!isLoginRoute ? (
            <AppHeader initialProfile={menuUserProfile} />
          ) : (
            <div className="shrink-0 pt-[env(safe-area-inset-top)]" aria-hidden />
          )}
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">{children}</div>
        </div>
        {!isLoginRoute ? <BottomNav /> : null}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
