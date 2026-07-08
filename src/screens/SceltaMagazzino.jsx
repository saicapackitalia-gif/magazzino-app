import { useEffect, useState } from "react";
import { Warehouse } from "lucide-react";
import { TopBar } from "./Home";
import { supabase } from "../supabaseClient";

// Nota: in questa versione di prova la scelta del magazzino è libera (nessun login).
// In futuro si potrà collegare ogni utente/email a un magazzino di riferimento fisso,
// così che questa schermata si salti in automatico. Il codice è già pronto per quello:
// basterà leggere il magazzino dell'utente autenticato invece di chiederlo qui.
export default function SceltaMagazzino({ onScelto, onBack }) {
  const [magazzini, setMagazzini] = useState([]);
  const [caricando, setCaricando] = useState(true);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    async function carica() {
      const { data, error } = await supabase.from("magazzini").select("*").order("codice");
      if (error) {
        setErrore("Non riesco a leggere i magazzini. Controlla di aver eseguito la query 'aggiungi-magazzini-ubicazioni.sql' su Supabase. Dettaglio: " + error.message);
      } else if (!data || data.length === 0) {
        setErrore("Nessun magazzino trovato nel database. Controlla di aver eseguito la query 'aggiungi-magazzini-ubicazioni.sql' su Supabase.");
      } else {
        setMagazzini(data);
      }
      setCaricando(false);
    }
    carica();
  }, []);

  return (
    <div>
      <TopBar title="Scegli magazzino" onBack={onBack} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ color: "#5A6B73", fontSize: 15, margin: 0 }}>
          Su quale magazzino vuoi lavorare adesso?
        </p>
        {caricando && <div style={{ color: "#5A6B73" }}>Carico…</div>}
        {errore && (
          <div style={{ background: "#FBEAEA", color: "#B23A3A", padding: 14, borderRadius: 12, fontSize: 14 }}>
            {errore}
          </div>
        )}
        {magazzini.map((m) => (
          <button
            key={m.codice}
            onClick={() => onScelto(m)}
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "20px",
              borderRadius: 16, border: "none", background: "#fff",
              boxShadow: "0 2px 10px rgba(28,43,51,0.1)", cursor: "pointer", textAlign: "left",
            }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#2A5C8A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Warehouse size={26} color="#2A5C8A" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1C2B33" }}>{m.codice}</div>
              <div style={{ fontSize: 13, color: "#5A6B73" }}>{m.nome}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
