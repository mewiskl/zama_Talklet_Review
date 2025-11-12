"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTalkletReview, type Session } from "@/hooks/useTalkletReview";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { formatTimestamp } from "@/lib/utils";

type Tab = "create" | "manage";

export default function OrganizerPage() {
  const router = useRouter();
  const { createSession, closeSession, getSessionCount, getSession, isLoading } = useTalkletReview();
  const { isConnected, accounts } = useMetaMaskProvider();
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [attendees, setAttendees] = useState("");
  const [mySessions, setMySessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (activeTab === "manage" && isConnected && accounts.length > 0) {
      loadMySessions();
    }
  }, [activeTab, isConnected, accounts]);

  async function loadMySessions() {
    if (accounts.length === 0) return;
    
    setLoadingSessions(true);
    try {
      const count = await getSessionCount();
      const organized: Session[] = [];

      for (let i = 0; i < count; i++) {
        const session = await getSession(i);
        if (session && session.organizer.toLowerCase() === accounts[0].toLowerCase()) {
          organized.push(session);
        }
      }

      setMySessions(organized);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const attendeeList = attendees
      .split(",")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    try {
      const sessionId = await createSession(title, speaker, attendeeList);
      if (sessionId !== null) {
        alert(`Session created successfully! Session ID: ${sessionId}`);
        setTitle("");
        setSpeaker("");
        setAttendees("");
        router.push(`/sessions/${sessionId}`);
      }
    } catch (error) {
      alert(`Failed to create session: ${error}`);
    }
  }

  async function handleCloseSession(sessionId: number) {
    if (!confirm("Are you sure you want to close this session? This action cannot be undone.")) {
      return;
    }

    try {
      await closeSession(sessionId);
      alert("Session closed successfully!");
      await loadMySessions();
    } catch (error) {
      alert(`Failed to close session: ${error}`);
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">
          Please connect your wallet to access organizer dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Organizer Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-border">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "create"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Create Session
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "manage"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Manage Sessions
        </button>
      </div>

      {/* Create Session Tab */}
      {activeTab === "create" && (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium mb-2">Session Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Advances in Federated Learning Privacy"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Speaker Address *</label>
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              required
              placeholder="0x..."
              className="w-full px-4 py-2 border border-border rounded-lg bg-background font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Authorized Attendees (optional)
            </label>
            <textarea
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Comma-separated addresses: 0x123..., 0x456..."
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to make it public, or enter addresses separated by commas.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-border rounded-lg hover:bg-muted"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      )}

      {/* Manage Sessions Tab */}
      {activeTab === "manage" && (
        <div>
          {loadingSessions ? (
            <div className="text-center py-12">Loading your sessions...</div>
          ) : mySessions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">You haven't created any sessions yet.</p>
              <button
                onClick={() => setActiveTab("create")}
                className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Create Your First Session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mySessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClose={handleCloseSession}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  onClose,
  isLoading,
}: {
  session: Session;
  onClose: (id: number) => void;
  isLoading: boolean;
}) {
  return (
    <div className="border border-border rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">{session.title}</h3>
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
            Created {formatTimestamp(session.timestamp)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-muted-foreground">Reviews:</span>{" "}
          <span className="font-medium">{session.reviewCount}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Speaker:</span>{" "}
          <span className="font-mono text-xs">
            {session.speaker.slice(0, 6)}...{session.speaker.slice(-4)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/sessions/${session.id}`}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
        >
          View Details
        </Link>
        {session.isActive && (
          <button
            onClick={() => onClose(session.id)}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Closing..." : "Close Session"}
          </button>
        )}
      </div>
    </div>
  );
}

