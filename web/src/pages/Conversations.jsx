// src/pages/Conversations.jsx
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Escuta em tempo real as conversas do utilizador autenticado
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = collection(db, "users", user.uid, "conversations");
    const unsub = onSnapshot(q, async (snap) => {
      const list = [];

      for (const d of snap.docs) {
        const data = d.data();
        // busca o nome do outro utilizador
        const otherRef = doc(db, "users", d.id);
        const otherSnap = await getDoc(otherRef);
        const otherUser = otherSnap.exists() ? otherSnap.data() : {};

        list.push({
          id: d.id,
          ...data,
          name: otherUser.name || "Utilizador desconhecido",
        });
      }

      // Ordena por timestamp (mais recente primeiro)
      list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

      setConversations(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const openChat = (uid) => {
    navigate(`/chat/${uid}`);
  };

  if (loading) return <p>A carregar conversas...</p>;
  if (conversations.length === 0) return <p>Sem conversas ainda.</p>;

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h2>💬 Conversas</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {conversations.map((c) => (
          <li
            key={c.id}
            onClick={() => openChat(c.id)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #ddd",
              padding: "10px",
              cursor: "pointer",
              backgroundColor: c.unread > 0 ? "#f5faff" : "white", // leve azul se tiver mensagens novas
            }}
          >
            <div>
              <strong>{c.name}</strong>
              <p style={{ margin: "4px 0", color: "#666" }}>
                {c.lastMessage || "(sem mensagens ainda)"}
              </p>
            </div>

            {/* 🔵 Bolinha azul se houver mensagens não lidas */}
            {c.unread > 0 && (
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#007bff",
                  marginLeft: "10px",
                }}
              ></div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

