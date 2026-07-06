import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../supabaseClient";

// Ricerca "mentre scrivi": l'operatore digita anche solo 3 caratteri
// del codice materiale o della descrizione, e il sistema propone le righe che combaciano.
export default function RicercaManuale({ onSelezionato }) {
  const [testo, setTesto] = useState("");
  const [risultati, setRisultati] = useState([]);
  const [cercando, setCercando] = useState(false);

  async function cerca(valore) {
    setTesto(valore);
    if (valore.trim().length < 3) {
      setRisultati([]);
      return;
    }
    setCercando(true);
    const { data, error } = await supabase
      .from("materiali")
      .select("codice_materiale, codice_cliente, descrizione, pezzi_per_bancale")
      .or(`codice_materiale.ilike.%${valore}%,descrizione.ilike.%${valore}%`)
      .limit(15);
    setCercando(false);
    if (!error) setRisultati(data || []);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative" }}>
        <Search size={18} color="#5A6B73" style={{ position: "absolute", left: 14, top: 14 }} />
        <input
          value={testo}
          onChange={(e) => cerca(e.target.value)}
          placeholder="Scrivi codice materiale o descrizione…"
          style={{
            width: "100%",
            padding: "14px 14px 14px 42px",
            borderRadius: 14,
            border: "2px solid #E1E6E8",
            fontSize: 16,
            boxSizing: "border-box",
          }}
        />
      </div>

      {cercando && <div style={{ color: "#5A6B73", fontSize: 14 }}>Cerco…</div>}

      {risultati.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
          {risultati.map((r) => (
            <button
              key={r.codice_materiale}
              onClick={() => onSelezionato(r)}
              style={{
                textAlign: "left",
                background: "#fff",
                border: "1px solid #E1E6E8",
                borderRadius: 14,
                padding: "12px 14px",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, color: "#1C2B33", fontSize: 15 }}>{r.codice_materiale}</div>
              <div style={{ fontSize: 13, color: "#5A6B73" }}>{r.descrizione || "(senza descrizione)"}</div>
              <div style={{ fontSize: 12, color: "#8A9AA2" }}>Cliente: {r.codice_cliente} · {r.pezzi_per_bancale} scatole/pallet</div>
            </button>
          ))}
        </div>
      )}

      {testo.trim().length >= 3 && !cercando && risultati.length === 0 && (
        <div style={{ color: "#8A9AA2", fontSize: 14 }}>Nessun materiale trovato con questo testo.</div>
      )}
    </div>
  );
}
