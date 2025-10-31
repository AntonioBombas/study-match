// src/components/Filters.jsx
import React from "react";

export default function Filters({
  university,
  setUniversity,
  mode,
  setMode,
  sort,
  setSort,
  universities = []
}) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
      <select value={university} onChange={e => setUniversity(e.target.value)}>
        <option value="">Todas universidades</option>
        {universities.map(u => <option key={u} value={u}>{u}</option>)}
      </select>

      <select value={mode} onChange={e => setMode(e.target.value)}>
        <option value="">Qualquer modo</option>
        <option value="online">Online</option>
        <option value="presencial">Presencial</option>
      </select>

      <select value={sort} onChange={e => setSort(e.target.value)}>
        <option value="rating_desc">Ordenar: rating (desc)</option>
        <option value="rating_asc">Ordenar: rating (asc)</option>
        <option value="name_asc">Ordenar: nome (A→Z)</option>
      </select>
    </div>
  );
}

