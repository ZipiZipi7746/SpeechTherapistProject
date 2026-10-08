import { demoRepo } from "./demo";
import type { Repo } from "./repo";
import { supabaseRepo } from "./supabase";

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Demo mode (browser-only fake backend with publicly known demo logins) is for local development.
 * In a production build it is OFF unless explicitly enabled with NEXT_PUBLIC_ALLOW_DEMO=true, so a deployment
 * that forgot its Supabase variables shows a "not configured" page instead of an open demo with known passwords.
 */
export const isDemoMode = !hasSupabase && (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ALLOW_DEMO === "true");
export const isMisconfigured = !hasSupabase && !isDemoMode;

/** The single data-access entry point. */
export const repo: Repo = isDemoMode ? demoRepo : supabaseRepo;
export { AppError } from "./repo";
export type { Repo } from "./repo";
