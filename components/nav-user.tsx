"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Bell,
  ChevronUp,
  LogOut,
  Settings2,
  Sparkles,
  History,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import api from "@/lib/api"; // 👈 your api instance

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  // --- Fetch User ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/users/me"); // 👈 using api instance

        if (data?.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch (err) {
        console.error("User fetch failed");
        localStorage.removeItem("user");
        router.push("/login");
      }
    };

    fetchUser();
  }, []);

  // --- Logout ---
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout"); // 👈 logout via api
    } catch (err) {
      console.error("Logout failed");
    }

    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) return null; // hide until loaded

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.profileInfo?.profileImageUrl} alt={user.email} />
                <AvatarFallback className="rounded-lg text-[#12383f]">
                  {user.firstname?.slice(0, 1)}
                  {user.lastname?.slice(0, 1)}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.firstname} {user.lastname}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronUp className="ml-auto size-6" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.profileInfo?.profileImageUrl} alt={user.email} />
                  <AvatarFallback className="rounded-lg text-[#12383f]">
                    {user.firstname?.slice(0, 1)}
                    {user.lastname?.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.firstname} {user.lastname}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            {/* <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles /> Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator /> */}
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                <BadgeCheck /> Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell /> Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings2 /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/transaction-history")}>
                <History /> Transaction History
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
