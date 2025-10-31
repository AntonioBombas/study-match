// src/components/SearchBar.jsx
import React, { useState, useEffect } from "react";

/**
 * Props:
 * - value: string
 * - onChange: (newValue) => void
 * - suggestions: array of strings for autocomplete
 */
export default function SearchBar({ value, onChange, suggestions = [] }) {
  const [input, setInput] = useState(value || "");
  const [show, setShow] = useState(false);
  const [filtered, setFiltered] = useState([]);

  // Debounce input -> updates parent onChange after 300ms
  useEffect(() => {
    const t = setTimeout(() => onChange(input), 300);
    return () => clearTimeout(t);
  }, [input, onChange]);

  useEffect(() => {
    if (!input) {
      setFiltered([]);
      return;
    }
    const q = input.toLowerCase();
    setFiltered(suggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 6));
  }, [input, suggestions]);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 480 }}>
      <input
        placeholder="Pesquisar disciplina (ex: Cálculo 1)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
      />
      {show && filtered.length > 0 && (
        <ul style={{
          position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)",
          background: "white", border: "1px solid #ddd", listStyle: "none", margin: 0, padding: 8, zIndex: 20
        }}>
          {filtered.map((s) => (
            <li
              key={s}
              onClick={() => { setInput(s); onChange(s); setShow(false); }}
              style={{ padding: "6px 8px", cursor: "pointer" }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

