// Warframe data utilities
// NOTE: items.ts uses @wfcd/items which requires Node.js fs module
// Import items.ts directly in server components only

// Client-safe exports (no Node.js dependencies)
export * from "./types";
export * from "./categories";
export * from "./images";
export * from "./slugs";

// Server-only exports should be imported directly:
// import { getItemsByCategory, ... } from "@/lib/warframe/items";
