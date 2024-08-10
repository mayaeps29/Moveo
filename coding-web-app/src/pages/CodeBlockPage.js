import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import './CodeBlockPage.css';

// const socket = io('http://localhost:3001');
const socket = io('https://moveo-production-cea5.up.railway.app');

const initialCodeBlocks = {
  1: 'console.log("Async Case");',
  2: 'console.log("Closure Case");',
  3: 'console.log("Promise Case");',
  4: 'console.log("Callback Case");',
};

const blockNames = {
  1: 'Async',
  2: 'Closure',
  3: 'Promise',
  4: 'Callback',
};

const CodeBlockPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [code, setCode] = useState(initialCodeBlocks[id]);
  const [studentCount, setStudentCount] = useState(0);
  const [solved, setSolved] = useState(false); // State to track if the problem is solved

  useEffect(() => {
    console.log('connected to socket');
    socket.emit('join', { blockId: id });

    socket.on('role', (data) => {

      setRole(data.role);
    });

    socket.on('code-update', (updatedCode) => {
      setCode(updatedCode);
    });

    socket.on('student-count', (data) => {
      setStudentCount(data.count);
    });

    socket.on('solved', () => {
      setSolved(true);  // This triggers the smiley face display
    });

    socket.on('redirect', () => {
      navigate('/');
    });

    return () => {
      socket.emit('leave', { blockId: id });
      socket.off(); // Clean up event listeners
      setSolved(false);
    };
  }, [id, navigate]);

  debugger;
  const handleCodeChange = (newValue) => {
    setCode(newValue);
    socket.emit('code-change', { blockId: id, code: newValue });

  };

  return (
    <div className="code-block-container">
      <h1> {blockNames[id]} Code Block Page </h1>
      <h2>Role: {role}</h2>
      <h3>Students in room: {studentCount}</h3>
  
      <Editor
        height="90vh"
        defaultLanguage="javascript"
        value={code}
        onChange={handleCodeChange}
        options={{ readOnly: role === 'mentor' }}
      />
      {solved && <div className="smiley">😊</div>}
    </div>
  );
};

export default CodeBlockPage;
