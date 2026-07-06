import { useEffect, useState } from "react";
import { CheckCircle2, Boxes } from "lucide-react";
import { TopBar } from "./Home";
import { supabase } from "../supabaseClient";

const numBtnStyle = {
  width: 48, height: 48, borderRadius: 12, border: "none", background: "#F7F9FA",
  fontSize: 24, fontWeight: 700, color: "#1C2B33", cursor: "pointer",
};

export default function Confirm({ action, materiale, onBack }) {
  const [scatole, setScatole] = useState(materiale.pezzi_per_bancale || 0);
  const [numBancali, setNumBancali] = useState(1);
  const [stato, setStato] = useState("idle"); // idle | salvando | ok | errore
  const [giacenza, setGiacenza] = useState(null); // null = ancora in caricamento
  const [erroreGiacenza, setErroreGiacenza] = useState(false);

  useEffect(() => {
    let attivo = true;
    async function caricaGiacenza() {
      const { data, error } = await supabase
        .from("vista_giacenza")
        .select("scatole_in_giacenza, scatole_bloccate_qualita")
        .eq("codice_materiale", materiale.codice_materiale)
        .maybeSingle();
      if (!attivo) return;
      if (error) setErroreGiacenza(true);
      else setGiacenza(data);
    }
    caricaGiacenza();
    return () => { attivo = false; };
  }, [materiale.codice_materiale]);

  async function confermaMovimento() {
    setStato("salvando");

    // 1. crea (o aggiorna) il bancale con lo stato corrispondente all'azione
    const statoBancale = {
      ingresso: "disponibile",
      uscita: "in_lavorazione",
      rientro: "disponibile",
      blocco: "bloccato_qualita",
    }[action.key];

    const { data: bancale, error: erroreBancale } = await supabase
      .from("bancali")
      .insert({
        codice_materiale: materiale.codice_materiale,
        numero_pezzi: scatole,
        stato: statoBancale,
      })
      .select()
      .single();

    if (erroreBancale) {
      setStato("errore");
      return;
    }

    // 2. registra il movimento collegato
    const { error: erroreMovimento } = await supabase.from("movimenti").insert({
      bancale_id: bancale.id,
      tipo_movimento: action.tipoMovimento,
      numero_bancali: numBancali,
      numero_scatole: scatole,
    });

    if (erroreMovimento) {
      setStato("errore");
      return;
    }

    setStato("ok");
  }

  if (stato === "ok") {
    const isBlocco = action.key === "blocco";
    return (
      <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 60 }}>
        <CheckCircle2 size={64} color={isBlocco ? "#B23A3A" : "#2E7D5B"} />
        <div style={{ fontSize: 20, fontWeight: 800, color: "#1C2B33", textAlign: "center" }}>
          {isBlocco ? "Merce bloccata per qualità" : "Movimento registrato"}
        </div>
        <div style={{ fontSize: 15, color: "#5A6B73", textAlign: "center" }}>
          {materiale.descrizione} — {numBancali} {numBancali === 1 ? "bancale" : "bancali"} · {scatole} scatole cad.
        </div>
        <button
          onClick={onBack}
          style={{ marginTop: 10, padding: "14px 28px", borderRadius: 14, border: "none", background: "#1C2B33", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}
        >
          Torna alla home
        </button>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Conferma dati" onBack={onBack} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: 20, boxShadow: "0 2px 10px rgba(28,43,51,0.1)" }}>
          <Campo label="Codice materiale (SAP)" valore={materiale.codice_materiale} grande />
          <Campo label="Codice cliente" valore={materiale.codice_cliente} />
          <Campo label="Descrizione" valore={materiale.descrizione || "—"} />

          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginTop: 4, marginBottom: 4,
            background: "#F0F5F2", borderRadius: 12, padding: "12px 14px",
          }}>
            <Boxes size={22} color="#2E7D5B" />
            <div>
              <div style={{ fontSize: 12, color: "#5A6B73" }}>Giacenza attuale in magazzino</div>
              {giacenza === null && !erroreGiacenza && (
                <div style={{ fontSize: 15, color: "#8A9AA2" }}>Carico…</div>
              )}
              {erroreGiacenza && (
                <div style={{ fontSize: 14, color: "#8A9AA2" }}>Non disponibile al momento</div>
              )}
              {giacenza && (
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1C2B33" }}>
                  {giacenza.scatole_in_giacenza} scatole
                  {giacenza.scatole_bloccate_qualita > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#B23A3A", marginLeft: 8 }}>
                      (di cui {giacenza.scatole_bloccate_qualita} bloccate qualità)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ fontSize: 13, color: "#5A6B73", margin: "14px 0 6px" }}>Scatole per bancale (modificabile)</div>
          <Contatore valore={scatole} onCambia={setScatole} />

          <div style={{ fontSize: 13, color: "#5A6B73", margin: "18px 0 6px" }}>Numero bancali in questo movimento</div>
          <Contatore valore={numBancali} onCambia={(v) => setNumBancali(Math.max(1, v))} />
        </div>

        {stato === "errore" && (
          <div style={{ background: "#FBEAEA", color: "#B23A3A", padding: 14, borderRadius: 12, fontSize: 14 }}>
            Errore nel salvataggio. Controlla la connessione e riprova.
          </div>
        )}

        <button
          onClick={confermaMovimento}
          disabled={stato === "salvando"}
          style={{
            padding: "18px", borderRadius: 16, border: "none",
            background: action.key === "blocco" ? "#B23A3A" : "#2E7D5B",
            color: "#fff", fontSize: 18, fontWeight: 700,
            cursor: stato === "salvando" ? "default" : "pointer",
            opacity: stato === "salvando" ? 0.7 : 1,
          }}
        >
          {stato === "salvando" ? "Salvo…" : `Conferma ${action.label.toLowerCase()}`}
        </button>
      </div>
    </div>
  );
}

function Campo({ label, valore, grande }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: "#5A6B73", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: grande ? 20 : 16, fontWeight: grande ? 800 : 500, color: "#1C2B33" }}>{valore}</div>
    </div>
  );
}

function Contatore({ valore, onCambia }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <button onClick={() => onCambia(Math.max(0, valore - 1))} style={numBtnStyle}>–</button>
      <input
        type="number"
        inputMode="numeric"
        value={valore}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") { onCambia(0); return; }
          const n = parseInt(v, 10);
          if (!Number.isNaN(n)) onCambia(Math.max(0, n));
        }}
        style={{
          fontSize: 24, fontWeight: 800, minWidth: 90, maxWidth: 110, textAlign: "center",
          border: "2px solid #E1E6E8", borderRadius: 12, padding: "10px 6px",
        }}
      />
      <button onClick={() => onCambia(valore + 1)} style={numBtnStyle}>+</button>
    </div>
  );
}
