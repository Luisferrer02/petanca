// src/components/PagedBracket.jsx
import React, { useState } from 'react';
import GraphicBracket from './GraphicBracket';
import './pagedBracket.css';

export default function PagedBracket({ rounds, token, onResultUpdated }) {
  const [side, setSide] = useState(0);
  // Particionamos cada ronda en dos mitades
  const roundsA = rounds.map(r => r.slice(0, Math.ceil(r.length/2)));
  const roundsB = rounds.map(r => r.slice(Math.ceil(r.length/2)));

  return (
    <div className="paged-bracket">
      <div className="pb-tabs">
        <button
          className={side===0?'active':''}
          onClick={()=>setSide(0)}
        >Lado A</button>
        <button
          className={side===1?'active':''}
          onClick={()=>setSide(1)}
        >Lado B</button>
      </div>
      <GraphicBracket
        rounds={side===0?roundsA:roundsB}
        token={token}
        onResultUpdated={onResultUpdated}
      />
    </div>
  );
}
