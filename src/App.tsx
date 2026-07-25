import { useRef, useState, ChangeEvent, useEffect } from "react";
import "./App.css";

type MediaItem = {
  id: string;
  type: "photo" | "video";
  url: string;
  description: string;
  date: string;
  views: number;
};

const API_URL = "http://169.58.72.43:5000";

function App() {

  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [viewer, setViewer] = useState<{ type: "photo" | "video"; url: string; id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [pendingFile, setPendingFile] = useState<{ file: File } | null>(null);
  const [descriptionInput, setDescriptionInput] = useState("");
  const [entries, setEntries] = useState(0);
  const [ageVerified, setAgeVerified] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    try {
      const res = await fetch(`${API_URL}/api/media`);
      const data: MediaItem[] = await res.json();

      setPhotos(data.filter((m) => m.type === "photo").map((m) => ({ ...m, url: API_URL + m.url })));
      setVideos(data.filter((m) => m.type === "video").map((m) => ({ ...m, url: API_URL + m.url })));
    } catch (err) {
      console.error("Error cargando contenido:", err);
    }
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
    } catch (err) {
      console.error("Error registrando vista:", err);
    }
  };

  const openViewer = (type: "photo" | "video", url: string, id: string) => {
    setViewer({ type, url, id });
    registerView(id);
  };

  const uploadFile = async (file: File, description: string) => {
    if (isUploading) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al subir");
        return;
      }

      loadMedia();
    } catch (err) {
      console.error("Error subiendo archivo:", err);
      alert("Error de conexión con el servidor");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>, kind: "photo" | "video") => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (isUploading) return;
    const file = e.target.files[0];
    e.target.value = "";

    if (kind === "photo") {
      uploadFile(file, "");
    } else {
      setPendingFile({ file });
      setDescriptionInput("");
    }
  };

  const confirmUpload = async () => {
    if (!pendingFile || isUploading) return;
    await uploadFile(pendingFile.file, descriptionInput);
    setPendingFile(null);
    setDescriptionInput("");
  };

  const cancelUpload = () => {
    if (isUploading) return;
    setPendingFile(null);
    setDescriptionInput("");
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

      <h1 onClick={handleTitleClick}>
        Ares Freaky 3.0 {isAdmin && "🔓"}
      </h1>

      <p className="subtitle">
        Un mundo sin límites
      </p>

      {isAdmin && (
        <p className="entriesCounter">
          Entradas totales: {entries}
        </p>
      )}

      {isAdmin && (
        <>
          <div className="buttons">

            <button onClick={() => photoInput.current?.click()} disabled={isUploading}>
              {isUploading ? "Subiendo..." : "Subir fotos"}
            </button>

            <button onClick={() => videoInput.current?.click()} disabled={isUploading}>
              {isUploading ? "Subiendo..." : "Subir videos"}
            </button>

          </div>


          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFileSelected(e, "photo")}
          />


          <input
            ref={videoInput}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => handleFileSelected(e, "video")}
          />
        </>
      )}


      <div className="photoSection">

        <div className="photoCarousel">

          {photos.map((photo)=>(

            <div key={photo.id} className="photoCard">

              <img
                src={photo.url}
                alt="foto"
                onClick={() => openViewer("photo", photo.url, photo.id)}
              />

              <p className="photoStats">
                {photo.date} · {photo.views} vistas
              </p>

            </div>

          ))}

        </div>

      </div>




      <div className="videoSection">

        {videos.map((video)=>(

          <div key={video.id} className="videoCard">

            <video
              src={video.url}
              controls
              onClick={() => openViewer("video", video.url, video.id)}
            />

            <p className="videoMeta">
              {video.description && <span className="videoDescription">{video.description}</span>}
              <span className="videoStats">{video.date} · {video.views} vistas</span>
            </p>

          </div>

        ))}

      </div>



      {viewer && (

        <div
          className="viewer"
          onClick={() => setViewer(null)}
        >

          {viewer.type === "photo" ? (
            <img
              src={viewer.url}
              alt="gran vista"
            />
          ) : (
            <video
              src={viewer.url}
              autoPlay
              playsInline
            />
          )}

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
              <button onClick={cancelUpload} disabled={isUploading}>Cancelar</button>
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