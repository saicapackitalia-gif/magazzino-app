import { useState } from "react";
import { Camera, Keyboard, ScanText, ArrowLeftRight, ShieldAlert, ShieldCheck, Trash2, CheckCircle2, Boxes } from "lucide-react";
import { TopBar } from "./Home";
import BarcodeScanner from "../components/BarcodeScanner";
import OcrScan from "../components/OcrScan";
import RicercaManuale from "../components/RicercaManuale";
import SceltaStiva from "../components/SceltaStiva";
import { supabase } from "../supabaseClient";

const PASSI = {
  RICERCA: "ricerca",
  LISTA_BANCALI: "lista_bancali",
  SCELTA_STIVA: "scelta_stiva",
  FATTO: "fatto",
};

export default function Inventario({ magazzino, onBack }) {
  const [passo, setPasso] = useState(PASSI.RICERCA);
  const [modoRicerca, setModoRicerca] = useState("barcode");
  const [materiale, setMateriale] = useState(null);
  const [bancaliTrovati, setBancaliTrovati] = useState([]);
  const [bancale, setBancale] = useState(null);
  const [ultimaAzione, setUltimaAzione] = useState(null);
  const [errore, setErrore] = useState("");
  const [salvando, setSalvando] = useState(false);

  function reset() {
    setPasso(PASSI.RICERCA);
    setMateriale(null);
    setBancaliTrovati([]);
    setBancale(null);
    setUltimaAzione(null);
    setErrore("");
  }

  async function materialeTrovato(m) {
    setMateriale(m);
    setErrore("");
    const { data, error } = await supabase
      .from("bancali")
      .select("id, codice_materiale, ubicazione, ordine_produzione, numero_pezzi, stato")
      .eq("magazzino", magazzino.codice)
      .eq("codice_materiale", m.codice_materiale)
      .in("stato", ["disponibile", "bloccato_qualita"])
      .order("ubicazione");

    if (error) {
      setErrore("Errore nel leggere i bancali di questo materiale.");
      return;
    }
    if (!data || data.length === 0) {
      setErrore(`Nessun bancale di ${m.codice_materiale} trovato in ${magazzino.codice}.`);
      return;
    }
    setBancaliTrovati(data);
    if (data.length === 1) {
      setBancale(data[0]);
    } else {
      setPasso(PASSI.LISTA_BANCALI);
    }
  }

  async function eseguiAzione(tipo, ubicazioneNuova) {
    setSalvando(true);
    const aggiornamento = {};
    if (tipo === "blocco_qualita") aggiornamento.stato = "bloccato_qualita";
    if (tipo === "sblocco_qualita") aggiornamento.stato = "disponibile";
    if (tipo === "macero") aggiornamento.stato = "macero";
    if (tipo === "spostamento") aggiornamento.ubicazione = ubicazioneNuova;

    const { error: erroreUpdate } = await supabase.from("bancali").update(aggiornamento).eq("id", bancale.id);
    if (erroreUpdate) { setErrore("Errore nel salvataggio."); setSalvando(false); return; }

    await supabase.from("movimenti").insert({
      bancale_id: bancale.id,
      tipo_movimento: tipo,
      numero_bancali: 1,
      numero_scatole: bancale.numero_pezzi,
      magazzino: magazzino.codice,
      ubicazione_da: bancale.ubicazione,
      ubicazione_a: tipo === "spostamento" ? ubicazioneNuova : null,
    });

    setUltimaAzione({ tipo, ubicazioneNuova });
    setSalvando(false);
    setPasso(PASSI.FATTO);
  }

  const totaleScatole = bancaliTrovati.reduce((s, b) => s + b.numero_pezzi, 0);

  // ---------- SCHERMATA: FATTO ----------
  if (passo === PASSI.FATTO) {
    const etichette = {
      spostamento: "Bancale spostato",
      blocco_qualita: "Bancale bloccato per qualità",
      sblocco_qualita: "Bancale sbloccato",
      macero: "Bancale messo in macero",
    };
    return (
      <div>
        <TopBar title="Inventario" onBack={onBack} />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40 }}>
          <CheckCircle2 size={64} color={ultimaAzione?.tipo === "macero" || ultimaAzione?.tipo === "blocco_qualita" ? "#B23A3A" : "#2E7D5B"} />
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1C2B33", textAlign: "center" }}>
            {etichette[ultimaAzione?.tipo]}
          </div>
          <div style={{ fontSize: 15, color: "#5A6B73", textAlign: "center" }}>
            {bancale.codice_materiale} · {bancale.numero_pezzi} scatole
            {ultimaAzione?.tipo === "spostamento" && ` · da ${bancale.ubicazione || "—"} a ${ultimaAzione.ubicazioneNuova}`}
          </div>
          <button onClick={reset} style={{ marginTop: 10, padding: "14px 28px", borderRadius: 14, border: "none", background: "#1C2B33", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            Fai un altro movimento
          </button>
        </div>
      </div>
    );
  }

  // ---------- SCHERMATA: SCELTA STIVA DI DESTINAZIONE ----------
  if (passo === PASSI.SCELTA_STIVA) {
    return (
      <div>
        <TopBar title="Scegli la stiva" onBack={() => setPasso(bancaliTrovati.length > 1 ? PASSI.LISTA_BANCALI : PASSI.RICERCA)} />
        <div style={{ padding: 20 }}>
          <SceltaStiva magazzino={magazzino.codice} escludi={bancale.ubicazione} onScelta={(u) => eseguiAzione("spostamento", u)} />
        </div>
      </div>
    );
  }

  // ---------- SCHERMATA: LISTA BANCALI (se il materiale è in più stive/lotti) ----------
  if (passo === PASSI.LISTA_BANCALI) {
    return (
      <div>
        <TopBar title="Scegli il bancale" onBack={reset} />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 14, color: "#5A6B73" }}>
            {materiale.codice_materiale} è presente in {bancaliTrovati.length} punti diversi. Quale vuoi movimentare?
          </div>
          {bancaliTrovati.map((b) => (
            <button
              key={b.id}
              onClick={() => setBancale(b)}
              style={{ textAlign: "left", background: "#fff", border: "1px solid #E1E6E8", borderRadius: 14, padding: "14px", cursor: "pointer" }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1C2B33" }}>Stiva {b.ubicazione || "—"}</div>
              <div style={{ fontSize: 13, color: "#5A6B73" }}>
                Lotto {b.ordine_produzione || "—"} · {b.numero_pezzi} scatole
                {b.stato === "bloccato_qualita" && <span style={{ color: "#B23A3A", fontWeight: 700 }}> · BLOCCATO</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------- SCHERMATA: bancale selezionato -> azioni ----------
  if (bancale) {
    return (
      <div>
        <TopBar title="Movimenta bancale" onBack={() => (bancaliTrovati.length > 1 ? setPasso(PASSI.LISTA_BANCALI) : reset())} />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, boxShadow: "0 2px 10px rgba(28,43,51,0.1)" }}>
            <div style={{ fontSize: 13, color: "#5A6B73" }}>Codice materiale</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1C2B33", marginBottom: 12 }}>{bancale.codice_materiale}</div>
            <div style={{ fontSize: 13, color: "#5A6B73" }}>Descrizione</div>
            <div style={{ fontSize: 15, color: "#1C2B33", marginBottom: 12 }}>{materiale?.descrizione || "—"}</div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F0F5F2", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <Boxes size={20} color="#2E7D5B" />
              <div>
                <div style={{ fontSize: 12, color: "#5A6B73" }}>Giacenza totale in {magazzino.codice}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#1C2B33" }}>{totaleScatole} scatole</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: "#5A6B73" }}>Stiva attuale</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1C2B33", marginBottom: 12 }}>{bancale.ubicazione || "—"}</div>
            <div style={{ fontSize: 13, color: "#5A6B73" }}>Lotto / ordine produzione</div>
            <div style={{ fontSize: 15, color: "#1C2B33", marginBottom: 12 }}>{bancale.ordine_produzione || "—"}</div>
            <div style={{ fontSize: 13, color: "#5A6B73" }}>Scatole in questo bancale</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1C2B33" }}>
              {bancale.numero_pezzi}
              {bancale.stato === "bloccato_qualita" && <span style={{ color: "#B23A3A", fontWeight: 700, fontSize: 13, marginLeft: 8 }}>BLOCCATO QUALITÀ</span>}
            </div>
          </div>

          {errore && (
            <div style={{ background: "#FBEAEA", color: "#B23A3A", padding: 14, borderRadius: 12, fontSize: 14 }}>{errore}</div>
          )}

          <button onClick={() => setPasso(PASSI.SCELTA_STIVA)} disabled={salvando} style={bottoneAzione("#2A5C8A")}>
            <ArrowLeftRight size={22} /> Sposta in un'altra stiva
          </button>

          {bancale.stato === "bloccato_qualita" ? (
            <button onClick={() => eseguiAzione("sblocco_qualita")} disabled={salvando} style={bottoneAzione("#2E7D5B")}>
              <ShieldCheck size={22} /> Sblocca qualità
            </button>
          ) : (
            <button onClick={() => eseguiAzione("blocco_qualita")} disabled={salvando} style={bottoneAzione("#B23A3A")}>
              <ShieldAlert size={22} /> Blocca per qualità
            </button>
          )}

          <button onClick={() => eseguiAzione("macero")} disabled={salvando} style={bottoneAzione("#8A9AA2")}>
            <Trash2 size={22} /> Metti in macero
          </button>
        </div>
      </div>
    );
  }

  // ---------- SCHERMATA: RICERCA MATERIALE (schermata iniziale) ----------
  return (
    <div>
      <TopBar title={`Inventario · ${magazzino.codice}`} onBack={onBack} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, background: "#E9EDEE", padding: 6, borderRadius: 14 }}>
          <button onClick={() => { setModoRicerca("barcode"); setErrore(""); }} style={tabStyle(modoRicerca === "barcode")}>
            <Camera size={18} /> Scansiona
          </button>
          <button onClick={() => { setModoRicerca("ocr"); setErrore(""); }} style={tabStyle(modoRicerca === "ocr")}>
            <ScanText size={18} /> Foto testo
          </button>
          <button onClick={() => { setModoRicerca("manuale"); setErrore(""); }} style={tabStyle(modoRicerca === "manuale")}>
            <Keyboard size={18} /> Cerca a mano
          </button>
        </div>

        {modoRicerca === "barcode" && (
          <>
            <BarcodeScanner onDetected={async (codice) => {
              const { data } = await supabase.from("materiali").select("*").or(`codice_materiale.eq.${codice},codice_a_barre.eq.${codice}`).maybeSingle();
              if (data) materialeTrovato(data);
              else setErrore("Codice non trovato nel database.");
            }} onError={() => setErrore("Impossibile accedere alla fotocamera.")} />
            <p style={{ textAlign: "center", color: "#5A6B73", fontSize: 15, margin: 0 }}>Inquadra il codice a barre o QR.</p>
          </>
        )}
        {modoRicerca === "ocr" && <OcrScan onSelezionato={materialeTrovato} />}
        {modoRicerca === "manuale" && <RicercaManuale onSelezionato={materialeTrovato} />}

        {errore && (
          <div style={{ background: "#FBEAEA", color: "#B23A3A", padding: 14, borderRadius: 12, fontSize: 14 }}>{errore}</div>
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

function bottoneAzione(colore) {
  return {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    padding: "16px", borderRadius: 14, border: "none", background: colore,
    color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
  };
}
