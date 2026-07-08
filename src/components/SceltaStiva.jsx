import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../supabaseClient";

// Mostra l'elenco vero delle stive di un magazzino (non testo libero), con ricerca.
export default function SceltaStiva({ magazzino, escludi, onScelta }) {
  const [tutte, setTutte] = useState([]);
  const [testo, setTesto] = useState("");
  const [caricando, setCaricando] = useState(true);

  useEffect(() => {
    async function carica() {
      const { data } = await supabase
        .from("ubicazioni")
        .select("codice_ubicazione")
        .eq("magazzino", magazzino)
        .order("codice_ubicazione");
      setTutte((data || []).map((r) => r.codice_ubicazione));
      setCaricando(false);
    }
    carica();
  }, [magazzino]);

  const filtrate = tutte.filter(
    (u) => u !== escludi && u.toLowerCase().includes(testo.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative" }}>
        <Search size={18} color="#5A6B73" style={{ position: "absolute", left: 14, top: 14 }} />
        <input
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="Cerca la stiva di destinazione…"
          style={{ width: "100%", padding: "14px 14px 14px 42px", borderRadius: 14, border: "2px solid #E1E6E8", fontSize: 16, boxSizing: "border-box" }}
        />
      </div>
      {caricando && <div style={{ color: "#5A6B73", fontSize: 14 }}>Carico le stive…</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 260, overflowY: "auto" }}>
        {filtrate.slice(0, 60).map((u) => (
          <button
            key={u}
            onClick={() => onScelta(u)}
            style={{
              padding: "10px 16px", borderRadius: 10, border: "1px solid #E1E6E8",
              background: "#fff", color: "#1C2B33", fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}
          >
            {u}
          </button>
        ))}
      </div>
      {!caricando && filtrate.length === 0 && (
        <div style={{ color: "#8A9AA2", fontSize: 14 }}>Nessuna stiva trovata con questo testo.</div>
      )}
    </div>
  );
}
