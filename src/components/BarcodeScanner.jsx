import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

// Componente che accende la fotocamera e legge barcode/QR in tempo reale.
// Quando trova un codice, chiama onDetected(codice) una sola volta.
export default function BarcodeScanner({ onDetected, onError }) {
  const containerId = "barcode-scanner-region";
  const scannerRef = useRef(null);
  const hasDetectedRef = useRef(false);

  useEffect(() => {
    const html5Qr = new Html5Qrcode(containerId, { verbose: false });
    scannerRef.current = html5Qr;
    hasDetectedRef.current = false;

    html5Qr
      .start(
        { facingMode: "environment" }, // fotocamera posteriore
        { fps: 10, qrbox: { width: 260, height: 180 } },
        (decodedText) => {
          if (hasDetectedRef.current) return;
          hasDetectedRef.current = true;
          html5Qr.stop().catch(() => {});
          onDetected(decodedText);
        },
        () => {
          // errori di lettura frame-per-frame: normali, si ignorano (non è un errore reale)
        }
      )
      .catch((err) => {
        onError?.(err);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id={containerId}
      style={{
        width: "100%",
        aspectRatio: "4/3",
        borderRadius: 20,
        overflow: "hidden",
        background: "#0F1A20",
      }}
    />
  );
}
