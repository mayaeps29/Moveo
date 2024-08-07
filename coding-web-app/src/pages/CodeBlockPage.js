import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { EditorState, basicSetup } from '@codemirror/basic-setup';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';

const socket = io('http://localhost:3001');

const initialCodeBlocks = {
  1: 'console.log("Async Case");',
  2: 'console.log("Closure Case");',
  3: 'console.log("Promise Case");',
  4: 'console.log("Callback Case");',
};

const CodeBlockPage = () => {
  const { id } = useParams();
  const [role, setRole] = useState('student');
  const [editorView, setEditorView] = useState(null);

  useEffect(() => {
    const state = EditorState.create({
      doc: initialCodeBlocks[id],
      extensions: [basicSetup, javascript()],
    });

    const view = new EditorView({
      state,
      parent: document.getElementById('editor'),
    });

    setEditorView(view);

    socket.on('connect', () => {
      console.log('connected to socket');
      socket.emit('join', { blockId: id });

      socket.on('role', (data) => {
        setRole(data.role);
        if (data.role === 'mentor') {
          view.dispatch({
            effects: EditorView.editable.of(false),
          });
        }
      });

      socket.on('code-update', (code) => {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: code },
        });
      });
    });

    return () => {
      socket.emit('leave', { blockId: id });
      view.destroy();
    };
  }, [id]);

  const handleCodeChange = () => {
    const code = editorView.state.doc.toString();
    socket.emit('code-change', { blockId: id, code });
  };

  useEffect(() => {
    if (editorView && role === 'student') {
      editorView.onUpdate = handleCodeChange;
    }
  }, [editorView, role]);

  return (
    <div>
      <h1>Code Block Page</h1>
      <h2>Role: {role}</h2>
      <div id="editor"></div>
    </div>
  );
};

export default CodeBlockPage;
