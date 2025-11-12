import { Shield, Lock, BarChart3, GitBranch } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">About Talklet Review</h1>

      <div className="prose prose-lg max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">What is Talklet Review?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Talklet Review is a decentralized academic session review system built on FHEVM
            (Fully Homomorphic Encryption Virtual Machine). It allows participants to
            anonymously rate presentation quality (clarity, innovation, inspiration) while
            keeping individual scores private and only revealing aggregated statistics to
            organizers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              icon={<Lock />}
              title="End-to-End Encryption"
              description="Individual ratings are encrypted on your device before being sent to the blockchain."
            />
            <FeatureCard
              icon={<BarChart3 />}
              title="Homomorphic Aggregation"
              description="Scores are aggregated while still encrypted using FHE operations on-chain."
            />
            <FeatureCard
              icon={<Shield />}
              title="Privacy Guaranteed"
              description="Only aggregated results can be decrypted by organizers. Individual votes remain private."
            />
            <FeatureCard
              icon={<GitBranch />}
              title="Decentralized"
              description="No central authority. All logic runs on smart contracts."
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">FHEVM Technology</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This application uses Zama's FHEVM technology, which enables computations on
            encrypted data without decrypting it. Key operations include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <code>FHE.add()</code> - Homomorphic addition for aggregating encrypted scores
            </li>
            <li>
              <code>FHE.gt()</code> - Encrypted comparison for threshold checks
            </li>
            <li>
              <code>FHE.allow()</code> - Fine-grained access control for decryption
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">User Roles</h2>
          <div className="space-y-4">
            <RoleCard
              title="Organizer"
              description="Creates sessions, authorizes attendees, and can request decryption of aggregated scores."
            />
            <RoleCard
              title="Attendee"
              description="Submits encrypted reviews for sessions they are authorized to rate."
            />
            <RoleCard
              title="Speaker"
              description="Can view aggregated feedback for their presentations (if authorized by organizer)."
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">FAQ</h2>
          <div className="space-y-4">
            <FAQItem
              question="Can organizers see individual ratings?"
              answer="No. Only aggregated scores can be decrypted. Individual ratings remain encrypted forever."
            />
            <FAQItem
              question="Can I change my review?"
              answer="Yes, as long as the session is still active, you can update your review."
            />
            <FAQItem
              question="How long does decryption take?"
              answer="Typically 10-30 seconds, depending on the FHEVM Oracle load."
            />
            <FAQItem
              question="Which networks are supported?"
              answer="Local Hardhat network (for development) and Sepolia testnet."
            />
          </div>
        </section>

        <section className="border-t pt-8">
          <p className="text-sm text-muted-foreground">
            Built with FHEVM · Next.js · Ethers.js · Powered by Zama
          </p>
        </section>
      </div>
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
    <div className="p-4 border border-border rounded-lg">
      <div className="text-primary mb-2">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function RoleCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{question}</h4>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  );
}

