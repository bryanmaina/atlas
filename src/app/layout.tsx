import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/components/providers/UserContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Atlas — Enterprise Knowledge & HR Governance",
  description:
    "Autonomous proof-of-concept for enterprise knowledge management, dual-signature information verification, talent mapping, and compliance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-slate-100 text-slate-800 antialiased min-h-screen p-3 sm:p-5 lg:p-7 flex justify-center items-start selection:bg-blue-100 selection:text-blue-900">
        <UserProvider>
          {/* Main Application Shell: Massive deeply rounded glassmorphic container */}
          <div className="w-full max-w-[1500px] bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-white/60 p-6 sm:p-7 lg:p-8 flex flex-col md:flex-row gap-6 min-h-[920px]">
            {/* Left Vertical Icon Bar */}
            <Sidebar />

            {/* Main Application Workspace */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              <TopBar />
              <main className="flex-1 w-full min-w-0">{children}</main>
            </div>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
