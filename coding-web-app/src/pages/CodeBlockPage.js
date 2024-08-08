import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import './CodeBlockPage.css';

const socket = io('http://localhost:3001');

const initialCodeBlocks = {
  1: 'console.log("Async Case");',
  2: 'console.log("Closure Case");',
  3: 'console.log("Promise Case");',
  4: 'console.log("Callback Case");',
};

const solutions = {
  1: 'console.log("Async Case Solved!");',
  2: 'console.log("Closure Case Solved!");',
  3: 'console.log("Promise Case Solved!");',
  4: 'console.log("Callback Case Solved!");',
};


const CodeBlockPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();  // allows to programmatically navigate between different routes in a React application
  const [role, setRole] = useState('student');
  const [code, setCode] = useState(initialCodeBlocks[id]);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    debugger;
    socket.on('connect', () => {  // sets up a listener for the 'connect' event, which is triggered when the client successfully connects to the Socket.IO server.
      console.log('connected to socket');
      socket.emit('join', { blockId: id });  // This sends a 'join' event to the server with the blockId as data

      socket.on('role', (data) => {  // This sets up a listener for the 'role' event
        setRole(data.role);
      });

      socket.on('code-update', (updatedCode) => {  // This listener waits for a 'code-update' event from the server, which sends updated code when another user makes changes
        setCode(updatedCode);
      });

      socket.on('student-count', (data) => {  // This listens for the 'student-count' event, which the server emits to update the number of students currently in the room
        setStudentCount(data.count);
      });

      socket.on('redirect', () => { // The server might emit this when a specific condition is met, such as the mentor leaving the room
        navigate('/');
      });
    });

    return () => {
      socket.emit('leave', { blockId: id });
      socket.off(); // Clean up event listeners
    };
  }, [id, navigate]);

  const handleCodeChange = (newValue) => {  // responsible for handling changes made to the code in the editor
    setCode(newValue);  // updates the local code state with the new value (newValue) that the user has just typed into the editor
    socket.emit('code-change', { blockId: id, code: newValue });

    if (newValue === solutions[id]) {
      alert('🎉 You solved it! 🎉');
    }
  };

  return (
    <div className="code-block-container">
      <h1>Code Block Page - Block {id}</h1>
      <h2>Role: {role}</h2>
      <h3>Students in room: {studentCount}</h3>
      <Editor
        height="90vh"
        defaultLanguage="javascript"
        value={code}
        onChange={handleCodeChange}
        options={{ readOnly: role === 'mentor' }}
      />
    </div>
  );
};


export default CodeBlockPage;
