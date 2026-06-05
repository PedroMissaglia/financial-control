export default function TransacoesLoading() {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <div className="bg-muted h-8 w-48 animate-pulse rounded" />
      <div className="bg-muted h-64 animate-pulse rounded-xl" />
    </div>
  );
}
