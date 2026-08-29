import type { Metadata, Viewport } from "next";
import { ProfileProvider } from "@/lib/profile-context";
import { PlacesProvider } from "@/lib/places-context";
import { HouseholdProvider } from "@/lib/household-context";
import { TasksProvider } from "@/lib/tasks-context";
import { FeedProvider } from "@/lib/feed-context";
import { HealthProvider } from "@/lib/health-context";
import { FinanceProvider } from "@/lib/finance-context";
import { MoodProvider } from "@/lib/mood-context";
import { NeedsProvider } from "@/lib/needs-context";
import { IllnessProvider } from "@/lib/illness-context";
import { VitaecomSocialProvider } from "@/lib/vitaecom-social-context";
import { VitaecomDraftProvider } from "@/lib/vitaecom-draft-context";
import { IllnessFilterDefs } from "@/components/illness/IllnessFilterDefs";
import { IllnessVignette } from "@/components/illness/IllnessVignette";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { DayRhythm } from "@/components/DayRhythm";
import { NavSwitcher } from "@/components/NavSwitcher";
import { NearbyPlacePrompt } from "@/components/household/NearbyPlacePrompt";
import { EngagementNotifier } from "@/components/persone/EngagementNotifier";
import { TaskNotifier } from "@/components/task/TaskNotifier";
import { MoodSuggestionPrompt } from "@/components/mood/MoodSuggestionPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vitae",
  description: "La Tua Vita, Vissuta Due Volte.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vitae",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0D14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="font-body antialiased">
        <ServiceWorkerRegister />
        <DayRhythm />
        <IllnessFilterDefs />
        <ProfileProvider>
          <PlacesProvider>
            <HouseholdProvider>
              <TasksProvider>
                <FeedProvider>
                  <HealthProvider>
                    <FinanceProvider>
                      <MoodProvider>
                        <NeedsProvider>
                          <IllnessProvider>
                            <VitaecomSocialProvider>
                              <VitaecomDraftProvider>
                              {children}
                              <NavSwitcher />
                              <NearbyPlacePrompt />
                              <EngagementNotifier />
                              <TaskNotifier />
                              <MoodSuggestionPrompt />
                              <IllnessVignette />
                            </VitaecomDraftProvider>
                            </VitaecomSocialProvider>
                          </IllnessProvider>
                        </NeedsProvider>
                      </MoodProvider>
                    </FinanceProvider>
                  </HealthProvider>
                </FeedProvider>
              </TasksProvider>
            </HouseholdProvider>
          </PlacesProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
