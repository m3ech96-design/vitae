"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { UserProfile, createEmptyProfile } from "./types";

const STORAGE_KEY = "vitae:profile";

interface ProfileContextValue {
  profile: UserProfile;
  hydrated: boolean;
  updateProfile: (patch: Partial<UserProfile>) => void;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(createEmptyProfile);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserProfile;
        setProfile({ ...createEmptyProfile(), ...parsed });
      }
    } catch {
      // dati locali non leggibili: si riparte da un profilo vuoto
    } finally {
      setHydrated(true);
    }
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage pieno o non disponibile: la sessione continua solo in memoria
      }
      return next;
    });
  }, []);

  const resetProfile = useCallback(() => {
    const empty = createEmptyProfile();
    setProfile(empty);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignorato
    }
  }, []);

  const value = useMemo(
    () => ({ profile, hydrated, updateProfile, resetProfile }),
    [profile, hydrated, updateProfile, resetProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile va usato dentro un ProfileProvider");
  return ctx;
}
