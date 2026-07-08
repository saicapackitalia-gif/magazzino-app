import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../supabaseClient";

// Cerca bancali REALI e già esistenti (non materiali dall'anagrafica) dentro un magazzino
// specifico. Serve per selezionare il pallet fisico giusto da spostare o mandare in macero.
export default function CercaBancale({ magazzino, onSelezionato }) {
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
      .from("bancali")
      .select("id, codice_materiale, ubicazione, ordine_produzione, numero_pezzi, stato")
      .eq("magazzino", magazzino)
      .in("stato", ["disponibile", "bloccato_qualita"])
      .ilike("codice_materiale", `%${valore}%`)
      .limit(20);
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
          placeholder="Scrivi il codice materiale del bancale…"
          style={{ width: "100%", padding: "14px 14px 14px 42px", borderRadius: 14, border: "2px solid #E1E6E8", fontSize: 16, boxSizing: "border-box" }}
        />
      </div>

      {cercando && <div style={{ color: "#5A6B73", fontSize: 14 }}>Cerco…</div>}

      {risultati.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
          {risultati.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelezionato(r)}
              style={{ textAlign: "left", background: "#fff", border: "1px solid #E1E6E8", borderRadius: 14, padding: "12px 14px", cursor: "pointer" }}
            >
              <div style={{ fontWeight: 700, color: "#1C2B33", fontSize: 15 }}>{r.codice_materiale}</div>
              <div style={{ fontSize: 13, color: "#5A6B73" }}>
                Stiva {r.ubicazione || "—"} · Lotto {r.ordine_produzione || "—"} · {r.numero_pezzi} scatole
                {r.stato === "bloccato_qualita" && <span style={{ color: "#B23A3A", fontWeight: 700 }}> · BLOCCATO</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {testo.trim().length >= 3 && !cercando && risultati.length === 0 && (
        <div style={{ color: "#8A9AA2", fontSize: 14 }}>Nessun bancale trovato in questo magazzino con questo codice.</div>
      )}
    </div>
  );
}
