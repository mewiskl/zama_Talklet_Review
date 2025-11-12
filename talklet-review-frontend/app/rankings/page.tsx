"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTalkletReview, type Session } from "@/hooks/useTalkletReview";
import { calculateAverageScore, truncateAddress } from "@/lib/utils";
import { Trophy } from "lucide-react";

export default function RankingsPage() {
  const { getSessionCount, getSession } = useTalkletReview();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [getSessionCount, getSession]);

  async function loadSessions() {
    setLoading(true);
    const count = await getSessionCount();
    const loadedSessions: Session[] = [];

    for (let i = 0; i < count; i++) {
      const session = await getSession(i);
      // Only include closed sessions with decrypted scores
      if (session && !session.isActive && session.isDecrypted && session.reviewCount > 0) {
        loadedSessions.push(session);
      }
    }

    // Sort by overall average score (descending)
    loadedSessions.sort((a, b) => {
      const avgA = (a.decryptedClarity + a.decryptedInnovation + a.decryptedInspiration) / (a.reviewCount * 3);
      const avgB = (b.decryptedClarity + b.decryptedInnovation + b.decryptedInspiration) / (b.reviewCount * 3);
      return avgB - avgA;
    });

    setSessions(loadedSessions);
    setLoading(false);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-bold">Top Rated Sessions</h1>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading rankings...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No ranked sessions yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Sessions appear here once they are closed and scores are decrypted.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => (
            <RankingCard key={session.id} session={session} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function RankingCard({ session, rank }: { session: Session; rank: number }) {
  const avgOverall = calculateAverageScore(
    session.decryptedClarity + session.decryptedInnovation + session.decryptedInspiration,
    session.reviewCount * 3
  );
  const avgClarity = calculateAverageScore(session.decryptedClarity, session.reviewCount);
  const avgInnovation = calculateAverageScore(session.decryptedInnovation, session.reviewCount);
  const avgInspiration = calculateAverageScore(session.decryptedInspiration, session.reviewCount);

  return (
    <Link href={`/sessions/${session.id}`} className="block">
      <div className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                rank === 1
                  ? "bg-yellow-100 text-yellow-800"
                  : rank === 2
                  ? "bg-gray-200 text-gray-700"
                  : rank === 3
                  ? "bg-orange-100 text-orange-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              #{rank}
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{session.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Speaker: {truncateAddress(session.speaker)} · {session.reviewCount} reviews
            </p>

            <div className="grid grid-cols-4 gap-4">
              <ScoreBadge label="Overall" score={avgOverall} isPrimary />
              <ScoreBadge label="Clarity" score={avgClarity} />
              <ScoreBadge label="Innovation" score={avgInnovation} />
              <ScoreBadge label="Inspiration" score={avgInspiration} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ScoreBadge({
  label,
  score,
  isPrimary = false,
}: {
  label: string;
  score: number;
  isPrimary?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`text-2xl font-bold ${isPrimary ? "text-primary" : "text-foreground"}`}
      >
        {score.toFixed(1)}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

