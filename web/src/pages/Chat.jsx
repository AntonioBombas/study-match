// src/pages/Chat.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";

export default function Chat() {
  const { uid } = useParams(); // UID do outro utilizador
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [receiver, setReceiver] = useState(null);
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  // 🔹 Garante que auth está carregado
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const currentUID = currentUser?.uid;
  const chatId = currentUID && uid ? [currentUID, uid].sort().join("_") : null;

  // 🔹 Carrega dados do outro utilizador
  useEffect(() => {
    const fetchReceiver = async () => {
      if (!uid) return;
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setReceiver(snap.data());
    };
    fetchReceiver();
  }, [uid]);

  // 🔹 Escuta mensagens em tempo real
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setMessages(list);
    });

    return () => unsubscribe();
  }, [chatId]);

  // 🔹 Envia mensagem
  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !currentUID || !uid) return;

    try {
      // Adiciona mensagem ao Firestore
      await addDoc(collection(db, "chats", chatId, "messages"), {
        sender: currentUID,
        text,
        timestamp: serverTimestamp(),
      });

      // Atualiza subcoleção de conversas dos dois utilizadores
      await setDoc(
        doc(db, "users", currentUID, "conversations", uid),
        {
          with: uid,
          lastMessage: text,
          timestamp: serverTimestamp(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "users", uid, "conversations", currentUID),
        {
          with: currentUID,
          lastMessage: text,
          timestamp: serverTimestamp(),
        },
        { merge: true }
      );

      setInput("");
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  // 🔹 Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!currentUser) return <p>⚠️ Tens de iniciar sessão para usar o chat.</p>;
  if (!receiver) return <p>A carregar conversa...</p>;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        height: "80vh",
      }}
    >
      <h3>💬 Conversa com {receiver.name}</h3>

      {/* Mensagens */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginTop: 10,
          marginBottom: 10,
          padding: "0 5px",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              textAlign: msg.sender === currentUID ? "right" : "left",
              margin: "4px 0",
            }}
          >
            <span
              style={{
                backgroundColor:
                  msg.sender === currentUID ? "#dcf8c6" : "#f1f0f0",
                padding: "6px 10px",
                borderRadius: 10,
                display: "inline-block",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Campo de envio */}
      <form
        onSubmit={sendMessage}
        style={{
          display: "flex",
          gap: "8px",
          borderTop: "1px solid #ddd",
          paddingTop: "8px",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreve uma mensagem..."
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

