"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-context";

export default function RootPage() {
  const { profile, hydrated } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(profile.onboardingComplete ? "/home" : "/wizard");
  }, [hydrated, profile.onboardingComplete, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="h-2.5 w-2.5 animate-pulseSoft rounded-full bg-aura-gradient shadow-glow-sm" />
    </div>
  );
}
