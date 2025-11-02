// src/pages/ProfilePublic.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

// 🔹 Foto padrão (silhueta estilo WhatsApp)
const DEFAULT_PHOTO_URL = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function ProfilePublic() {
  const { uid } = useParams(); // UID do utilizador vindo da URL
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setProfile(snap.data());
        else setProfile(null);
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uid]);

  const handleContact = () => {
    if (!auth.currentUser) {
      alert("Tens de estar autenticado para contactar.");
      return;
    }
    if (auth.currentUser.uid === uid) {
      alert("Não podes contactar a ti próprio 😅");
      return;
    }
    navigate(`/chat/${uid}`);
  };

  if (loading) return <p>A carregar perfil...</p>;
  if (!profile) return <p>Perfil não encontrado.</p>;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        padding: "1.5rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      {/* 🔹 Foto e nome */}
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <img
          src={profile.photoURL || DEFAULT_PHOTO_URL}
          alt="Foto de perfil"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #ccc",
          }}
        />
        <h2 style={{ marginTop: "10px" }}>{profile.name || "Sem nome"}</h2>
        <p style={{ color: "#666" }}>
          <strong>{profile.course || "Curso não indicado"}</strong> —{" "}
          {profile.university || "Universidade não indicada"}
        </p>
        <p style={{ color: "#444", marginTop: "4px" }}>
          {profile.isTutor ? "🎓 Tutor" : "👥 Aluno"}
        </p>
      </div>

      {/* 🔹 Bio */}
      {profile.bio && (
        <p
          style={{
            fontStyle: "italic",
            background: "#f9f9f9",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          “{profile.bio}”
        </p>
      )}

      {/* 🔹 Informação adicional para tutores */}
      {profile.isTutor && (
        <>
          <h3>📚 Disciplinas</h3>
          {profile.subjects?.length ? (
            <ul>
              {profile.subjects.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <p>Sem disciplinas registadas.</p>
          )}

          <h3>💡 Modos</h3>
          <p>{(profile.modes || []).join(", ") || "Não indicado"}</p>

          <h3>⭐ Avaliação</h3>
          <p>
            {profile.ratingAvg?.toFixed(1) ?? "—"} (
            {profile.ratingCount ?? 0} avaliações)
          </p>
        </>
      )}

      {/* 🔹 Botão de contacto */}
      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <button
          onClick={handleContact}
          style={{
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "10px 16px",
            cursor: "pointer",
          }}
        >
          💬 Contactar
        </button>
      </div>
    </div>
  );
}

