import { useState } from "react";
import { createWorker } from "tesseract.js";
import { Camera } from "lucide-react";
import { supabase } from "../supabaseClient";

// Legge il testo da una foto (etichetta senza barcode) e cerca corrispondenze
// nel database. Meno affidabile di un barcode: dipende da luce e nitidezza,
// per questo mostriamo più candidati tra cui scegliere invece di sceglierne uno da soli.
export default function OcrScan({ onSelezionato }) {
  const [stato, setStato] = useState("idle"); // idle | leggendo | fatto
  const [risultati, setRisultati] = useState([]);
  const [nessunTesto, setNessunTesto] = useState(false);

  async function gestisciFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStato("leggendo");
    setRisultati([]);
    setNessunTesto(false);

    try {
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      await worker.terminate();
      const testo = data.text || "";

      // Cerca sequenze di almeno 6 cifre: probabile codice materiale (es. 1000199761)
      const candidati = Array.from(new Set(testo.match(/\d{6,}/g) || []));

      let trovati = [];
      for (const c of candidati.slice(0, 6)) {
        const { data: rows } = await supabase
          .from("materiali")
          .select("codice_materiale, codice_cliente, descrizione, pezzi_per_bancale")
          .ilike("codice_materiale", `%${c}%`)
          .limit(5);
        if (rows) trovati = trovati.concat(rows);
      }

      const unici = Array.from(new Map(trovati.map((r) => [r.codice_materiale, r])).values());
      setRisultati(unici);
      setNessunTesto(candidati.length === 0);
    } catch (err) {
      console.error(err);
      setNessunTesto(true);
    }
    setStato("fatto");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "18px", borderRadius: 16, border: "2px dashed #B7C2C7",
          background: "#F7F9FA", color: "#1C2B33", fontWeight: 700, fontSize: 16, cursor: "pointer",
        }}
      >
        <Camera size={20} />
        {stato === "leggendo" ? "Leggo il testo…" : "Scatta foto dell'etichetta"}
        <input type="file" accept="image/*" capture="environment" onChange={gestisciFoto} style={{ display: "none" }} />
      </label>

      <p style={{ fontSize: 13, color: "#8A9AA2", textAlign: "center", margin: 0 }}>
        Funziona meglio con foto ben illuminate e testo dritto. Se non trova nulla, usa "Cerca a mano".
      </p>

      {stato === "fatto" && risultati.length === 0 && (
        <div style={{ color: "#8A9AA2", textAlign: "center", fontSize: 14 }}>
          {nessunTesto ? "Non ho letto nessun codice nella foto." : "Nessuna corrispondenza trovata nel database."}
        </div>
      )}

      {risultati.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#5A6B73" }}>Possibili corrispondenze, tocca quella giusta:</div>
          {risultati.map((r) => (
            <button
              key={r.codice_materiale}
              onClick={() => onSelezionato(r)}
              style={{ textAlign: "left", background: "#fff", border: "1px solid #E1E6E8", borderRadius: 14, padding: "12px 14px", cursor: "pointer" }}
            >
              <div style={{ fontWeight: 700, color: "#1C2B33", fontSize: 15 }}>{r.codice_materiale}</div>
              <div style={{ fontSize: 13, color: "#5A6B73" }}>{r.descrizione || "(senza descrizione)"}</div>
              <div style={{ fontSize: 12, color: "#8A9AA2" }}>Cliente: {r.codice_cliente} · {r.pezzi_per_bancale} scatole/pallet</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
