import { useEffect, useRef, useState } from "react";

const VAST_URL = "https://s.magsrv.com/v1/vast.php?idz=5994186";
const SKIP_AFTER_SECONDS = 5;

type Props = {
  onDone: () => void;
};

function VastAdPlayer({ onDone }: Props) {
  const [adUrl, setAdUrl] = useState<string | null>(null);
  const [canSkip, setCanSkip] = useState(false);
  const [checked, setChecked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch(VAST_URL)
      .then((res) => res.text())
      .then((xmlText) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "text/xml");
        const mediaFile = xml.querySelector("MediaFile");
        const url = mediaFile?.textContent?.trim();

        if (url) {
          setAdUrl(url);
        } else {
          onDone();
        }
        setChecked(true);
      })
      .catch(() => {
        onDone();
        setChecked(true);
      });
  }, []);

  useEffect(() => {
    if (!adUrl) return;
    const timer = setTimeout(() => setCanSkip(true), SKIP_AFTER_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [adUrl]);

  if (!checked || !adUrl) {
    return null;
  }

  return (
    <div style={{ position: "relative", width: "100%", background: "black" }}>
      <video
        ref={videoRef}
        src={adUrl}
        autoPlay
        playsInline
        onEnded={onDone}
        onError={onDone}
        style={{ width: "100%", maxHeight: "80vh" }}
      />
      {canSkip && (
        <button
          onClick={onDone}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(0,0,0,0.7)",
            color: "white",
            border: "1px solid white",
            borderRadius: "6px",
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          Saltar anuncio ›
        </button>
      )}
    </div>
  );
}

export default VastAdPlayer;