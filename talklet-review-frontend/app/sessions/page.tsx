"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTalkletReview, type Session } from "@/hooks/useTalkletReview";
import { formatTimestamp, calculateAverageScore, truncateAddress } from "@/lib/utils";

export default function SessionsPage() {
  const { getSessionCount, getSession } = useTalkletReview();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [getSessionCount, getSession]);

  async function loadSessions() {
    setLoading(true);
    const count = await getSessionCount();
    const loadedSessions: Session[] = [];

    for (let i = count - 1; i >= 0; i--) {
      const session = await getSession(i);
      if (session) loadedSessions.push(session);
    }

    setSessions(loadedSessions);
    setLoading(false);
  }

  const filteredSessions = sessions.filter((s) => {
    if (filter === "active") return s.isActive;
    if (filter === "closed") return !s.isActive;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Sessions</h1>
        <div className="flex gap-2">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="All"
          />
          <FilterButton
            active={filter === "active"}
            onClick={() => setFilter("active")}
            label="Active"
          />
          <FilterButton
            active={filter === "closed"}
            onClick={() => setFilter("closed")}
            label="Closed"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No sessions found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

function SessionCard({ session }: { session: Session }) {
  const avgScore =
    session.isDecrypted && session.reviewCount > 0
      ? calculateAverageScore(
          session.decryptedClarity +
            session.decryptedInnovation +
            session.decryptedInspiration,
          session.reviewCount * 3
        )
      : null;

  return (
    <Link href={`/sessions/${session.id}`} className="block">
      <div className="p-6 border border-border rounded-lg hover:shadow-md transition-shadow h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold mb-1 line-clamp-2">{session.title}</h3>
            <p className="text-sm text-muted-foreground">
              Speaker: {truncateAddress(session.speaker)}
            </p>
          </div>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              session.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {session.isActive ? "Live" : "Closed"}
          </span>
        </div>
        <div className="text-sm text-muted-foreground mb-3">
          {formatTimestamp(session.timestamp)}
        </div>
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
    </Link>
  );
}

