"use client";
import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { OnlineNav } from "./vitaecom/OnlineNav";

export function NavSwitcher() {
  const pathname = usePathname();
  return pathname.startsWith("/vitaecom") ? <OnlineNav /> : <BottomNav />;
}
