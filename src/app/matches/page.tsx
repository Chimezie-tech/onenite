import AdBanner from "@/components/ads/AdBanner";

export default function MatchesPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 pb-24">
      <p className="text-lg font-bold text-ink">Chats 💬</p>
      <p className="text-sm text-muted">Your conversations appear here in Phase 9.</p>
      <AdBanner placement="chat" />
    </main>
  );
}