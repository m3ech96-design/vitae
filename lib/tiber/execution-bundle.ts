"use client";
import { useTasks } from "@/lib/tasks-context";
import { useFinance } from "@/lib/finance-context";
import { useNotes } from "@/lib/notes-context";
import { useFood } from "@/lib/food-context";
import { useMedical } from "@/lib/medical-context";
import { useAnimalHealth } from "@/lib/animal-health-context";
import { useAnimalFood } from "@/lib/animal-food-context";
import { useHousehold } from "@/lib/household-context";
import { usePlaces } from "@/lib/places-context";
import { useHobby } from "@/lib/hobby-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useDiary } from "@/lib/diary-context";
import { useMood } from "@/lib/mood-context";
import { useNeeds } from "@/lib/needs-context";
import { useHealth } from "@/lib/health-context";
import { useWorkoutPlans } from "@/lib/workout-plans-context";
import { TiberExecutionContext } from "./tool-types";

/**
 * Chiama una volta tutti gli hook dei context di cui i tool di Tiber hanno bisogno (vedi
 * ogni file in tools/*.ts, che legge da uno di questi campi tramite ctxField) e li assembla
 * in un unico oggetto piatto — le chiavi qui DEVONO combaciare con quelle lette da ciascun
 * tool (es. "finance" per financeTools, "moodModule" per moodTools).
 *
 * Vive come hook a parte (invece che dentro TiberProvider) perché deve stare sotto tutti i
 * provider dei moduli dell'app nell'albero dei componenti — la pagina di Tiber lo chiama e
 * passa il risultato a TiberProvider come prop, non il contrario.
 */
export function useTiberExecutionContext(): TiberExecutionContext {
  const tasks = useTasks();
  const finance = useFinance();
  const notes = useNotes();
  const food = useFood();
  const health = useMedical();
  const animalHealth = useAnimalHealth();
  const animalFood = useAnimalFood();
  const household = useHousehold();
  const places = usePlaces();
  const hobby = useHobby();
  const wishlist = useWishlist();
  const diary = useDiary();
  const mood = useMood();
  const needs = useNeeds();
  const activity = useHealth();
  const workoutPlans = useWorkoutPlans();

  return {
    tasks,
    finance,
    notes,
    food,
    health,
    animals: { people: household.people, health: animalHealth, food: animalFood },
    people: {
      people: household.people,
      addPerson: household.addPerson,
      updatePerson: household.updatePerson,
      removePerson: household.removePerson,
    },
    /** Riusa il rilevamento di posizione già esistente per il pallino "Sei Qui"/Casa-Fuori
     * casa (vedi household-context.tsx) invece di aprirne uno indipendente — stesso
     * `trackingEnabled` scelto dall'utente in Mappa, non un permesso separato per Tiber. */
    location: {
      currentPlaceIcon: household.currentPlaceIcon,
      userIsAway: household.userIsAway,
      livePosition: household.livePosition,
      trackingEnabled: household.trackingEnabled,
      home: household.home,
    },
    places,
    hobby,
    wishlist,
    diary,
    moodModule: { mood, needs },
    activity,
    workoutPlans,
  };
}
