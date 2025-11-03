// src/pages/Home.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";

// URL de imagem padrão (silhueta tipo WhatsApp)
const DEFAULT_PHOTO_URL = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// Util: normalizar texto para comparação
const normalize = (s = "") => s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function Home() {
  // -------- filtros & pesquisa --------
  const [searchText, setSearchText] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  const [mode, setMode] = useState(""); // "online" | "presencial" | ""
  const [minRating, setMinRating] = useState(0); // filtro por classificação mínima (0-5)
  const [sort, setSort] = useState("rating_desc"); // rating_desc, rating_asc, name_asc, updated_desc

  // -------- resultados & paginação --------
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // -------- listas para autocomplete/checkboxes --------
  const [allSubjects, setAllSubjects] = useState([]);
  const [allUniversities, setAllUniversities] = useState([]);

  const [showTutors, setShowTutors] = useState(true);

  const navigate = useNavigate();

  // -------- Carrega lists (subjects + universities) uma vez --------
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const q = collection(db, "users");
        const snap = await getDocs(q);
        const subs = new Set();
        const unis = new Set();
        snap.forEach((d) => {
          const data = d.data();
          if (Array.isArray(data.subjects)) data.subjects.forEach((s) => subs.add(s));
          if (data.university) unis.add(data.university);
        });
        setAllSubjects(Array.from(subs).sort());
        setAllUniversities(Array.from(unis).sort());
      } catch (err) {
        console.error("Erro a carregar listas:", err);
      }
    };
    fetchLists();
  }, []);

  // -------- Monta e executa a query no Firestore (sem real-time) --------
  // Nota: fazemos fetch quando filtros mudam (reset) e usamos loadMore para paginação.
  const runQuery = async (reset = true) => {
    setLoading(true);
    try {
      let qRef = collection(db, "users");
      const constraints = [];

      // sempre filtramos por isTutor/apenas alunos conforme showTutors
      constraints.push(where("isTutor", "==", showTutors));

      // filtros que podem ser empurrados para a query
      if (selectedSubjects.length) {
        // array-contains-any (até 10 elementos)
        constraints.push(where("subjects", "array-contains-any", selectedSubjects));
      }
      if (selectedUniversities.length) {
        // 'in' exige que o array tenha <=10 elementos
        constraints.push(where("university", "in", selectedUniversities));
      }
      if (mode) {
        constraints.push(where("modes", "array-contains", mode));
      }
      if (minRating > 0) {
        // Não existe operador >= em Firestore sem index e sem combinacões complexas
        // Melhor abordagem: trazemos resultados e filtramos client-side por minRating
        // (não adicionamos aqui a constraint para simplificar). We'll filter client-side.
      }

      // ordenação (se precisa de orderBy em campo não-indexado, pode pedir índice)
      if (sort === "rating_desc" || sort === "rating_asc") {
        constraints.push(orderBy("ratingAvg", sort === "rating_desc" ? "desc" : "asc"));
      } else if (sort === "name_asc") {
        constraints.push(orderBy("name", "asc"));
      } else if (sort === "updated_desc") {
        constraints.push(orderBy("updatedAt", "desc"));
      } else {
        constraints.push(orderBy("ratingAvg", "desc"));
      }

      constraints.push(limit(PAGE_SIZE));

      // se reset==false e tivermos lastDoc, paginamos com startAfter
      if (!reset && lastDoc) {
        constraints.splice(constraints.length - 1, 0, startAfter(lastDoc)); // antes do limit
      }

      const q = query(qRef, ...constraints);
      const snap = await getDocs(q);

      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Aplicar filtros client-side adicionais:
      // - searchText (nome, course, bio, subject, university)
      // - minRating
      const filtered = applyClientSideFilters(list, { searchText, minRating });

      if (reset) setUsers(filtered);
      else setUsers((prev) => [...prev, ...filtered]);

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Erro ao buscar utilizadores:", err);
    } finally {
      setLoading(false);
    }
  };

  // função auxiliar para filtros client-side
  const applyClientSideFilters = (list, { searchText, minRating }) => {
    const tokens = (searchText || "")
      .split(/\s+/)
      .map((t) => normalize(t))
      .filter(Boolean);

    return list.filter((u) => {
      // minRating
      if (minRating > 0 && (u.ratingAvg ?? 0) < minRating) return false;

      // search tokens: cada token deve aparecer em pelo menos um dos campos (name, course, bio, subjects, university)
      if (tokens.length) {
        const hay = [
          normalize(u.name || ""),
          normalize(u.course || ""),
          normalize(u.bio || ""),
          normalize(u.university || ""),
          ...(Array.isArray(u.subjects) ? u.subjects.map((s) => normalize(s)) : []),
        ].join(" ");

        // every token must be present
        return tokens.every((tk) => hay.includes(tk));
      }
      return true;
    });
  };

  // -------- Efeito principal: executa a query quando filtros mudam (reset) --------
  useEffect(() => {
    // reset lastDoc porque estamos a buscar do inicio
    setLastDoc(null);
    setHasMore(true);
    runQuery(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjects, selectedUniversities, mode, minRating, sort, showTutors, searchText]);

  // -------- carregar mais (página) --------
  const loadMore = async () => {
    if (!hasMore || !lastDoc) return;
    await runQuery(false);
  };

  // -------- funções UI para selecionar/remover filtros --------
  const toggleSubject = (s) =>
    setSelectedSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleUniversity = (u) =>
    setSelectedUniversities((prev) => (prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]));
  const clearFilters = () => {
    setSelectedSubjects([]);
    setSelectedUniversities([]);
    setMode("");
    setMinRating(0);
    setSort("rating_desc");
    setSearchText("");
  };

  // -------- Interações (perfil / chat) --------
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

      const chatRef = collection(db, "chats");
      // Criamos/abrimos chat no backend (opcional, já podes navegar)
      // Para manter simples aqui apenas navegamos:
      navigate(`/chat/${uid}`);
    } catch (err) {
      console.error("Erro ao abrir chat:", err);
      navigate(`/chat/${uid}`);
    }
  };

  // -------- Sugestões (autocomplete) --------
  const suggestionsSubjects = useMemo(() => allSubjects.slice(0, 50), [allSubjects]);
  const suggestionsUniversities = useMemo(() => allUniversities.slice(0, 50), [allUniversities]);

  return (
    <div style={{ maxWidth: 1100, margin: "auto", padding: "1rem" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>{showTutors ? "🎓 Procurar tutores" : "👥 Procurar alunos"}</h2>

      {/* Alternador Tutores / Alunos */}
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <button
          onClick={() => setShowTutors(true)}
          style={{
            background: showTutors ? "#4CAF50" : "#e0e0e0",
            color: showTutors ? "#fff" : "#000",
            border: "none",
            padding: "6px 12px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Ver tutores
        </button>
        <button
          onClick={() => setShowTutors(false)}
          style={{
            background: !showTutors ? "#2196F3" : "#e0e0e0",
            color: !showTutors ? "#fff" : "#000",
            border: "none",
            padding: "6px 12px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Ver alunos
        </button>
      </div>

      {/* ===== Barra de pesquisa + controls ===== */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder='Pesquisar (ex: "matemática Técnico online")'
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" }}
        />

        <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} style={{ padding: "8px", borderRadius: 6 }}>
          <option value={0}>Qualquer rating</option>
          <option value={1}>≥ 1 ⭐</option>
          <option value={2}>≥ 2 ⭐</option>
          <option value={3}>≥ 3 ⭐</option>
          <option value={4}>≥ 4 ⭐</option>
          <option value={5}>5 ⭐</option>
        </select>

        <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: "8px", borderRadius: 6 }}>
          <option value="">Qualquer modo</option>
          <option value="online">Online</option>
          <option value="presencial">Presencial</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: "8px", borderRadius: 6 }}>
          <option value="rating_desc">Melhor classificação</option>
          <option value="rating_asc">Classificação ascendente</option>
          <option value="name_asc">Nome A–Z</option>
          <option value="updated_desc">Atualizados recentemente</option>
        </select>

        <button onClick={clearFilters} style={{ padding: "8px 10px", borderRadius: 6, background: "#f5f5f5", border: "1px solid #ddd" }}>
          Limpar filtros
        </button>
      </div>

      {/* ===== Multiselects: disciplinas e universidades (simples) ===== */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ minWidth: 220 }}>
          <strong>Disciplinas</strong>
          <div style={{ maxHeight: 120, overflow: "auto", border: "1px solid #eee", padding: 8, borderRadius: 6 }}>
            {suggestionsSubjects.length === 0 && <small>Nenhuma disciplina</small>}
            {suggestionsSubjects.map((s) => (
              <label key={s} style={{ display: "block", marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(s)}
                  onChange={() => toggleSubject(s)}
                />{" "}
                {s}
              </label>
            ))}
          </div>
        </div>

        <div style={{ minWidth: 220 }}>
          <strong>Universidades</strong>
          <div style={{ maxHeight: 120, overflow: "auto", border: "1px solid #eee", padding: 8, borderRadius: 6 }}>
            {suggestionsUniversities.length === 0 && <small>Nenhuma universidade</small>}
            {suggestionsUniversities.map((u) => (
              <label key={u} style={{ display: "block", marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={selectedUniversities.includes(u)}
                  onChange={() => toggleUniversity(u)}
                />{" "}
                {u}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Chips de filtros ativos ===== */}
      <div style={{ marginBottom: 12 }}>
        {searchText && <span style={chipStyle} onClick={() => setSearchText("")}>🔎 {searchText} ✕</span>}
        {selectedSubjects.map((s) => <span key={s} style={chipStyle} onClick={() => toggleSubject(s)}>{s} ✕</span>)}
        {selectedUniversities.map((u) => <span key={u} style={chipStyle} onClick={() => toggleUniversity(u)}>{u} ✕</span>)}
        {mode && <span style={chipStyle} onClick={() => setMode("")}>{mode} ✕</span>}
        {minRating > 0 && <span style={chipStyle} onClick={() => setMinRating(0)}>⭐≥{minRating} ✕</span>}
      </div>

      {/* ===== Lista de resultados ===== */}
      <div style={{ marginTop: 8 }}>
        {loading && <p>A carregar resultados...</p>}
        {!loading && users.length === 0 && <p>Nenhum utilizador encontrado com esses filtros.</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {users.map((u) => (
            <article key={u.id} className="user-card" style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, background: "#fff" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img src={u.photoURL || DEFAULT_PHOTO_URL} alt="foto" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "1px solid #ccc" }} />
                <div style={{ textAlign: "left" }}>
                  <strong style={{ fontSize: 16 }}>{u.name || "Sem nome"}</strong><br />
                  <small style={{ color: "#666" }}>{u.university || "Sem universidade"}</small>
                </div>
              </div>

              <p style={{ marginTop: 10, color: "#333" }}><strong>Curso:</strong> {u.course || "—"}</p>
              {u.bio && <p style={{ color: "#666", fontStyle: "italic" }}>{u.bio.slice(0, 100)}{(u.bio || "").length > 100 ? "..." : ""}</p>}

              {showTutors && (
                <>
                  <p style={{ marginTop: 6 }}><strong>Disciplinas:</strong> {(u.subjects || []).join(", ") || "—"}</p>
                  <p style={{ marginTop: 4 }}><strong>Modos:</strong> {(u.modes || []).join(", ") || "—"}</p>
                  <p style={{ marginTop: 4 }}>⭐ {(u.ratingAvg ?? "—").toString()} ({u.ratingCount ?? 0})</p>
                </>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <button className="secondary" onClick={() => openProfile(u.id)}>Ver perfil</button>
                <button className="primary" onClick={() => openChat(u.id)}>Contactar</button>
              </div>
            </article>
          ))}
        </div>

        {hasMore && !loading && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button className="load-more" onClick={loadMore}>Carregar mais</button>
          </div>
        )}
      </div>
    </div>
  );
}

// estilo simples para chips
const chipStyle = {
  display: "inline-block",
  padding: "6px 10px",
  marginRight: 8,
  marginBottom: 6,
  background: "#eef",
  borderRadius: 999,
  cursor: "pointer",
  fontSize: 14,
};

