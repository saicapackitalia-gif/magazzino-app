import { useState } from "react";
import { Search, Download } from "lucide-react";
import { TopBar } from "./Home";
import { supabase } from "../supabaseClient";
import * as XLSX from "xlsx";

export default function Giacenza({ onBack }) {
  const [testo, setTesto] = useState("");
  const [risultati, setRisultati] = useState([]);
  const [cercando, setCercando] = useState(false);
  const [scaricando, setScaricando] = useState(false);

  async function cerca(valore) {
    setTesto(valore);
    if (valore.trim().length < 3) {
      setRisultati([]);
      return;
    }
    setCercando(true);
    const { data, error } = await supabase
      .from("vista_giacenza")
      .select("*")
      .or(`codice_materiale.ilike.%${valore}%,descrizione.ilike.%${valore}%`)
      .limit(20);
    setCercando(false);
    if (!error) setRisultati(data || []);
  }

  async function scaricaReport() {
    setScaricando(true);
    try {
      // Ultimi 7 giorni di movimenti
      const settimanaFa = new Date();
      settimanaFa.setDate(settimanaFa.getDate() - 7);

      const { data: movimenti } = await supabase
        .from("movimenti")
        .select("tipo_movimento, numero_bancali, numero_scatole, annullato, creato_il, bancali(codice_materiale)")
        .gte("creato_il", settimanaFa.toISOString())
        .order("creato_il", { ascending: false });

      const { data: giacenza } = await supabase
        .from("vista_giacenza")
        .select("*")
        .order("codice_materiale");

      const foglioMovimenti = (movimenti || []).map((m) => ({
        Data: new Date(m.creato_il).toLocaleString("it-IT"),
        "Codice materiale": m.bancali?.codice_materiale || "",
        "Tipo movimento": m.tipo_movimento,
        "Numero bancali": m.numero_bancali,
        "Scatole per bancale": m.numero_scatole,
        "Scatole totali": m.numero_bancali * m.numero_scatole,
        Annullato: m.annullato ? "Sì" : "No",
      }));

      const foglioGiacenza = (giacenza || []).map((g) => ({
        "Codice materiale": g.codice_materiale,
        "Codice cliente": g.codice_cliente,
        Descrizione: g.descrizione,
        "Scatole in giacenza": g.scatole_in_giacenza,
        "Scatole bloccate qualità": g.scatole_bloccate_qualita,
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(foglioMovimenti), "Movimenti ultimi 7gg");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(foglioGiacenza), "Giacenza attuale");

      const dataOggi = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `report-magazzino-${dataOggi}.xlsx`);
    } finally {
      setScaricando(false);
    }
  }

  return (
    <div>
      <TopBar title="Giacenza" onBack={onBack} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <button
          onClick={scaricaReport}
          disabled={scaricando}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "16px", borderRadius: 14, border: "none", background: "#1C2B33",
            color: "#fff", fontSize: 16, fontWeight: 700, cursor: scaricando ? "default" : "pointer",
          }}
        >
          <Download size={20} /> {scaricando ? "Preparo il file…" : "Scarica report Excel (ultimi 7 giorni)"}
        </button>

        <div style={{ position: "relative" }}>
          <Search size={18} color="#5A6B73" style={{ position: "absolute", left: 14, top: 14 }} />
          <input
            value={testo}
            onChange={(e) => cerca(e.target.value)}
            placeholder="Cerca materiale per codice o descrizione…"
            style={{ width: "100%", padding: "14px 14px 14px 42px", borderRadius: 14, border: "2px solid #E1E6E8", fontSize: 16, boxSizing: "border-box" }}
          />
        </div>

        {cercando && <div style={{ color: "#5A6B73", fontSize: 14 }}>Cerco…</div>}

        {risultati.map((r) => (
          <div key={r.codice_materiale} style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 1px 6px rgba(28,43,51,0.08)" }}>
            <div style={{ fontWeight: 700, color: "#1C2B33", fontSize: 15 }}>{r.codice_materiale}</div>
            <div style={{ fontSize: 13, color: "#5A6B73", marginBottom: 8 }}>{r.descrizione} · Cliente {r.codice_cliente}</div>
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: "#8A9AA2" }}>In giacenza</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#2E7D5B" }}>{r.scatole_in_giacenza}</div>
              </div>
              {r.scatole_bloccate_qualita > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: "#8A9AA2" }}>Bloccate qualità</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#B23A3A" }}>{r.scatole_bloccate_qualita}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
