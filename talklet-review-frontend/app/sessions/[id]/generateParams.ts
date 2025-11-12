export async function generateStaticParams() {
  // Generate static paths for the first 20 sessions
  // This allows the static export to pre-render these pages
  return Array.from({ length: 20 }, (_, i) => ({
    id: i.toString(),
  }));
}

