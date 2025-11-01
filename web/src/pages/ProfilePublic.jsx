// src/pages/ProfilePublic.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function ProfilePublic() {
  const { uid } = useParams(); // UID do tutor vindo da URL
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
      alert("Tens de estar autenticado para contactar um tutor.");
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
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "1rem" }}>
      <h2>{profile.name}</h2>
      <p><strong>Universidade:</strong> {profile.university || "—"}</p>
      <p><strong>Curso:</strong> {profile.course || "—"}</p>
      <p><strong>Disciplinas:</strong> {(profile.subjects || []).join(", ")}</p>
      <p><strong>Modos:</strong> {(profile.modes || []).join(", ")}</p>
      <p><strong>Tipo:</strong> {profile.isTutor ? "Tutor" : "Aluno"}</p>

      <button onClick={handleContact} style={{ marginTop: "1rem" }}>
        Contactar
      </button>
    </div>
  );
}

