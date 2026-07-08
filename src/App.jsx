import { useState } from "react";
import Home, { TopBar } from "./screens/Home";
import Scan from "./screens/Scan";
import Confirm from "./screens/Confirm";
import History from "./screens/History";
import Giacenza from "./screens/Giacenza";
import SceltaMagazzino from "./screens/SceltaMagazzino";
import Inventario from "./screens/Inventario";

const SCHERMATE = {
  HOME: "home", SCAN: "scan", CONFERMA: "conferma", STORICO: "storico",
  GIACENZA: "giacenza", SCELTA_MAGAZZINO: "scelta_magazzino", INVENTARIO: "inventario",
};

export default function App() {
  const [schermata, setSchermata] = useState(SCHERMATE.HOME);
  const [azione, setAzione] = useState(null);
  const [materiale, setMateriale] = useState(null);
  const [magazzino, setMagazzino] = useState(null);

  function vaiHome() {
    setSchermata(SCHERMATE.HOME);
    setAzione(null);
    setMateriale(null);
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: "#F0F3F4", fontFamily: "-apple-system, Roboto, 'Segoe UI', sans-serif" }}>
      {schermata === SCHERMATE.HOME && (
        <>
          <TopBar title="Magazzino" />
          <Home
            onSelectAction={(a) => { setAzione(a); setSchermata(SCHERMATE.SCAN); }}
            onVediStorico={() => setSchermata(SCHERMATE.STORICO)}
            onVediGiacenza={() => setSchermata(SCHERMATE.GIACENZA)}
            onVediInventario={() => setSchermata(SCHERMATE.SCELTA_MAGAZZINO)}
          />
        </>
      )}
      {schermata === SCHERMATE.SCAN && (
        <Scan
          action={azione}
          onTrovato={(m) => { setMateriale(m); setSchermata(SCHERMATE.CONFERMA); }}
          onBack={vaiHome}
        />
      )}
      {schermata === SCHERMATE.CONFERMA && (
        <Confirm action={azione} materiale={materiale} onBack={vaiHome} />
      )}
      {schermata === SCHERMATE.STORICO && <History onBack={vaiHome} />}
      {schermata === SCHERMATE.GIACENZA && <Giacenza onBack={vaiHome} />}
      {schermata === SCHERMATE.SCELTA_MAGAZZINO && (
        <SceltaMagazzino
          onScelto={(m) => { setMagazzino(m); setSchermata(SCHERMATE.INVENTARIO); }}
          onBack={vaiHome}
        />
      )}
      {schermata === SCHERMATE.INVENTARIO && (
        <Inventario magazzino={magazzino} onBack={vaiHome} />
      )}
    </div>
  );
}
