import React from 'react';
import { Link } from 'react-router-dom';
import './LobbyPage.css';

const codeBlocks = [
  { id: 1, name: 'Async Case' },
  { id: 2, name: 'Closure Case' },
  { id: 3, name: 'Promise Case' },
  { id: 4, name: 'Callback Case' },
];

const LobbyPage = () => {
  return (
    <div className="lobby-container">
      <h1>Choose code block</h1>
      <ul className="code-block-list">
        {codeBlocks.map((block) => (
          <li key={block.id} className="code-block-item">
            <Link to={`/code-block/${block.id}`}>{block.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LobbyPage;
