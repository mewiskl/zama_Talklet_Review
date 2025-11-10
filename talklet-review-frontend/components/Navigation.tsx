"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Sessions", href: "/sessions" },
  { label: "Rankings", href: "/rankings" },
  { label: "My Reviews", href: "/my-reviews" },
  { label: "About", href: "/about" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl text-primary">
            Talklet Review
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <WalletButton />
      </div>
    </header>
  );
}

