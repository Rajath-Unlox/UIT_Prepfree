"use client";

import { usePathname } from "next/navigation";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useEffect, useState } from "react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const { open } = useSidebar();

  const normalize = (p: string) =>
    (p || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";

  function collectUrls(items: any[]): string[] {
    const out: string[] = [];
    function walk(it: any) {
      if (it.url) out.push(normalize(it.url));
      if (it.items) it.items.forEach(walk);
    }
    items.forEach(walk);
    return out;
  }

  function findDeepestMatch(pathname: string, items: any[]) {
    const normPath = normalize(pathname);
    const urls = collectUrls(items);

    const matches = urls.filter(
      (u) => u === normPath || normPath.startsWith(u + "/")
    );
    if (matches.length === 0) return null;

    return matches.reduce((a, b) => (a.length >= b.length ? a : b));
  }

  const deepestMatch = findDeepestMatch(pathname, items);

  const [clickedItem, setClickedItem] = useState<string | null>(null);

  const handleItemClick = (item: any) => {
    setClickedItem((prev) => (prev === item.title ? null : item.title));
  };

  return (
    <SidebarGroup className={`gap-1 ${open ? "p-0 pr-2" : ""}`}>
      <SidebarGroupLabel className="text-white/75">
        MAIN
      </SidebarGroupLabel>

      <SidebarMenu className="gap-3">
        {items.map((item) => {
          const hasSubItems =
            Array.isArray(item.items) && item.items.length > 0;

          const isSelected =
            normalize(item.url) === deepestMatch ||
            item.items?.some((sub) => normalize(sub.url) === deepestMatch);

          return (
            <Collapsible key={item.title} asChild className="group/collapsible">
              <SidebarMenuItem>
                <div className="w-full flex flex-col h-full gap-2 items-start">
                  <div className="w-full flex gap-2">
                    {isSelected && open && (
                      <motion.div
                        layoutId="sidebar-active-highlight"
                        className="w-4 h-full"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      >
                        <div
                          className={`w-full h-full ${isSelected
                              ? "bg-transparent backdrop-blur-2xl border border-white/20 rounded-tr-[13px] rounded-tl-[10px] rounded-bl-[13px] rounded-br-[10px]"
                              : ""
                            }`}
                        >
                          <div
                            className={`w-full h-full relative ${isSelected ? "bg-[#f2825c] rounded-[10px]" : ""
                              }`}
                          >
                            <div
                              className={`${isSelected
                              ? "w-full h-full absolute bg-gradient-to-t from-white/20 to-transparent rounded-[10px]"
                                  : "hidden"
                                }`}
                            ></div>

                            <div
                              className={`w-full h-full rounded-[10px] transition-transform ease-in-out duration-200 ${isSelected
                              ? "bg-white/15 shadow-[inset_0px_0px_15px_4px_rgba(255,_255,_255,_0.18)]"
                                  : ""
                                }`}
                            ></div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div
                      className={`w-full ${isSelected
                          ? "bg-transparent backdrop-blur-2xl border border-white/20 rounded-tr-[13px] rounded-tl-[10px] rounded-bl-[13px] rounded-br-[10px]"
                          : ""
                        }`}
                    >
                      <div
                          className={`w-full relative ${isSelected ? "bg-[#f2825c] rounded-[10px]" : ""
                          }`}
                      >
                        <div
                          className={`${isSelected
                              ? "w-full h-full absolute bg-gradient-to-t from-white/8 via-white/0 to-transparent rounded-[10px]"
                              : "hidden"
                            }`}
                        ></div>

                        <SidebarMenuButton
                          asChild
                          onClick={() => handleItemClick(item)}
                          tooltip={item.title}
                          className={`w-full rounded-[10px] text-[#fffafa] hover:bg-white/10 hover:text-[#fffafa] active:bg-white/10 active:text-[#fffafa] data-[state=open]:hover:bg-white/10 data-[state=open]:hover:text-[#fffafa] transition-transform ease-in-out duration-200 ${isSelected
                              ? "bg-white/15 shadow-[inset_0px_0px_15px_4px_rgba(255,_255,_255,_0.18)] py-5 px-4 hover:bg-white/20"
                              : "hover:translate-x-1"
                            }`}
                        >
                          <Link href={item.url}>
                            <div className="h-full flex items-center justify-between gap-2 w-full text-[#fffafa] py-2 cursor-pointer z-10">
                              <div className="flex gap-2 items-center">
                                {item.icon && <item.icon size={16} />}
                                <span>{open && item.title}</span>
                              </div>

                              {hasSubItems && (
                                <ChevronDown
                                  className={`transition-transform duration-200 ${clickedItem === item.title
                                      ? "rotate-180"
                                      : ""
                                    }`}
                                  size={20}
                                />
                              )}
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </div>
                    </div>
                  </div>

                  {hasSubItems && clickedItem === item.title && (
                    <SidebarMenuSub className="mt-0 p-0 relative gap-3 border-l border-white/35 pl-3">
                      {item.items?.map((subItem) => {
                        const isSubSelected =
                          normalize(subItem.url) === deepestMatch;

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className="text-[#fffafa] hover:bg-white/10 hover:text-[#fffafa] active:bg-white/10 active:text-[#fffafa] data-[active=true]:bg-white/15 data-[active=true]:text-[#fffafa]"
                            >
                              <Link
                                href={subItem.url}
                                className={`transition-all ${isSubSelected
                                    ? "text-white font-medium"
                                    : "text-[#fffafa] hover:text-white"
                                  }`}
                              >
                                {subItem.title}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}

                      <div className="w-1 h-1 rounded-full bg-white absolute bottom-0 left-[-2px]" />
                    </SidebarMenuSub>
                  )}
                </div>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
