import type { Metadata, Viewport } from "next";
import { ProfileProvider } from "@/lib/profile-context";
import { PlacesProvider } from "@/lib/places-context";
import { HouseholdProvider } from "@/lib/household-context";
import { TasksProvider } from "@/lib/tasks-context";
import { FeedProvider } from "@/lib/feed-context";
import { HealthProvider } from "@/lib/health-context";
import { WorkoutPlansProvider } from "@/lib/workout-plans-context";
import { NotesProvider } from "@/lib/notes-context";
import { MedicalProvider } from "@/lib/medical-context";
import { FoodProvider } from "@/lib/food-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { DiaryProvider } from "@/lib/diary-context";
import { HobbyProvider } from "@/lib/hobby-context";
import { AnimalHealthProvider } from "@/lib/animal-health-context";
import { AnimalFoodProvider } from "@/lib/animal-food-context";
import { NewsSourcesProvider } from "@/lib/news-sources-context";
import { HouseholdMessagesProvider } from "@/lib/household-messages-context";
import { WidgetsProvider } from "@/lib/widgets/widgets-context";
import { ShortcutsProvider } from "@/lib/shortcuts-context";
import { QuickInteractionProvider } from "@/lib/quick-interaction-context";
import { FinanceProvider } from "@/lib/finance-context";
import { MoodProvider } from "@/lib/mood-context";
import { NeedsProvider } from "@/lib/needs-context";
import { AppUpdateProvider } from "@/lib/app-update-context";
import { AppUpdateBanner } from "@/components/AppUpdateBanner";
import { HobbyTimerProvider } from "@/lib/hobby-timer-context";
import { FloatingHobbyTimerPill } from "@/components/hobby/FloatingHobbyTimerPill";
import { DayRhythm } from "@/components/DayRhythm";
import { BottomNav } from "@/components/BottomNav";
import { NearbyPlacePrompt } from "@/components/household/NearbyPlacePrompt";
import { EngagementNotifier } from "@/components/persone/EngagementNotifier";
import { TaskNotifier } from "@/components/task/TaskNotifier";
import { MedicationNotifier } from "@/components/medical/MedicationNotifier";
import { VaccinationNotifier } from "@/components/medical/VaccinationNotifier";
import { AnimalNotifier } from "@/components/animali/AnimalNotifier";
import { PantryNotifier } from "@/components/food/PantryNotifier";
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
        <AppUpdateProvider>
        <AppUpdateBanner />
        <DayRhythm />
        <HobbyTimerProvider>
        <ProfileProvider>
          <PlacesProvider>
            <HouseholdProvider>
              <TasksProvider>
                <FeedProvider>
                  <HealthProvider>
                  <WorkoutPlansProvider>
                  <NotesProvider>
                    <MedicalProvider>
                    <FoodProvider>
                    <WishlistProvider>
                    <DiaryProvider>
                    <HobbyProvider>
                    <AnimalHealthProvider>
                    <AnimalFoodProvider>
                    <NewsSourcesProvider>
                    <HouseholdMessagesProvider>
                    <WidgetsProvider>
                    <ShortcutsProvider>
                    <QuickInteractionProvider>
                    <FinanceProvider>
                      <MoodProvider>
                        <NeedsProvider>
                            {children}
                            <BottomNav />
                            <FloatingHobbyTimerPill />
                            <NearbyPlacePrompt />
                            <EngagementNotifier />
                            <TaskNotifier />
                            <MedicationNotifier />
                            <VaccinationNotifier />
                            <AnimalNotifier />
                            <PantryNotifier />
                            <MoodSuggestionPrompt />
                        </NeedsProvider>
                      </MoodProvider>
                    </FinanceProvider>
                    </QuickInteractionProvider>
                    </ShortcutsProvider>
                    </WidgetsProvider>
                    </HouseholdMessagesProvider>
                    </NewsSourcesProvider>
                    </AnimalFoodProvider>
                    </AnimalHealthProvider>
                    </HobbyProvider>
                    </DiaryProvider>
                    </WishlistProvider>
                    </FoodProvider>
                    </MedicalProvider>
                  </NotesProvider>
                  </WorkoutPlansProvider>
                  </HealthProvider>
                </FeedProvider>
              </TasksProvider>
            </HouseholdProvider>
          </PlacesProvider>
        </ProfileProvider>
        </HobbyTimerProvider>
        </AppUpdateProvider>
      </body>
    </html>
  );
}
