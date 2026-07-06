import { useState } from "react";
import { Camera, Keyboard } from "lucide-react";
import { TopBar } from "./Home";
import BarcodeScanner from "../components/BarcodeScanner";
import RicercaManuale from "../components/RicercaManuale";
import { supabase } from "../supabaseClient";

export default function Scan({ action, onTrovato, onBack }) {
  const [modo, setModo] = useState("barcode"); // "barcode" | "manuale"
  const [errore, setErrore] = useState("");
  const [cercandoCodice, setCercandoCodice] = useState(false);

  async function gestisciCodiceLetto(codice) {
    setCercandoCodice(true);
    setErrore("");
    const { data, error } = await supabase
      .from("materiali")
      .select("codice_materiale, codice_cliente, descrizione, pezzi_per_bancale")
      .or(`codice_materiale.eq.${codice},codice_a_barre.eq.${codice}`)
      .maybeSingle();
    setCercandoCodice(false);

    if (error || !data) {
      setErrore("Codice non trovato nel database. Riprova o cerca manualmente.");
      return;
    }
    onTrovato(data);
  }

  return (
    <div>
      <TopBar title={action.label} onBack={onBack} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>

        <div style={{ display: "flex", gap: 8, background: "#E9EDEE", padding: 6, borderRadius: 14 }}>
          <button
            onClick={() => { setModo("barcode"); setErrore(""); }}
            style={tabStyle(modo === "barcode")}
          >
            <Camera size={18} /> Scansiona
          </button>
          <button
            onClick={() => { setModo("manuale"); setErrore(""); }}
            style={tabStyle(modo === "manuale")}
          >
            <Keyboard size={18} /> Cerca a mano
          </button>
        </div>

        {modo === "barcode" ? (
          <>
            <BarcodeScanner
              onDetected={gestisciCodiceLetto}
              onError={() => setErrore("Impossibile accedere alla fotocamera. Controlla i permessi del browser.")}
            />
            <p style={{ textAlign: "center", color: "#5A6B73", fontSize: 15, margin: 0 }}>
              Inquadra il codice a barre o QR sull'etichetta del bancale.
            </p>
            {cercandoCodice && <p style={{ textAlign: "center", color: "#2A5C8A" }}>Verifico nel database…</p>}
            {errore && (
              <div style={{ background: "#FBEAEA", color: "#B23A3A", padding: 14, borderRadius: 12, fontSize: 14 }}>
                {errore}
              </div>
            )}
          </>
        ) : (
          <RicercaManuale onSelezionato={onTrovato} />
        )}
      </div>
    </div>
  );
}

function tabStyle(attivo) {
  return {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
    background: attivo ? "#fff" : "transparent",
    color: attivo ? "#1C2B33" : "#5A6B73",
    fontWeight: attivo ? 700 : 500, fontSize: 15,
    boxShadow: attivo ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
  };
}
