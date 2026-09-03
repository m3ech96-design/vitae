import type { Metadata, Viewport } from "next";
import { ProfileProvider } from "@/lib/profile-context";
import { PlacesProvider } from "@/lib/places-context";
import { HouseholdProvider } from "@/lib/household-context";
import { TasksProvider } from "@/lib/tasks-context";
import { FeedProvider } from "@/lib/feed-context";
import { HealthProvider } from "@/lib/health-context";
import { MedicalProvider } from "@/lib/medical-context";
import { FoodProvider } from "@/lib/food-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { DiaryProvider } from "@/lib/diary-context";
import { HobbyProvider } from "@/lib/hobby-context";
import { AnimalHealthProvider } from "@/lib/animal-health-context";
import { AnimalFoodProvider } from "@/lib/animal-food-context";
import { GenealogyProvider } from "@/lib/genealogy-context";
import { HouseholdMessagesProvider } from "@/lib/household-messages-context";
import { WidgetsProvider } from "@/lib/widgets/widgets-context";
import { FinanceProvider } from "@/lib/finance-context";
import { MoodProvider } from "@/lib/mood-context";
import { NeedsProvider } from "@/lib/needs-context";
import { VitaecomSocialProvider } from "@/lib/vitaecom-social-context";
import { VitaecomChatProvider } from "@/lib/vitaecom-chat-context";
import { VitaecomDraftProvider } from "@/lib/vitaecom-draft-context";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { DayRhythm } from "@/components/DayRhythm";
import { NavSwitcher } from "@/components/NavSwitcher";
import { NearbyPlacePrompt } from "@/components/household/NearbyPlacePrompt";
import { EngagementNotifier } from "@/components/persone/EngagementNotifier";
import { TaskNotifier } from "@/components/task/TaskNotifier";
import { MedicationNotifier } from "@/components/medical/MedicationNotifier";
import { AnimalNotifier } from "@/components/animali/AnimalNotifier";
import { MoodSuggestionPrompt } from "@/components/mood/MoodSuggestionPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vitae",
  description: "La tua vita, vissuta due volte.",
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
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="font-body antialiased">
        <ServiceWorkerRegister />
        <DayRhythm />
        <ProfileProvider>
          <PlacesProvider>
            <HouseholdProvider>
              <TasksProvider>
                <FeedProvider>
                  <HealthProvider>
                    <MedicalProvider>
                    <FoodProvider>
                    <WishlistProvider>
                    <DiaryProvider>
                    <HobbyProvider>
                    <AnimalHealthProvider>
                    <AnimalFoodProvider>
                    <GenealogyProvider>
                    <HouseholdMessagesProvider>
                    <WidgetsProvider>
                    <FinanceProvider>
                      <MoodProvider>
                        <NeedsProvider>
                          <VitaecomSocialProvider>
                            <VitaecomChatProvider>
                            <VitaecomDraftProvider>
                            {children}
                            <NavSwitcher />
                            <NearbyPlacePrompt />
                            <EngagementNotifier />
                            <TaskNotifier />
                            <MedicationNotifier />
                            <AnimalNotifier />
                            <MoodSuggestionPrompt />
                          </VitaecomDraftProvider>
                          </VitaecomChatProvider>
                          </VitaecomSocialProvider>
                        </NeedsProvider>
                      </MoodProvider>
                    </FinanceProvider>
                    </WidgetsProvider>
                    </HouseholdMessagesProvider>
                    </GenealogyProvider>
                    </AnimalFoodProvider>
                    </AnimalHealthProvider>
                    </HobbyProvider>
                    </DiaryProvider>
                    </WishlistProvider>
                    </FoodProvider>
                    </MedicalProvider>
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
