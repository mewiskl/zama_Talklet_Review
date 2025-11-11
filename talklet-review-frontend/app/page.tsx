"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTalkletReview, type Session } from "@/hooks/useTalkletReview";
import { formatTimestamp, calculateAverageScore, truncateAddress } from "@/lib/utils";
import { Lock, BarChart3, Target, Zap } from "lucide-react";

export default function HomePage() {
  const { getSessionCount, getSession } = useTalkletReview();
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadRecentSessions();
  }, [getSessionCount, getSession]);

  async function loadRecentSessions() {
    const count = await getSessionCount();
    const sessions: Session[] = [];
    
    // Load last 6 sessions (in reverse order)
    const start = Math.max(0, count - 6);
    for (let i = count - 1; i >= start && i >= 0; i--) {
      const session = await getSession(i);
      if (session) sessions.push(session);
    }

    setRecentSessions(sessions);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4 text-primary">Talklet Review</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Privacy-Preserving Academic Feedback
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/sessions"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Explore Sessions
          </Link>
          <Link
            href="/organizer"
            className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Create Session
          </Link>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <FeatureCard
          icon={<Lock className="w-8 h-8" />}
          title="Privacy First"
          description="End-to-end encrypted ratings using FHE"
        />
        <FeatureCard
          icon={<BarChart3 className="w-8 h-8" />}
          title="Transparent Aggregation"
          description="Public aggregate statistics on-chain"
        />
        <FeatureCard
          icon={<Target className="w-8 h-8" />}
          title="Fair Ranking"
          description="Prevents cheating and manipulation"
        />
        <FeatureCard
          icon={<Zap className="w-8 h-8" />}
          title="Real-time Updates"
          description="Instant ranking updates"
        />
      </section>

      {/* Recent Sessions */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Recent Sessions</h2>
        {recentSessions.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No sessions yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 border border-border rounded-lg hover:shadow-md transition-shadow">
      <div className="text-primary mb-3">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const avgScore = session.isDecrypted && session.reviewCount > 0
    ? calculateAverageScore(
        session.decryptedClarity + session.decryptedInnovation + session.decryptedInspiration,
        session.reviewCount * 3
      )
    : null;

  return (
    <Link href={`/sessions/${session.id}`} className="block">
      <div className="p-6 border border-border rounded-lg hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold mb-1 line-clamp-2">{session.title}</h3>
            <p className="text-sm text-muted-foreground">
              {truncateAddress(session.speaker)}
            </p>
          </div>
          {session.isActive && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              Live
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground mb-3">
          {formatTimestamp(session.timestamp)}
        </div>
        <div className="flex items-center justify-between">
          {avgScore !== null ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">{avgScore}</span>
              <span className="text-sm text-muted-foreground">
                ({session.reviewCount} reviews)
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {session.reviewCount} reviews
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

