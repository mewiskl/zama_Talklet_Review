"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTalkletReview, type Session } from "@/hooks/useTalkletReview";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { formatTimestamp } from "@/lib/utils";

export default function MyReviewsPage() {
  const { getSessionCount, getSession, hasReviewed } = useTalkletReview();
  const { accounts, isConnected } = useMetaMaskProvider();
  const [reviewedSessions, setReviewedSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && accounts.length > 0) {
      loadReviewedSessions();
    } else {
      setLoading(false);
      setReviewedSessions([]);
    }
  }, [accounts, isConnected, getSessionCount, getSession, hasReviewed]);

  async function loadReviewedSessions() {
    if (accounts.length === 0) return;
    
    setLoading(true);
    try {
      const count = await getSessionCount();
      const reviewed: Session[] = [];

      for (let i = 0; i < count; i++) {
        const hasRev = await hasReviewed(i, accounts[0]);
        if (hasRev) {
          const session = await getSession(i);
          if (session) reviewed.push(session);
        }
      }

      setReviewedSessions(reviewed);
    } catch (error) {
      console.error("Failed to load reviewed sessions:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">
          Please connect your wallet to view your reviews.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">My Review History</h1>

      {loading ? (
        <div className="text-center py-12">Loading your reviews...</div>
      ) : reviewedSessions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">You haven't reviewed any sessions yet.</p>
          <Link
            href="/sessions"
            className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Browse Sessions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewedSessions.map((session) => (
            <ReviewCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ session }: { session: Session }) {
  return (
    <Link href={`/sessions/${session.id}`} className="block">
      <div className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{session.title}</h3>
            <p className="text-sm text-muted-foreground">
              Reviewed on {formatTimestamp(session.timestamp)}
            </p>
          </div>
          <span
            className={`px-3 py-1 text-sm rounded-full ${
              session.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {session.isActive ? "Active" : "Closed"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {session.reviewCount} total reviews
        </p>
      </div>
    </Link>
  );
}

