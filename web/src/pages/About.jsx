import React from "react";

export default function About() {
  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", lineHeight: 1.6 }}>
      <h2>Sobre o Study Match</h2>
      <p>
        O <strong>Study Match</strong> é uma plataforma criada para aproximar alunos e tutores universitários.
        Acreditamos que aprender é mais fácil quando se encontra o explicador certo.
      </p>
      <p>
        Este projeto é um protótipo (MVP) desenvolvido com React e Firebase, com o objetivo de
        testar a viabilidade de uma rede de apoio académico.
      </p>
      <h3>Missão</h3>
      <p>
        Tornar a explicação universitária mais acessível, rápida e personalizada.
      </p>
    </div>
  );
}

