import React from 'react';
import { Link } from 'react-router-dom';

const codeBlocks = [
  { id: 1, name: 'Async Case' },
  { id: 2, name: 'Closure Case' },
  { id: 3, name: 'Promise Case' },
  { id: 4, name: 'Callback Case' },
];

const LobbyPage = () => {
  return (
    <div>
      <h1>Choose code block</h1>
      <ul>
        {codeBlocks.map((block) => (
          <li key={block.id}>
            <Link to={`/code-block/${block.id}`}>{block.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LobbyPage;
