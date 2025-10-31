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
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Filters from "../components/Filters";

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

  const navigate = useNavigate();

  // 🔹 Estado do utilizador atual (para saber se é aluno)
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(auth.currentUser);
  }, []);

  // 🔹 Carrega lista de subjects e universidades
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

  // 🔹 Busca utilizadores (tutores)
  const fetchUsers = async (reset = true) => {
    setLoading(true);
    try {
      let qRef = collection(db, "users");
      const constraints = [];

      // Mostra apenas TUTORES
      constraints.push(where("isTutor", "==", true));

      if (subject) constraints.push(where("subjects", "array-contains", subject));
      if (university) constraints.push(where("university", "==", university));
      if (mode) constraints.push(where("modes", "array-contains", mode));

      // Ordenação
      if (sort === "rating_desc") constraints.push(orderBy("rating", "desc"));
      else if (sort === "rating_asc") constraints.push(orderBy("rating", "asc"));
      else if (sort === "name_asc") constraints.push(orderBy("name", "asc"));
      else constraints.push(orderBy("rating", "desc"));

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

  // 🔹 Atualiza lista ao mudar filtros
  useEffect(() => {
    setLastDoc(null);
    setHasMore(true);
    fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, university, mode, sort]);

  // 🔹 Paginação
  const loadMore = async () => {
    if (!hasMore || !lastDoc) return;

    setLoading(true);
    try {
      let qRef = collection(db, "users");
      const constraints = [];

      constraints.push(where("isTutor", "==", true));
      if (subject) constraints.push(where("subjects", "array-contains", subject));
      if (university) constraints.push(where("university", "==", university));
      if (mode) constraints.push(where("modes", "array-contains", mode));

      if (sort === "rating_desc") constraints.push(orderBy("rating", "desc"));
      else if (sort === "rating_asc") constraints.push(orderBy("rating", "asc"));
      else if (sort === "name_asc") constraints.push(orderBy("name", "asc"));
      else constraints.push(orderBy("rating", "desc"));

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

  // 🔹 Funções dos botões
  const openProfile = (uid) => {
    navigate(`/profile/${uid}`);
  };

  const openChat = (uid) => {
    if (!auth.currentUser) {
      alert("Tens de estar autenticado para enviar mensagens.");
      return;
    }
    if (auth.currentUser.uid === uid) {
      alert("Não podes contactar a ti próprio 😅");
      return;
    }
    navigate(`/chat/${uid}`);
  };

  return (
    <div>
      <h2>Lista de Tutores</h2>

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

      <div style={{ marginTop: 16 }}>
        {loading && <p>Carregando resultados...</p>}
        {!loading && users.length === 0 && (
          <p>Nenhum tutor encontrado com esses filtros.</p>
        )}

        <ul>
          {users.map((u) => (
            <li
              key={u.id}
              style={{
                marginBottom: 12,
                borderBottom: "1px solid #eee",
                paddingBottom: 8,
              }}
            >
              <strong>{u.name || "Sem nome"}</strong> — {u.course || ""} <br />
              <small>{u.university || ""}</small>
              <p>Matérias: {(u.subjects || []).join(", ")}</p>
              <p>Modos: {(u.modes || []).join(", ")}</p>
              <p>Rating: {u.rating ?? "—"}</p>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => openProfile(u.id)}>Ver perfil</button>
                <button onClick={() => openChat(u.id)}>Contactar</button>
              </div>
            </li>
          ))}
        </ul>

        {hasMore && !loading && (
          <button onClick={loadMore}>Carregar mais</button>
        )}
      </div>
    </div>
  );
}

