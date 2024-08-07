const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

let mentors = {};
let codeBlocks = {
  1: 'console.log("Async Case");',
  2: 'console.log("Closure Case");',
  3: 'console.log("Promise Case");',
  4: 'console.log("Callback Case");',
};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join', ({ blockId }) => {
    if (!mentors[blockId]) {
      mentors[blockId] = socket.id;
      socket.emit('role', { role: 'mentor' });
      // Emit the current code to the mentor
      socket.emit('code-update', codeBlocks[blockId]);
    } else {
      socket.emit('role', { role: 'student' });
      // Emit the current code to the student
      socket.emit('code-update', codeBlocks[blockId]);
    }
    socket.join(blockId);
  });

  socket.on('code-change', ({ blockId, code }) => {
    codeBlocks[blockId] = code;
    socket.to(blockId).emit('code-update', code);
  });

  socket.on('leave', ({ blockId }) => {
    if (mentors[blockId] === socket.id) {
      delete mentors[blockId];
      if (Object.keys(mentors).length === 0) {
        io.to(blockId).emit('role', { role: 'student' });
      } else {
        io.to(blockId).emit('role', { role: 'mentor' });
      }
      io.to(blockId).emit('redirect');
    }
    socket.leave(blockId);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});
