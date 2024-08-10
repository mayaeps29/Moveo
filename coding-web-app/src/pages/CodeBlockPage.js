import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import './CodeBlockPage.css';

// Initialize the socket connection to the server (Uncomment the appropriate line depending on your environment (local or production))
const socket = io('https://moveo-production-cea5.up.railway.app');
// const socket = io('http://localhost:3001');

// Mapping of block IDs to their corresponding names
const blockNames = {
  1: 'Async',
  2: 'Closure',
  3: 'Promise',
  4: 'Callback',
};

const CodeBlockPage = () => {
  const { id } = useParams(); // Get the block ID from the URL parameters
  const navigate = useNavigate(); // Hook for navigation
  const [role, setRole] = useState('student'); // State to track the role of the user
  const [code, setCode] = useState(''); // State to hold the code in the editor
  const [studentCount, setStudentCount] = useState(0); // State to track the number of students in the room
  const [solved, setSolved] = useState(false); // State to track if the problem is solved

  useEffect(() => {
    console.log('connected to socket');
  
    socket.emit('join', { blockId: id }); // Emit a 'join' event to the server with the block ID

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

    // Cleanup function to run when the component unmounts or id changes
    return () => {
      socket.emit('leave', { blockId: id }); // Notify the server that the user is leaving
      socket.off(); // Remove all socket listeners
      setSolved(false); // Reset the solved state
    };
  }, [id, navigate]);

  // Function to handle code changes in the editor
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
