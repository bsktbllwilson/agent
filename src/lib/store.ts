"use client";

import type { Partner, Guide, WaitlistEntry } from "./types";
import { partners as seedPartners, guides as seedGuides } from "./seed-data";

function generateId() {
  return crypto.randomUUID();
}

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Initialize seed data with IDs
const defaultPartners: Partner[] = seedPartners.map((p) => ({
  ...p,
  id: generateId(),
  created_at: new Date().toISOString(),
}));

const defaultGuides: Guide[] = seedGuides.map((g) => ({
  ...g,
  id: generateId(),
  created_at: new Date().toISOString(),
}));

// --- Partners ---
export function getPartners(): Partner[] {
  return getFromStorage<Partner[]>("bridgeeast_partners", defaultPartners);
}

export function addPartner(data: Omit<Partner, "id" | "created_at">): Partner {
  const partners = getPartners();
  const newPartner: Partner = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  const updated = [newPartner, ...partners];
  saveToStorage("bridgeeast_partners", updated);
  return newPartner;
}

export function deletePartner(id: string) {
  const partners = getPartners();
  saveToStorage("bridgeeast_partners", partners.filter((p) => p.id !== id));
}

// --- Guides ---
export function getGuides(): Guide[] {
  return getFromStorage<Guide[]>("bridgeeast_guides", defaultGuides);
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return getGuides().find((g) => g.slug === slug);
}

export function addGuide(data: Omit<Guide, "id" | "created_at">): Guide {
  const guides = getGuides();
  const newGuide: Guide = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  const updated = [newGuide, ...guides];
  saveToStorage("bridgeeast_guides", updated);
  return newGuide;
}

export function deleteGuide(id: string) {
  const guides = getGuides();
  saveToStorage("bridgeeast_guides", guides.filter((g) => g.id !== id));
}

// --- Waitlist ---
export function getWaitlist(): WaitlistEntry[] {
  return getFromStorage<WaitlistEntry[]>("bridgeeast_waitlist", []);
}

export function addWaitlistEntry(
  data: Omit<WaitlistEntry, "id" | "created_at">
): WaitlistEntry {
  const entries = getWaitlist();
  const newEntry: WaitlistEntry = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  const updated = [newEntry, ...entries];
  saveToStorage("bridgeeast_waitlist", updated);
  return newEntry;
}

// --- Admin Auth (simple password-based) ---
const ADMIN_PASSWORD = "bridgeeast2024";

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem("bridgeeast_admin", "true");
    return true;
  }
  return false;
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("bridgeeast_admin") === "true";
}

export function adminLogout() {
  sessionStorage.removeItem("bridgeeast_admin");
}
