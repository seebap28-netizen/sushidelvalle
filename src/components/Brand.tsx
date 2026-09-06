export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <img src="/logo.png" alt="Del Valle Sushi" />
      <strong style={{ fontFamily: '"Shippori Mincho", serif', fontSize: compact ? 20 : 26 }}>
        Carta digital Del Valle Sushi
      </strong>
    </div>
  );
}
