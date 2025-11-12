import { generateStaticParams as genParams } from "./generateParams";

export { genParams as generateStaticParams };

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return children;
}

