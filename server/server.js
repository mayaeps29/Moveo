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
    const clientsInRoom = io.sockets.adapter.rooms.get(blockId) || new Set();
    const isMentor = clientsInRoom.size === 0; // The first person to join is the mentor
    console.log(isMentor);
    if (isMentor) {
      mentors[blockId] = socket.id;
    } else {
      socket.emit('role', { role: 'student' });
    }

    socket.join(blockId);
    socket.emit('code-update', codeBlocks[blockId]);

    // Notify all clients in the room about the role
    if (isMentor) {
      io.to(blockId).emit('role', { role: 'mentor' });
    } else {
      socket.emit('role', { role: 'student' });
    }
  });

  socket.on('code-change', ({ blockId, code }) => {
    console.log(code);
    codeBlocks[blockId] = code;
    socket.to(blockId).emit('code-update', code);
  });

  socket.on('leave', ({ blockId }) => {
    if (mentors[blockId] === socket.id) {
      // If the mentor leaves, assign a new mentor if available
      delete mentors[blockId];
      const clientsInRoom = io.sockets.adapter.rooms.get(blockId) || new Set();
      const newMentorId = Array.from(clientsInRoom)[0]; // Get the new mentor (first person in room)
      if (newMentorId) {
        mentors[blockId] = newMentorId;
        io.to(newMentorId).emit('role', { role: 'mentor' });
        io.to(blockId).emit('role', { role: 'student' });
      } else {
        // If no mentor remains, notify all clients to redirect
        io.to(blockId).emit('redirect');
      }
    } else {
      // Notify remaining clients in the room about student count
      const remainingClients = io.sockets.adapter.rooms.get(blockId) || new Set();
      io.to(blockId).emit('student-count', { count: remainingClients.size });
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
