"use client";
import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { OnlineNav } from "./vitaegram/OnlineNav";

export function NavSwitcher() {
  const pathname = usePathname();
  return pathname.startsWith("/vitaegram") ? <OnlineNav /> : <BottomNav />;
}
