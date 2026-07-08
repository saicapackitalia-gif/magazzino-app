import { useState } from "react";
import { ArrowLeftRight, Trash2, CheckCircle2 } from "lucide-react";
import { TopBar } from "./Home";
import CercaBancale from "../components/CercaBancale";
import { supabase } from "../supabaseClient";

const MODALITA = { MENU: "menu", SPOSTA: "sposta", MACERO: "macero" };

export default function Inventario({ magazzino, onBack }) {
  const [modalita, setModalita] = useState(MODALITA.MENU);
  const [bancale, setBancale] = useState(null);
  const [nuovaUbicazione, setNuovaUbicazione] = useState("");
  const [stato, setStato] = useState("idle"); // idle | salvando | ok | errore

  function reset() {
    setModalita(MODALITA.MENU);
    setBancale(null);
    setNuovaUbicazione("");
    setStato("idle");
  }

  async function confermaSpostamento() {
    if (!nuovaUbicazione.trim()) return;
    setStato("salvando");

    const { error: erroreUpdate } = await supabase
      .from("bancali")
      .update({ ubicazione: nuovaUbicazione.trim() })
      .eq("id", bancale.id);

    if (erroreUpdate) { setStato("errore"); return; }

    await supabase.from("movimenti").insert({
      bancale_id: bancale.id,
      tipo_movimento: "spostamento",
      numero_bancali: 1,
      numero_scatole: bancale.numero_pezzi,
      magazzino: magazzino.codice,
      ubicazione_da: bancale.ubicazione,
      ubicazione_a: nuovaUbicazione.trim(),
    });

    setStato("ok");
  }

  async function confermaMacero() {
    setStato("salvando");

    const { error: erroreUpdate } = await supabase
      .from("bancali")
      .update({ stato: "macero" })
      .eq("id", bancale.id);

    if (erroreUpdate) { setStato("errore"); return; }

    await supabase.from("movimenti").insert({
      bancale_id: bancale.id,
      tipo_movimento: "macero",
      numero_bancali: 1,
      numero_scatole: bancale.numero_pezzi,
      magazzino: magazzino.codice,
      ubicazione_da: bancale.ubicazione,
    });

    setStato("ok");
  }

  if (stato === "ok") {
    return (
      <div>
        <TopBar title="Inventario" onBack={onBack} />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40 }}>
          <CheckCircle2 size={64} color={modalita === "macero" ? "#B23A3A" : "#2E7D5B"} />
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1C2B33", textAlign: "center" }}>
            {modalita === "macero" ? "Bancale messo in macero" : "Spostamento registrato"}
          </div>
          <div style={{ fontSize: 15, color: "#5A6B73", textAlign: "center" }}>
            {bancale.codice_materiale} · {bancale.numero_pezzi} scatole
            {modalita === "sposta" && ` · da ${bancale.ubicazione || "—"} a ${nuovaUbicazione}`}
          </div>
          <button onClick={reset} style={{ marginTop: 10, padding: "14px 28px", borderRadius: 14, border: "none", background: "#1C2B33", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            Fai un altro movimento
          </button>
        </div>
      </div>
    );
  }

  if (modalita === MODALITA.MENU) {
    return (
      <div>
        <TopBar title={`Inventario · ${magazzino.codice}`} onBack={onBack} />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <button onClick={() => setModalita(MODALITA.SPOSTA)} style={bottoneMenu("#2A5C8A")}>
            <ArrowLeftRight size={26} color="#2A5C8A" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1C2B33" }}>Sposta bancale tra stive</div>
              <div style={{ fontSize: 13, color: "#5A6B73" }}>Cambia la posizione di un bancale già presente</div>
            </div>
          </button>
          <button onClick={() => setModalita(MODALITA.MACERO)} style={bottoneMenu("#B23A3A")}>
            <Trash2 size={26} color="#B23A3A" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1C2B33" }}>Metti in stato macero</div>
              <div style={{ fontSize: 13, color: "#5A6B73" }}>Merce da smaltire, non più disponibile</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Schermate SPOSTA e MACERO: prima cerca il bancale, poi conferma
  return (
    <div>
      <TopBar title={modalita === "sposta" ? "Sposta bancale" : "Metti in macero"} onBack={() => (bancale ? setBancale(null) : setModalita(MODALITA.MENU))} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {!bancale && <CercaBancale magazzino={magazzino.codice} onSelezionato={setBancale} />}

        {bancale && (
          <>
            <div style={{ background: "#fff", borderRadius: 18, padding: 20, boxShadow: "0 2px 10px rgba(28,43,51,0.1)" }}>
              <div style={{ fontSize: 13, color: "#5A6B73" }}>Codice materiale</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1C2B33", marginBottom: 12 }}>{bancale.codice_materiale}</div>
              <div style={{ fontSize: 13, color: "#5A6B73" }}>Stiva attuale</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1C2B33", marginBottom: 12 }}>{bancale.ubicazione || "—"}</div>
              <div style={{ fontSize: 13, color: "#5A6B73" }}>Lotto / ordine produzione</div>
              <div style={{ fontSize: 16, color: "#1C2B33", marginBottom: 12 }}>{bancale.ordine_produzione || "—"}</div>
              <div style={{ fontSize: 13, color: "#5A6B73" }}>Scatole</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1C2B33" }}>{bancale.numero_pezzi}</div>

              {modalita === "sposta" && (
                <>
                  <div style={{ fontSize: 13, color: "#5A6B73", marginTop: 16, marginBottom: 6 }}>Nuova stiva di destinazione</div>
                  <input
                    value={nuovaUbicazione}
                    onChange={(e) => setNuovaUbicazione(e.target.value)}
                    placeholder="es. PD02"
                    style={{ width: "100%", padding: "14px", borderRadius: 12, border: "2px solid #E1E6E8", fontSize: 16, boxSizing: "border-box" }}
                  />
                </>
              )}
            </div>

            {stato === "errore" && (
              <div style={{ background: "#FBEAEA", color: "#B23A3A", padding: 14, borderRadius: 12, fontSize: 14 }}>
                Errore nel salvataggio. Riprova.
              </div>
            )}

            <button
              onClick={modalita === "sposta" ? confermaSpostamento : confermaMacero}
              disabled={stato === "salvando" || (modalita === "sposta" && !nuovaUbicazione.trim())}
              style={{
                padding: "18px", borderRadius: 16, border: "none",
                background: modalita === "macero" ? "#B23A3A" : "#2E7D5B",
                color: "#fff", fontSize: 18, fontWeight: 700,
                cursor: stato === "salvando" ? "default" : "pointer",
                opacity: stato === "salvando" ? 0.7 : 1,
              }}
            >
              {stato === "salvando" ? "Salvo…" : modalita === "sposta" ? "Conferma spostamento" : "Conferma macero"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function bottoneMenu(colore) {
  return {
    display: "flex", alignItems: "center", gap: 16, padding: "20px",
    borderRadius: 16, border: "none", background: "#fff",
    boxShadow: "0 2px 10px rgba(28,43,51,0.1)", cursor: "pointer", textAlign: "left",
  };
}
