import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, RotateCcw, Search, BarChart3 } from "lucide-react";

export const AZIONI = {
  ingresso: { key: "ingresso", label: "Entrata merce", icon: ArrowDownToLine, color: "#2E7D5B", desc: "Registra un bancale in arrivo", tipoMovimento: "ingresso" },
  uscita: { key: "uscita", label: "Uscita lavorazione", icon: ArrowUpFromLine, color: "#B5651D", desc: "Manda un bancale al cliente", tipoMovimento: "uscita_lavorazione" },
  rientro: { key: "rientro", label: "Rientro a magazzino", icon: RotateCcw, color: "#2A5C8A", desc: "Bancale che torna indietro", tipoMovimento: "rientro" },
  blocco: { key: "blocco", label: "Blocco qualità", icon: AlertTriangle, color: "#B23A3A", desc: "Ferma la merce per controllo", tipoMovimento: "blocco_qualita" },
};

function BigButton({ item, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "28px 12px", borderRadius: 20, border: "none",
        background: "#fff", boxShadow: "0 2px 10px rgba(28,43,51,0.12)",
        cursor: "pointer", width: "100%",
      }}
    >
      <div style={{ width: 64, height: 64, borderRadius: 18, background: item.color + "1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={32} color={item.color} strokeWidth={2.2} />
      </div>
      <span style={{ fontSize: 17, fontWeight: 700, color: "#1C2B33", textAlign: "center" }}>{item.label}</span>
      <span style={{ fontSize: 13, color: "#5A6B73", textAlign: "center" }}>{item.desc}</span>
    </button>
  );
}

export default function Home({ onSelectAction, onVediStorico, onVediGiacenza }) {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ padding: "4px 4px 8px" }}>
        <div style={{ fontSize: 15, color: "#5A6B73" }}>Buongiorno</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1C2B33" }}>Cosa vuoi registrare?</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {Object.values(AZIONI).map((a) => (
          <BigButton key={a.key} item={a} onClick={() => onSelectAction(a)} />
        ))}
      </div>
      <button
        onClick={onVediGiacenza}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "16px", borderRadius: 16, border: "2px solid #E1E6E8", background: "#F7F9FA",
          color: "#1C2B33", fontSize: 16, fontWeight: 600, cursor: "pointer",
        }}
      >
        <BarChart3 size={20} /> Giacenza e report Excel
      </button>
      <button
        onClick={onVediStorico}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "16px", borderRadius: 16, border: "2px solid #E1E6E8", background: "#F7F9FA",
          color: "#1C2B33", fontSize: 16, fontWeight: 600, cursor: "pointer",
        }}
      >
        <Search size={20} /> Vedi ultimi movimenti
      </button>
    </div>
  );
}

export function TopBar({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 16px", background: "#1C2B33", color: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
      {onBack ? (
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", padding: 8, margin: -8, cursor: "pointer" }} aria-label="Indietro">
          ←
        </button>
      ) : (
        <Package size={26} />
      )}
      <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.2 }}>{title}</span>
    </div>
  );
}
