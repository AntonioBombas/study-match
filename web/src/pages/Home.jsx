// src/pages/Home.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Filters from "../components/Filters";

// 🔹 Foto padrão (silhueta tipo WhatsApp)
const DEFAULT_PHOTO_URL = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function Home() {
  const [subject, setSubject] = useState("");
  const [university, setUniversity] = useState("");
  const [mode, setMode] = useState("");
  const [sort, setSort] = useState("rating_desc");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  const [allSubjects, setAllSubjects] = useState([]);
  const [allUniversities, setAllUniversities] = useState([]);
  const [showTutors, setShowTutors] = useState(true);

  const navigate = useNavigate();

  // 🔹 Carrega lista de disciplinas e universidades
  useEffect(() => {
    const fetchLists = async () => {
      const q = collection(db, "users");
      const snap = await getDocs(q);
      const subjectsSet = new Set();
      const unisSet = new Set();
      snap.forEach((d) => {
        const data = d.data();
        if (Array.isArray(data.subjects))
          data.subjects.forEach((s) => subjectsSet.add(s));
        if (data.university) unisSet.add(data.university);
      });
      setAllSubjects(Array.from(subjectsSet).sort());
      setAllUniversities(Array.from(unisSet).sort());
    };
    fetchLists();
  }, []);

  // 🔹 Busca utilizadores (tutores ou alunos)
  const fetchUsers = async (reset = true) => {
    setLoading(true);
    try {
      let qRef = collection(db, "users");
      const constraints = [];

      constraints.push(where("isTutor", "==", showTutors));

      if (subject) constraints.push(where("subjects", "array-contains", subject));
      if (university) constraints.push(where("university", "==", university));
      if (mode) constraints.push(where("modes", "array-contains", mode));

      if (sort === "rating_desc") constraints.push(orderBy("ratingAvg", "desc"));
      else if (sort === "rating_asc") constraints.push(orderBy("ratingAvg", "asc"));
      else if (sort === "name_asc") constraints.push(orderBy("name", "asc"));
      else constraints.push(orderBy("ratingAvg", "desc"));

      constraints.push(limit(PAGE_SIZE));

      const q = query(qRef, ...constraints);
      const snap = await getDocs(q);

      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(reset ? list : (prev) => [...prev, ...list]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Erro ao buscar utilizadores:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Atualiza lista quando filtros mudam
  useEffect(() => {
    setLastDoc(null);
    setHasMore(true);
    fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, university, mode, sort, showTutors]);

  // 🔹 Paginação
  const loadMore = async () => {
    if (!hasMore || !lastDoc) return;
    setLoading(true);
    try {
      let qRef = collection(db, "users");
      const constraints = [];

      constraints.push(where("isTutor", "==", showTutors));
      if (subject) constraints.push(where("subjects", "array-contains", subject));
      if (university) constraints.push(where("university", "==", university));
      if (mode) constraints.push(where("modes", "array-contains", mode));

      if (sort === "rating_desc") constraints.push(orderBy("ratingAvg", "desc"));
      else if (sort === "rating_asc") constraints.push(orderBy("ratingAvg", "asc"));
      else if (sort === "name_asc") constraints.push(orderBy("name", "asc"));
      else constraints.push(orderBy("ratingAvg", "desc"));

      constraints.push(startAfter(lastDoc));
      constraints.push(limit(PAGE_SIZE));

      const q = query(qRef, ...constraints);
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers((prev) => [...prev, ...list]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Erro ao carregar mais:", err);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = useMemo(() => allSubjects, [allSubjects]);

  // 🔹 Funções de interação
  const openProfile = (uid) => navigate(`/profile/${uid}`);

  const openChat = async (uid) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Tens de estar autenticado para enviar mensagens.");
      return;
    }
    if (currentUser.uid === uid) {
      alert("Não podes contactar a ti próprio 😅");
      return;
    }

    try {
      const chatId =
        currentUser.uid < uid
          ? `${currentUser.uid}_${uid}`
          : `${uid}_${currentUser.uid}`;

      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [currentUser.uid, uid],
          createdAt: new Date(),
        });
      }

      navigate(`/chat/${uid}`);
    } catch (err) {
      console.error("Erro ao abrir chat:", err);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: "1rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>
        {showTutors ? "🎓 Procurar tutores" : "👥 Procurar alunos"}
      </h2>

      {/* Alternador Tutores / Alunos */}
      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={() => setShowTutors(true)}
          style={{
            background: showTutors ? "#4CAF50" : "#ccc",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            marginRight: "8px",
            cursor: "pointer",
          }}
        >
          Ver tutores
        </button>
        <button
          onClick={() => setShowTutors(false)}
          style={{
            background: !showTutors ? "#2196F3" : "#ccc",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Ver alunos
        </button>
      </div>

      <SearchBar value={subject} onChange={setSubject} suggestions={suggestions} />
      <Filters
        university={university}
        setUniversity={setUniversity}
        mode={mode}
        setMode={setMode}
        sort={sort}
        setSort={setSort}
        universities={allUniversities}
      />

      {/* Lista de utilizadores */}
      <div style={{ marginTop: 20 }}>
        {loading && <p>A carregar resultados...</p>}
        {!loading && users.length === 0 && (
          <p>Nenhum utilizador encontrado com esses filtros.</p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "12px",
                background: "#fafafa",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src={u.photoURL || DEFAULT_PHOTO_URL}
                  alt="foto"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid #ccc",
                  }}
                />
                <div>
                  <strong>{u.name || "Sem nome"}</strong>
                  <br />
                  <small>{u.university || "Sem universidade"}</small>
                </div>
              </div>

              <p style={{ marginTop: 10, color: "#555" }}>
                <strong>Curso:</strong> {u.course || "—"}
              </p>
              {u.bio && (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                  {u.bio.slice(0, 80)}
                  {u.bio.length > 80 ? "..." : ""}
                </p>
              )}

              {showTutors && (
                <>
                  <p>
                    <strong>Disciplinas:</strong>{" "}
                    {(u.subjects || []).join(", ") || "—"}
                  </p>
                  <p>
                    <strong>Modos:</strong>{" "}
                    {(u.modes || []).join(", ") || "—"}
                  </p>
                  <p>
                    ⭐ {u.ratingAvg?.toFixed(1) ?? "—"} ({u.ratingCount ?? 0})
                  </p>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "10px",
                }}
              >
                <button onClick={() => openProfile(u.id)}>Ver perfil</button>
                <button onClick={() => openChat(u.id)}>Contactar</button>
              </div>
            </div>
          ))}
        </div>

        {hasMore && !loading && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={loadMore}>Carregar mais</button>
          </div>
        )}
      </div>
    </div>
  );
}

