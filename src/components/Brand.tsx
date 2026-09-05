export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <img src="/logo.png" alt="Del Valle Sushi" />
      <div>
        <small>Carta digital</small>
        <strong style={{ fontFamily: '"Shippori Mincho", serif', fontSize: compact ? 22 : 28 }}>
          Del Valle Sushi
        </strong>
      </div>
    </div>
  );
}
