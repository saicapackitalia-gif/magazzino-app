import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { supabase } from "../supabaseClient";

// Estrae il "prefisso" di una stiva: le lettere iniziali (es. "FC20" -> "FC").
// Se non trova un prefisso pulito, usa il codice intero come gruppo a sé stante.
function estraiPrefisso(codice) {
  const match = codice.match(/^[A-Za-z_]+/);
  return match ? match[0] : codice;
}

// Selezione della stiva di destinazione a MENU (nessuna tastiera):
// 1) prima si sceglie il prefisso/area (es. FC, PD, OA...)
// 2) poi si sceglie la stiva precisa dentro quell'area (es. FC20, FC21...)
export default function SceltaStiva({ magazzino, escludi, onScelta }) {
  const [tutte, setTutte] = useState([]);
  const [caricando, setCaricando] = useState(true);
  const [prefissoAperto, setPrefissoAperto] = useState(null);

  useEffect(() => {
    async function carica() {
      const { data } = await supabase
        .from("ubicazioni")
        .select("codice_ubicazione")
        .eq("magazzino", magazzino)
        .order("codice_ubicazione");
      setTutte((data || []).map((r) => r.codice_ubicazione).filter((u) => u !== escludi));
      setCaricando(false);
    }
    carica();
  }, [magazzino, escludi]);

  if (caricando) return <div style={{ color: "#5A6B73", fontSize: 14 }}>Carico le stive…</div>;

  const gruppi = {};
  for (const u of tutte) {
    const p = estraiPrefisso(u);
    if (!gruppi[p]) gruppi[p] = [];
    gruppi[p].push(u);
  }
  const prefissi = Object.keys(gruppi).sort();

  // Livello 2: dentro un prefisso, scegli la stiva precisa
  if (prefissoAperto) {
    const codici = gruppi[prefissoAperto];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => setPrefissoAperto(null)}
          style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#2A5C8A", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 }}
        >
          ← Torna alle aree
        </button>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {codici.map((u) => (
            <button
              key={u}
              onClick={() => onScelta(u)}
              style={{
                padding: "14px 18px", borderRadius: 12, border: "1px solid #E1E6E8",
                background: "#fff", color: "#1C2B33", fontWeight: 700, fontSize: 16, cursor: "pointer",
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Livello 1: scegli il prefisso/area
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 14, color: "#5A6B73" }}>Scegli l'area</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {prefissi.map((p) => (
          <button
            key={p}
            onClick={() => (gruppi[p].length === 1 ? onScelta(gruppi[p][0]) : setPrefissoAperto(p))}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 18px", borderRadius: 14, border: "1px solid #E1E6E8",
              background: "#fff", cursor: "pointer", textAlign: "left",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1C2B33" }}>{p}</div>
              <div style={{ fontSize: 12, color: "#8A9AA2" }}>
                {gruppi[p].length === 1 ? gruppi[p][0] : `${gruppi[p].length} stive`}
              </div>
            </div>
            <ChevronRight size={20} color="#8A9AA2" />
          </button>
        ))}
      </div>
    </div>
  );
}
