import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

const Chat = () => {
  const { uid } = useParams(); // UID da pessoa com quem vamos falar
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  // Gerar ID único (ordenado)
  const chatId =
    currentUser && uid
      ? [currentUser.uid, uid].sort().join("_")
      : null;

  // Ler mensagens em tempo real
  useEffect(() => {
    if (!chatId) return;
    const chatDoc = doc(db, "chats", chatId);

    const unsubscribe = onSnapshot(chatDoc, (snap) => {
      if (snap.exists()) {
        setMessages(snap.data().messages || []);
      } else {
        setMessages([]);
      }
    });

    return unsubscribe;
  }, [chatId]);

  // Enviar mensagem
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser || !uid) return;

    const chatDoc = doc(db, "chats", chatId);
    const message = {
      sender: currentUser.uid,
      text: input.trim(),
      timestamp: serverTimestamp(),
    };

    // Cria o chat se não existir, senão atualiza
    await setDoc(
      chatDoc,
      {
        participants: [currentUser.uid, uid],
        messages: arrayUnion(message),
      },
      { merge: true }
    );

    setInput("");
  };

  // Scroll automático para o fim
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: "1rem" }}>
      <h2>💬 Chat</h2>
      <div
        ref={chatRef}
        style={{
          height: "400px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "1rem",
          marginBottom: "1rem",
        }}
      >
        {messages.length === 0 && <p>Nenhuma mensagem ainda.</p>}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.sender === currentUser.uid ? "right" : "left",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                background: msg.sender === currentUser.uid ? "#dcf8c6" : "#f1f0f0",
                padding: "8px 12px",
                borderRadius: "12px",
                display: "inline-block",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="Escreve uma mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default Chat;

