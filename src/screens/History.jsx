import { useEffect, useState } from "react";
import { TopBar } from "./Home";
import { supabase } from "../supabaseClient";

const ETICHETTE = {
  ingresso: { testo: "Entrata merce", colore: "#2E7D5B" },
  uscita_lavorazione: { testo: "Uscita lavorazione", colore: "#B5651D" },
  rientro: { testo: "Rientro a magazzino", colore: "#2A5C8A" },
  blocco_qualita: { testo: "Blocco qualità", colore: "#B23A3A" },
  sblocco_qualita: { testo: "Sblocco qualità", colore: "#2E7D5B" },
};

export default function History({ onBack }) {
  const [righe, setRighe] = useState([]);
  const [caricando, setCaricando] = useState(true);
  const [annullandoId, setAnnullandoId] = useState(null);

  async function carica() {
    setCaricando(true);
    const { data, error } = await supabase
      .from("movimenti")
      .select("id, bancale_id, tipo_movimento, numero_bancali, numero_scatole, creato_il, annullato, annullato_il, bancali(codice_materiale)")
      .order("creato_il", { ascending: false })
      .limit(30);
    if (!error) setRighe(data || []);
    setCaricando(false);
  }

  useEffect(() => {
    carica();
  }, []);

  async function annulla(riga) {
    const conferma = window.confirm(
      `Confermi di voler annullare questo movimento (${riga.bancali?.codice_materiale || ""})?\nResterà visibile nello storico come annullato, non verrà cancellato.`
    );
    if (!conferma) return;

    setAnnullandoId(riga.id);

    await supabase
      .from("movimenti")
      .update({ annullato: true, annullato_il: new Date().toISOString() })
      .eq("id", riga.id);

    await supabase
      .from("bancali")
      .update({ stato: "annullato" })
      .eq("id", riga.bancale_id);

    setAnnullandoId(null);
    carica();
  }

  return (
    <div>
      <TopBar title="Ultimi movimenti" onBack={onBack} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {caricando && <div style={{ color: "#5A6B73", textAlign: "center", marginTop: 30 }}>Carico…</div>}
        {!caricando && righe.length === 0 && (
          <div style={{ color: "#8A9AA2", textAlign: "center", marginTop: 30 }}>Nessun movimento ancora registrato.</div>
        )}
        {righe.map((r) => {
          const etichetta = ETICHETTE[r.tipo_movimento] || { testo: r.tipo_movimento, colore: "#8A9AA2" };
          const ora = new Date(r.creato_il).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
          return (
            <div
              key={r.id}
              style={{
                background: "#fff", borderRadius: 14, padding: 16, display: "flex", gap: 14, alignItems: "center",
                boxShadow: "0 1px 6px rgba(28,43,51,0.08)", opacity: r.annullato ? 0.55 : 1,
              }}
            >
              <div style={{ width: 8, height: 40, borderRadius: 4, background: r.annullato ? "#B7C2C7" : etichetta.colore }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1C2B33" }}>
                  {etichetta.testo} {r.annullato && <span style={{ color: "#B23A3A", fontSize: 12, fontWeight: 700 }}>· ANNULLATO</span>}
                </div>
                <div style={{ fontSize: 13, color: "#5A6B73" }}>
                  {r.bancali?.codice_materiale || "—"} · {r.numero_bancali} bancali · {r.numero_scatole} scatole cad. · {ora}
                </div>
              </div>
              {!r.annullato && (
                <button
                  onClick={() => annulla(r)}
                  disabled={annullandoId === r.id}
                  style={{
                    padding: "8px 12px", borderRadius: 10, border: "1px solid #E1E6E8",
                    background: "#F7F9FA", color: "#B23A3A", fontSize: 13, fontWeight: 700,
                    cursor: annullandoId === r.id ? "default" : "pointer", whiteSpace: "nowrap",
                  }}
                >
                  {annullandoId === r.id ? "…" : "Annulla"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
