"use client";
import { GuestHome } from "@/components/home/GuestHome";
import { MemberHome } from "@/components/home/MemberHome";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/Skeleton";

export default function HomePage() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <MemberHome /> : <GuestHome />;
}
