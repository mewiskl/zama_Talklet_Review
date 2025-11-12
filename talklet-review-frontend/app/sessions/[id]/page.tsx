"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTalkletReview, type Session } from "@/hooks/useTalkletReview";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringInMemoryStorage } from "@/fhevm/GenericStringStorage";
import { formatTimestamp, calculateAverageScore, truncateAddress } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.id);
  const { 
    getSession, 
    hasReviewed, 
    isAuthorized, 
    requestDecryption, 
    storeDecryptedScores,
    contract,
    isLoading 
  } = useTalkletReview();
  const { accounts, isConnected } = useMetaMaskProvider();
  const { ethersSigner } = useMetaMaskEthersSigner();
  const { instance: fhevmInstance } = useFhevm();
  const fhevmDecryptionSignatureStorage = useMemo(() => new GenericStringInMemoryStorage(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [userIsAuthorized, setUserIsAuthorized] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId, getSession, hasReviewed, isAuthorized, accounts]);

  async function loadSession() {
    try {
      const s = await getSession(sessionId);
      console.log("[SessionDetail] Loaded session:", s);
      setSession(s);

      if (isConnected && accounts.length > 0) {
        const reviewed = await hasReviewed(sessionId);
        const authorized = await isAuthorized(sessionId);
        setUserHasReviewed(reviewed);
        setUserIsAuthorized(authorized);
        
        // Check if current user is organizer
        if (s && accounts[0]) {
          setIsOrganizer(s.organizer.toLowerCase() === accounts[0].toLowerCase());
        }
      }
    } catch (error) {
      console.error("[SessionDetail] Failed to load session:", error);
    }
  }

  async function handleRequestDecryption() {
    console.log("[Decryption] Checking prerequisites:", {
      hasSession: !!session,
      hasContract: !!contract,
      hasFhevmInstance: !!fhevmInstance,
      hasEthersSigner: !!ethersSigner,
      accountsLength: accounts.length,
    });

    if (!session) {
      alert("Session not loaded");
      return;
    }
    if (!contract) {
      alert("Contract not initialized");
      return;
    }
    if (!fhevmInstance) {
      alert("FHEVM instance not initialized. Please wait for it to load.");
      return;
    }
    if (!ethersSigner) {
      alert("Ethers signer not available. Please ensure your wallet is connected.");
      return;
    }
    if (accounts.length === 0) {
      alert("No wallet account connected");
      return;
    }

    setIsDecrypting(true);
    try {
      console.log("[Decryption] Step 1: Requesting decryption...");
      
      // Step 1: Request decryption (triggers event)
      await requestDecryption(sessionId);
      console.log("[Decryption] Step 1 complete");

      // Step 2: Get contract address for decryption
      const contractAddress = await contract.getAddress();
      console.log("[Decryption] Contract address:", contractAddress);

      // Step 3: Get encrypted handles from contract
      console.log("[Decryption] Step 2: Getting session data...");
      const sessionData = await contract.sessions(sessionId);
      
      const clarityHandle = sessionData.aggregatedClarity;
      const innovationHandle = sessionData.aggregatedInnovation;
      const inspirationHandle = sessionData.aggregatedInspiration;
      
      console.log("[Decryption] Handles:", {
        clarity: clarityHandle,
        innovation: innovationHandle,
        inspiration: inspirationHandle,
      });

      // Step 4: Load or sign decryption signature
      console.log("[Decryption] Step 3: Getting decryption signature...");
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [contractAddress],
        ethersSigner,
        fhevmDecryptionSignatureStorage
      );

      if (!sig) {
        throw new Error("Failed to get decryption signature");
      }

      console.log("[Decryption] Signature obtained");

      // Step 5: Decrypt using FHEVM
      console.log("[Decryption] Step 4: Decrypting scores...");
      const decryptedResults = await fhevmInstance.userDecrypt(
        [
          { handle: clarityHandle, contractAddress },
          { handle: innovationHandle, contractAddress },
          { handle: inspirationHandle, contractAddress },
        ],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      console.log("[Decryption] Raw decrypted results:", decryptedResults);
      console.log("[Decryption] Handle mapping:", {
        clarityHandle,
        innovationHandle,
        inspirationHandle,
      });
      
      const decryptedClarity = Number(decryptedResults[clarityHandle]);
      const decryptedInnovation = Number(decryptedResults[innovationHandle]);
      const decryptedInspiration = Number(decryptedResults[inspirationHandle]);

      console.log("[Decryption] Decrypted values:", {
        clarity: decryptedClarity,
        innovation: decryptedInnovation,
        inspiration: decryptedInspiration,
      });
      
      console.log("[Decryption] Values to be stored:", {
        sessionId,
        clarity: decryptedClarity,
        innovation: decryptedInnovation,
        inspiration: decryptedInspiration,
      });

      // Step 6: Store decrypted scores
      console.log("[Decryption] Step 5: Storing decrypted scores...");
      await storeDecryptedScores(
        sessionId,
        decryptedClarity,
        decryptedInnovation,
        decryptedInspiration
      );
      
      console.log("[Decryption] Storage complete! Reloading session...");
      
      // Wait a moment for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload and verify
      await loadSession();
      const verifySession = await getSession(sessionId);
      console.log("[Decryption] Verification - stored values:", {
        decryptedClarity: verifySession?.decryptedClarity,
        decryptedInnovation: verifySession?.decryptedInnovation,
        decryptedInspiration: verifySession?.decryptedInspiration,
      });
      
      console.log("[Decryption] Complete!");
      alert("Scores decrypted and stored successfully!");
    } catch (error) {
      console.error("[Decryption] Error:", error);
      alert(`Failed to decrypt scores: ${error}`);
    } finally {
      setIsDecrypting(false);
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading session...</p>
      </div>
    );
  }

  const avgClarity =
    session.isDecrypted && session.reviewCount > 0
      ? calculateAverageScore(session.decryptedClarity, session.reviewCount)
      : null;
  const avgInnovation =
    session.isDecrypted && session.reviewCount > 0
      ? calculateAverageScore(session.decryptedInnovation, session.reviewCount)
      : null;
  const avgInspiration =
    session.isDecrypted && session.reviewCount > 0
      ? calculateAverageScore(session.decryptedInspiration, session.reviewCount)
      : null;
  const avgOverall =
    avgClarity !== null && avgInnovation !== null && avgInspiration !== null
      ? ((avgClarity + avgInnovation + avgInspiration) / 3).toFixed(1)
      : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/sessions"
        className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sessions
      </Link>

      <div className="border border-border rounded-lg p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold flex-1">{session.title}</h1>
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

        <div className="space-y-2 text-sm mb-6">
          <p>
            <span className="font-medium">Speaker:</span>{" "}
            {truncateAddress(session.speaker)}
          </p>
          <p>
            <span className="font-medium">Organizer:</span>{" "}
            {truncateAddress(session.organizer)}
          </p>
          <p>
            <span className="font-medium">Date:</span>{" "}
            {formatTimestamp(session.timestamp)}
          </p>
        </div>

        {avgOverall !== null && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">
              Aggregated Ratings ({session.reviewCount} reviews)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ScoreCard label="Overall" score={avgOverall} />
              <ScoreCard label="Clarity" score={avgClarity!.toFixed(1)} />
              <ScoreCard label="Innovation" score={avgInnovation!.toFixed(1)} />
              <ScoreCard label="Inspiration" score={avgInspiration!.toFixed(1)} />
            </div>
          </div>
        )}

        {!session.isDecrypted && session.reviewCount > 0 && (
          <div className="border-t pt-6">
            <p className="text-muted-foreground mb-4">
              {session.reviewCount} reviews submitted. Awaiting decryption by organizer.
            </p>
            {isOrganizer && !session.isActive && (
              <button
                onClick={handleRequestDecryption}
                disabled={isLoading || isDecrypting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isDecrypting ? "Decrypting..." : "Request Decryption"}
              </button>
            )}
          </div>
        )}
      </div>

      {isConnected && userIsAuthorized && session.isActive && (
        <div className="border border-border rounded-lg p-6">
          {userHasReviewed ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                You have already reviewed this session.
              </p>
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
              >
                Update Review
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Submit Review
            </button>
          )}
        </div>
      )}

      {showReviewForm && (
        <ReviewForm
          sessionId={sessionId}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            setShowReviewForm(false);
            loadSession();
          }}
        />
      )}
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: string }) {
  return (
    <div className="bg-muted p-4 rounded-lg text-center">
      <div className="text-3xl font-bold text-primary mb-1">{score}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ReviewForm({
  sessionId,
  onClose,
  onSuccess,
}: {
  sessionId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { submitReview, isLoading } = useTalkletReview();
  const [clarity, setClarity] = useState(5);
  const [innovation, setInnovation] = useState(5);
  const [inspiration, setInspiration] = useState(5);
  const [tags, setTags] = useState(0);
  const [qaDuration, setQaDuration] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submitReview(sessionId, {
        clarity,
        innovation,
        inspiration,
        tags,
        qaDuration,
      });
      onSuccess();
    } catch (error) {
      alert(`Failed to submit review: ${error}`);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
        <h2 className="text-2xl font-bold mb-6">Submit Review</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RatingInput label="Clarity (1-10)" value={clarity} onChange={setClarity} />
          <RatingInput
            label="Innovation (1-10)"
            value={innovation}
            onChange={setInnovation}
          />
          <RatingInput
            label="Inspiration (1-10)"
            value={inspiration}
            onChange={setInspiration}
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Question Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              <TagCheckbox label="Technical" bit={0} tags={tags} setTags={setTags} />
              <TagCheckbox label="Application" bit={1} tags={tags} setTags={setTags} />
              <TagCheckbox label="Theoretical" bit={2} tags={tags} setTags={setTags} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Q&A Duration (minutes, optional)
            </label>
            <input
              type="number"
              min="0"
              value={qaDuration}
              onChange={(e) => setQaDuration(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}: <span className="text-primary font-bold">{value}</span>
      </label>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function TagCheckbox({
  label,
  bit,
  tags,
  setTags,
}: {
  label: string;
  bit: number;
  tags: number;
  setTags: (t: number) => void;
}) {
  const checked = (tags & (1 << bit)) !== 0;
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          if (e.target.checked) {
            setTags(tags | (1 << bit));
          } else {
            setTags(tags & ~(1 << bit));
          }
        }}
        className="rounded"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

