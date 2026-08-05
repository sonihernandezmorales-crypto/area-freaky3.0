import { useRef, useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import "./App.css";

type MediaItem = {
  id: string;
  type: "photo" | "video";
  url: string;
  description: string;
  date: string;
  views: number;
  thumbnail?: string;
};

const API_URL = "https://169-58-72-43.sslip.io";

function AdsterraAds() {
  const topBannerRef = useRef<HTMLDivElement>(null);
  const socialBarRef = useRef<HTMLDivElement>(null);
  const popunderRef = useRef<HTMLDivElement>(null);

  // 1. Banner Superior 320x50
  useEffect(() => {
    if (!topBannerRef.current) return;
    topBannerRef.current.innerHTML = "";

    const confScript = document.createElement("script");
    confScript.type = "text/javascript";
    confScript.innerHTML = `
      atOptions = {
        'key' : '64b118f05af36d35bec3887dd8b21a14',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src = "https://www.highperformanceformat.com/64b118f05af36d35bec3887dd8b21a14/invoke.js";

    topBannerRef.current.appendChild(confScript);
    topBannerRef.current.appendChild(invokeScript);
  }, []);

  // 2. Social Bar
  useEffect(() => {
    if (!socialBarRef.current) return;
    socialBarRef.current.innerHTML = "";

    const socialScript = document.createElement("script");
    socialScript.type = "text/javascript";
    socialScript.src = "https://pl30654580.effectivecpmnetwork.com/55/54/8a/55548a002c612a06552c0f75ef47ddb8.js";
    socialScript.async = true;

    socialBarRef.current.appendChild(socialScript);
  }, []);

  // 3. Popunder
  useEffect(() => {
    if (!popunderRef.current) return;
    popunderRef.current.innerHTML = "";

    const popunderScript = document.createElement("script");
    popunderScript.type = "text/javascript";
    popunderScript.src = "https://pl30687192.effectivecpmnetwork.com/65/f7/8a/65f78a129e74b4bc6d131eb82285a8e9.js";
    popunderScript.async = true;

    popunderRef.current.appendChild(popunderScript);
  }, []);

  return (
    <>
      {/* Banner 320x50 fijo arriba */}
      <div
        ref={topBannerRef}
        style={{
          width: "320px",
          height: "50px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      />
      
      {/* Contenedores para Social Bar y Popunder */}
      <div ref={socialBarRef} />
      <div ref={popunderRef} />
    </>
  );
}

function App() {

  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [viewer, setViewer] = useState<{ type: "photo" | "video"; url: string; id: string; index: number } | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [pendingFile, setPendingFile] = useState<{ file: File } | null>(null);
  const [descriptionInput, setDescriptionInput] = useState("");
  const [entries, setEntries] = useState(0);
  const [ageVerified, setAgeVerified] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const videoInput = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 15;

  const loadVideos = async (append: boolean) => {
    try {
      const offset = append ? videos.length : 0;
      const res = await fetch(`${API_URL}/api/media?type=video&limit=${PAGE_SIZE}&offset=${offset}`);
      const data: MediaItem[] = await res.json();
      const withUrls = data.map((m) => ({ ...m, url: API_URL + m.url }));
      setVideos(append ? [...videos, ...withUrls] : withUrls);
    } catch (err) {
      console.error("Error cargando videos:", err);
    }
  };

  const loadMedia = () => {
    loadVideos(false);
  };

  const loadEntries = async () => {
    try {
      const res = await fetch(`${API_URL}/api/entries`);
      const data = await res.json();
      setEntries(data.entries);
    } catch (err) {
      console.error("Error cargando entradas:", err);
    }
  };

  useEffect(() => {
    loadMedia();
    fetch(`${API_URL}/api/entry`, { method: "POST" })
      .then(() => loadEntries())
      .catch(() => {});
  }, []);

  const handleTitleClick = () => {
    const next = clickCount + 1;

    if (next >= 5) {
      setClickCount(0);
      if (isAdmin) {
        setIsAdmin(false);
      } else {
        setShowPasswordModal(true);
      }
    } else {
      setClickCount(next);
    }
  };

  const verifyAdminPassword = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();

      if (data.success) {
        setIsAdmin(true);
        setShowPasswordModal(false);
        setPasswordInput("");
      } else {
        alert("Contraseña incorrecta");
        setPasswordInput("");
      }
    } catch (err) {
      console.error("Error verificando contraseña:", err);
      alert("Error de conexión con el servidor");
    }
  };

  const cancelPasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordInput("");
  };

  const registerView = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/media/${id}/view`, { method: "POST" });
      setVideos((prevVideos) =>
        prevVideos.map((v) => (v.id === id ? { ...v, views: v.views + 1 } : v))
      );
    } catch (err) {
      console.error("Error registrando vista:", err);
    }
  };

  const likeMedia = async (id: string) => {
    const alreadyLiked = likedIds.has(id);
    const endpoint = alreadyLiked ? "unlike" : "like";

    try {
      await fetch(`${API_URL}/api/media/${id}/${endpoint}`, { method: "POST" });

      setLikedIds((prev) => {
        const next = new Set(prev);
        if (alreadyLiked) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });

      loadMedia();
    } catch (err) {
      console.error("Error con el like:", err);
    }
  };

  const openViewer = (type: "photo" | "video", url: string, id: string, index: number) => {
    setViewer({ type, url, id, index });
    registerView(id);
  };

  const goToNext = () => {
    if (!viewer) return;
    const list = videos;
    const nextIndex = (viewer.index + 1) % list.length;
    const next = list[nextIndex];
    setViewer({ type: viewer.type, url: next.url, id: next.id, index: nextIndex });
    registerView(next.id);
  };

  const goToPrev = () => {
    if (!viewer) return;
    const list = videos;
    const prevIndex = (viewer.index - 1 + list.length) % list.length;
    const prev = list[prevIndex];
    setViewer({ type: viewer.type, url: prev.url, id: prev.id, index: prevIndex });
    registerView(prev.id);
  };

  const uploadFile = async (file: File, description: string) => {
    if (isUploading) return;
    
    const controller = new AbortController();
    setAbortController(controller);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al subir");
        return;
      }

      setPendingFile(null);
      setDescriptionInput("");
      loadMedia();
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Subida cancelada por el usuario");
      } else {
        console.error("Error subiendo archivo:", err);
        alert("Error de conexión con el servidor");
      }
    } finally {
      setIsUploading(false);
      setAbortController(null);
    }
  };

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (isUploading) return;
    const file = e.target.files[0];
    e.target.value = "";

    setPendingFile({ file });
    setDescriptionInput("");
  };

  const confirmUpload = async () => {
    if (!pendingFile || isUploading) return;
    await uploadFile(pendingFile.file, descriptionInput);
    setPendingFile(null);
    setDescriptionInput("");
  };

  const cancelUpload = () => {
    if (abortController) {
      abortController.abort();
    }
    setPendingFile(null);
    setDescriptionInput("");
    setIsUploading(false);
    setAbortController(null);
  };

  const deleteMedia = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/media/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al eliminar");
        return;
      }

      setViewer(null);
      loadMedia();
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("Error de conexión con el servidor");
    }
  };

  if (!ageVerified) {
    return (
      <div className="ageGate">
        <h1>+18</h1>
        <p>Este sitio contiene contenido para adultos.</p>
        <p>¿Confirmas que tienes 18 años o más?</p>
        <div className="ageGateButtons">
          <button onClick={() => setAgeVerified(true)}>
            Sí, soy mayor de edad
          </button>
          <button onClick={() => { window.location.href = "https://www.google.com"; }}>
            No, salir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">

      <AdsterraAds />

      <h1 onClick={handleTitleClick} className="appTitle">
        🔥 Ares Freaky 3.0 🔥 {isAdmin && "🔓"}
      </h1>

      <p className="subtitle">
        Un mundo sin límites
      </p>

      {isAdmin && (
        <div style={{ margin: "10px 0", color: "#fff", background: "rgba(0,0,0,0.5)", padding: "10px", borderRadius: "8px", display: "inline-block" }}>
          <p style={{ margin: "2px 0" }}>Entradas totales: {entries}</p>
        </div>
      )}

      {isAdmin && (
        <>
          <div className="buttons">
            <button onClick={() => videoInput.current?.click()} disabled={isUploading}>
              {isUploading ? "Subiendo..." : "Subir videos"}
            </button>
          </div>

          <input
            ref={videoInput}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => handleFileSelected(e)}
          />
        </>
      )}

      <div className="videoSection">
        {videos.map((video, index) => (
          <div key={video.id} style={{ width: "100%" }}>
            <div className="videoCardWrapper">
              <div className="videoCard">
                <video
                  src={video.url}
                  poster={video.thumbnail ? API_URL + video.thumbnail : undefined}
                  onClick={() => openViewer("video", video.url, video.id, index)}
                />

                <p className="videoMeta">
                  {video.description && <span className="videoDescription">{video.description}</span>}
                  <span className="videoStats">{video.date} · {video.views} vistas</span>
                  <button
                    className="likeButton"
                    onClick={(e) => { e.stopPropagation(); likeMedia(video.id); }}
                  >
                    ❤️ {(video as any).likes || 0}
                  </button>
                </p>
              </div>
            </div>
          </div>
        ))}

        <button onClick={() => loadVideos(true)} className="loadMoreButton">
          Ver más videos
        </button>
      </div>

      {viewer && (
        <div className="viewer" onClick={() => setViewer(null)}>

          <button
            className="closeButton"
            onClick={() => setViewer(null)}
            style={{
              position: "fixed",
              top: "70px",
              right: "15px",
              background: "rgba(0, 0, 0, 0.6)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              fontSize: "16px",
              fontWeight: "normal",
              cursor: "pointer",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>

          <button
            className="navButton navLeft"
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          >
            ‹
          </button>

          {viewer.type === "photo" ? (
            <img
              src={viewer.url}
              alt="gran vista"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              key={viewer.id}
              src={viewer.url}
              autoPlay
              playsInline
              controls
              style={{ width: "100%", maxHeight: "80vh", objectFit: "contain" }}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <button
            className="navButton navRight"
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
          >
            ›
          </button>

          {isAdmin && (
            <button
              className="deleteButton"
              onClick={(e) => {
                e.stopPropagation();
                deleteMedia(viewer.id);
              }}
            >
              Eliminar
            </button>
          )}

        </div>
      )}

      {pendingFile && (
        <div className="uploadModal" onClick={cancelUpload}>
          <div className="uploadModalContent" onClick={(e) => e.stopPropagation()}>
            <p>Descripción (opcional):</p>

            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="Escribe una descripción..."
              disabled={isUploading}
            />

            <div className="uploadModalButtons">
              <button onClick={confirmUpload} disabled={isUploading}>
                {isUploading ? "Subiendo..." : "Subir"}
              </button>
              <button onClick={cancelUpload}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="uploadModal" onClick={cancelPasswordModal}>
          <div className="uploadModalContent" onClick={(e) => e.stopPropagation()}>
            <p>Contraseña de administrador:</p>

            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Contraseña"
              onKeyDown={(e) => { if (e.key === "Enter") verifyAdminPassword(); }}
              autoFocus
            />

            <div className="uploadModalButtons">
              <button onClick={verifyAdminPassword}>Entrar</button>
              <button onClick={cancelPasswordModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;