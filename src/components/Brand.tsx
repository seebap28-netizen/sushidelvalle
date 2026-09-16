export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand${compact ? " compact" : ""}`}>
      <img src="/logo.png" alt="Del Valle Sushi" />
      <strong>Carta Del Valle Sushi</strong>
    </div>
  );
}
