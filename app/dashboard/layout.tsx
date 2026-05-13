"use client";

import "@/app/globals.css";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React, { useEffect, useState } from "react";
import { Bell, Zap } from "lucide-react";
import NotificationPopup from "@/components/notification/NotificationPopup";
import api from "@/lib/api";
import credits from "@/public/images/wallet/credits.png";
import Image from "next/image";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);

  const [notifications, setNotifications] = useState<any>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletPoints, setWalletPoints] = useState(0);
  const [breadcrumbNames, setBreadcrumbNames] = useState<Record<string, string>>({});

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/my-notifications");
      const data = res.data.notifications || [];

      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Fetch Wallet Points
  const fetchWalletPoints = async () => {
    try {
      const res = await api.get("/wallet/details");
      if (res.data.success) {
        setWalletPoints(res.data.balance);
      }
    } catch (err) {
      console.error("Error fetching wallet points:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchWalletPoints();

    // Listen for wallet updates
    const handleWalletUpdate = () => {
      fetchWalletPoints();
    };

    window.addEventListener("wallet-updated", handleWalletUpdate);

    return () => {
      window.removeEventListener("wallet-updated", handleWalletUpdate);
    };
  }, []);

  // Fetch Names for Breadcrumbs
  useEffect(() => {
    const fetchBreadcrumbDetails = async () => {
      const myInterviewsIndex = segments.indexOf("my-interviews");
      if (myInterviewsIndex !== -1 && segments.length > myInterviewsIndex + 1) {
        const id = segments[myInterviewsIndex + 1];
        const isId = /^[a-f\d]{24}$/i.test(id);
        if (isId && !breadcrumbNames[id]) {
          try {
            const res = await api.get(`/interview/session/${id}`);
            if (res.data?.success && res.data.session) {
              const session = res.data.session;
              const name = session.type === 'jobtitle'
                ? session.job_title
                : (session.skills ? session.skills.join(', ') : 'Skills Interview');

              if (name) {
                setBreadcrumbNames(prev => ({ ...prev, [id]: name }));
              }
            }
          } catch (e) {
            console.error("Error fetching breadcrumb name:", e);
          }
        }
      }
    };

    fetchBreadcrumbDetails();
  }, [pathname]);

  return (
    <SidebarProvider>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="flex h-screen overflow-hidden w-screen">
        {/* Fixed Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <SidebarInset className="flex flex-col gap-0 flex-1 bg-[#184852]">
          {/* Fixed Header */}
          <header className="w-full h-auto flex flex-col items-start gap-2 px-4 py-2 bg-[#f7fbfa] rounded-tl-[15px] z-10">
            <div className="w-full flex items-center justify-between">
              <div className="flex gap-2 w-1/2">
                <SidebarTrigger className="-ml-1 bg-[#f2825c] text-[#fffafa] py-5 px-6 hover:bg-[#184852] hover:text-[#fffafa] hover:opacity-100 hover:shadow-none cursor-pointer" />
              </div>

              <div className="flex items-center gap-3">
                {/* Wallet Button */}
                <div
                  onClick={() => router.push("/dashboard/wallet")}
                  className="relative bg-[#f2825c] text-[#fffafa] px-4 py-3 rounded-md flex items-center gap-2 cursor-pointer transition-colors hover:bg-[#184852]"
                >
                  <div className="rounded-full">
                    <Image src={credits} alt="" className="w-4 h-4" />
                  </div>
                  {/* Render Dynamic Wallet Points*/}
                  <span className="font-medium text-xs whitespace-nowrap">
                    Credits Left: {walletPoints}
                  </span>
                </div>

                <div className="relative group w-fit">
                  {/* Bell Icon */}
                  <div className="relative text-[#12383f] bg-white/80 border border-[#cfe3e0] backdrop-blur-md px-4 py-3 cursor-pointer rounded-md">
                    <Bell size={20} />

                    {/* Red Dot */}
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-4 w-3 h-3 bg-[#ed3336] rounded-full flex items-center justify-center text-[8px] text-[#fffafa]">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Popup */}
                  <div
                    className="
          absolute right-0 mt-3 w-80 rounded-md shadow-lg bg-white text-[#17383d] 
          opacity-0 scale-95 pointer-events-none 
          group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto
          transition-all duration-200 ease-out z-50
        "
                  >
                    <div
                      className="absolute -top-2 right-4 
    w-0 h-0 
    border-l-10 border-r-10 border-b-10 
    border-l-transparent border-r-transparent border-b-white shadow-t-xl"
                    ></div>
                    <NotificationPopup
                      notifications={notifications}
                      setNotifications={setNotifications}
                      setUnreadCount={setUnreadCount}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Breadcrumb & Actions */}
            <div className="border-b border-[#cfe3e0] w-full py-3 px-2 flex items-center justify-between gap-4">
              <Breadcrumb className="">
                <BreadcrumbList>
                  {segments.map((segment, index) => {
                    const href = "/" + segments.slice(0, index + 1).join("/");
                    const isLast = index === segments.length - 1;
                    const resolvedName = breadcrumbNames[segment];
                    const formatted = resolvedName || segment
                      .replace(/-/g, " ") // optional: replace dashes
                      .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word

                    return (
                      <React.Fragment key={href}>
                        <BreadcrumbItem>
                          {!isLast ? (
                            <BreadcrumbLink asChild>
                              <Link href={href}>{formatted}</Link>
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage className="font-semibold">
                              {formatted}
                            </BreadcrumbPage>
                          )}
                        </BreadcrumbItem>

                        {!isLast && (
                          <BreadcrumbSeparator className="text-[#184852] font-semibold" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
              <div id="breadcrumb-actions" className="flex items-center gap-2"></div>
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 w-full overflow-auto rounded-bl-[15px] bg-[#f7fbfa] px-4">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
