import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { setDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";

const DEFAULT_PHOTO_URL = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfileForm = () => {
  const [isTutor, setIsTutor] = useState(true);
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [modes, setModes] = useState([]);
  const [photoURL, setPhotoURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // 🔹 Carregar perfil existente
  useEffect(() => {
    const loadProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setUniversity(data.university || "");
          setCourse(data.course || "");
          setBio(data.bio || "");
          setSubjects(data.subjects || []);
          setModes(data.modes || []);
          setIsTutor(data.isTutor ?? true);
          setPhotoURL(data.photoURL || DEFAULT_PHOTO_URL);
          setRatingAvg(data.ratingAvg || 0);
          setRatingCount(data.ratingCount || 0);
        } else {
          setPhotoURL(DEFAULT_PHOTO_URL);
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // 🔹 Lê e comprime imagem antes de guardar
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor seleciona uma imagem válida!");
      return;
    }

    setUploading(true);
    setUploadMessage("📸 A processar imagem...");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400; // px
        const scale = Math.min(1, MAX_WIDTH / img.width);
        const width = img.width * scale;
        const height = img.height * scale;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para JPEG comprimido
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

        setPhotoURL(compressedBase64);
        setUploading(false);
        setUploadMessage("✅ Imagem comprimida com sucesso!");
      };

      img.onerror = () => {
        alert("Erro ao carregar a imagem. Tenta outra.");
        setUploading(false);
        setUploadMessage("");
      };
    };

    reader.readAsDataURL(file);
  };

  // 🔹 Adicionar disciplina
  const addSubject = () => {
    const trimmed = newSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed]);
      setNewSubject("");
    }
  };

  const removeSubject = (subj) => {
    setSubjects(subjects.filter((s) => s !== subj));
  };

  const toggleMode = (mode) => {
    if (modes.includes(mode)) setModes(modes.filter((m) => m !== mode));
    else setModes([...modes, mode]);
  };

  // 🔹 Guardar alterações
  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("Tens de estar autenticado!");
      return;
    }

    try {
      await setDoc(
        doc(db, "users", uid),
        {
          uid,
          name,
          university,
          course,
          bio,
          subjects,
          modes,
          isTutor,
          photoURL: photoURL || DEFAULT_PHOTO_URL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      alert("✅ Perfil atualizado!");
    } catch (err) {
      console.error(err);
      alert("Erro ao guardar perfil.");
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>A carregar...</p>;

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: "1.5rem" }}>
      <h2>Editar Perfil</h2>

      {/* Foto de perfil */}
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <img
          src={photoURL || DEFAULT_PHOTO_URL}
          alt="Foto de perfil"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #ccc",
          }}
        />
        <div style={{ marginTop: 8 }}>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {uploading && <p style={{ color: "#555" }}>{uploadMessage}</p>}
          {!uploading && uploadMessage && (
            <p style={{ color: "green" }}>{uploadMessage}</p>
          )}
        </div>
      </div>

      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <label>Tipo de utilizador:</label>
        <div>
          <label>
            <input
              type="radio"
              checked={isTutor}
              onChange={() => setIsTutor(true)}
            />{" "}
            Tutor
          </label>
          <label style={{ marginLeft: 12 }}>
            <input
              type="radio"
              checked={!isTutor}
              onChange={() => setIsTutor(false)}
            />{" "}
            Aluno
          </label>
        </div>

        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Universidade"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Curso"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          required
        />

        <textarea
          placeholder="Fala um pouco sobre ti..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        {isTutor && (
          <>
            <label>Disciplinas</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <button type="button" onClick={addSubject}>
                +
              </button>
            </div>
            {subjects.map((s, i) => (
              <div key={i}>
                {s}{" "}
                <button
                  type="button"
                  onClick={() => removeSubject(s)}
                  style={{ border: "none", background: "transparent" }}
                >
                  ❌
                </button>
              </div>
            ))}

            <label>Modo</label>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={modes.includes("online")}
                  onChange={() => toggleMode("online")}
                />{" "}
                Online
              </label>
              <label style={{ marginLeft: 12 }}>
                <input
                  type="checkbox"
                  checked={modes.includes("presencial")}
                  onChange={() => toggleMode("presencial")}
                />{" "}
                Presencial
              </label>
            </div>

            <p style={{ color: "#555" }}>
              ⭐ {ratingAvg.toFixed(1)} ({ratingCount} avaliações)
            </p>
          </>
        )}

        <button
          type="submit"
          style={{
            marginTop: 12,
            background: "#007bff",
            color: "#fff",
            padding: "8px 12px",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Salvar
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;

