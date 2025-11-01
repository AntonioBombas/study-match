// src/pages/Conversations.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Garante que o auth está pronto
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "users", currentUser.uid, "conversations"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const otherUID = data.with;

          // Busca dados do outro utilizador
          const userRef = doc(db, "users", otherUID);
          const userSnap = await getDoc(userRef);

          const userData = userSnap.exists()
            ? userSnap.data()
            : { name: "Utilizador desconhecido" };

          return {
            id: otherUID,
            name: userData.name,
            lastMessage: data.lastMessage || "",
            timestamp: data.timestamp?.toDate() || null,
          };
        })
      );

      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const openChat = (uid) => {
    navigate(`/chat/${uid}`);
  };

  if (!currentUser)
    return <p>⚠️ Tens de iniciar sessão para ver as conversas.</p>;
  if (loading) return <p>A carregar conversas...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "1rem" }}>
      <h2>📬 As tuas conversas</h2>

      {conversations.length === 0 && <p>Ainda não tens conversas.</p>}

      <ul>
        {conversations.map((c) => (
          <li
            key={c.id}
            style={{
              borderBottom: "1px solid #eee",
              padding: "10px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>{c.name}</strong>
              <p style={{ margin: 0, color: "#555" }}>{c.lastMessage}</p>
              {c.timestamp && (
                <small style={{ color: "#999" }}>
                  {c.timestamp.toLocaleString()}
                </small>
              )}
            </div>
            <button onClick={() => openChat(c.id)}>💬 Chat</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

