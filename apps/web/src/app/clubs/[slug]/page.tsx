import type { Metadata } from "next";

import { ClubDetailClient } from "@/components/clubs/club-detail-client";

export const metadata: Metadata = {
  title: "Club — ECAMPUS Buzz",
  description: "Club details on ECAMPUS Buzz"
};

export default async function ClubDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ClubDetailClient slug={slug} />;
}
