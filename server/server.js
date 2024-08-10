const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://master--clinquant-smakager-c176c0.netlify.app',
    methods: ['GET', 'POST'],
  },
});

let mentors = {};
let studentCounts = {};  // Track student counts for each room
let codeBlocks = {
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

const socketToBlockId = {};

io.on('connection', (socket) => {
  console.log('a user connected' + socket.id);

  socket.on('join', ({ blockId }) => {
    socketToBlockId[socket.id] = blockId;  // Associate the socket.id with blockId
    console.log('join, id=' + socket.id + ', blockId=' + blockId);
    if (!mentors[blockId]) {
      mentors[blockId] = socket.id;
      studentCounts[blockId] = (studentCounts[blockId] || 0);
      socket.emit('role', { role: 'mentor' });
    } else {
      studentCounts[blockId] = (studentCounts[blockId] || 0) + 1;
      socket.emit('role', { role: 'student' });
    }
    socket.join(blockId);
    io.to(blockId).emit('student-count', { count: studentCounts[blockId] });
  });

  socket.on('code-change', ({ blockId, code }) => {
    codeBlocks[blockId] = code;
    socket.to(blockId).emit('code-update', code);
  
    if (code === solutions[blockId]) {
      io.to(blockId).emit('solved');  // Notify all clients in the room that the problem is solved
    }
  });

  socket.on('leave', ({ blockId}) => {
    console.log('leave, id=' + socket.id + ', blockId=' + blockId);
    if (mentors[blockId] === socket.id) {
      delete mentors[blockId];
      studentCounts[blockId] = 0; // Reset student count on mentor leave
      io.to(blockId).emit('student-count', { count: studentCounts[blockId] });
      io.to(blockId).emit('code-clear');  // Notify clients to clear code
      io.to(blockId).emit('redirect');    // Notify clients to redirect
    } else {
      studentCounts[blockId] = Math.max((studentCounts[blockId] || 1) - 1, 0);
      io.to(blockId).emit('student-count', { count: studentCounts[blockId] });
    }
    socket.leave(blockId);
    delete socketToBlockId[socket.id];  // Clean up the mapping
  });

  socket.on('disconnect', () => {
    const blockId = socketToBlockId[socket.id];
    
    if (!blockId) return;  // If blockId is not found, exit early
  
    console.log('disconnected, id=' + socket.id + ', blockId=' + blockId);
    
    if (mentors[blockId] === socket.id) {
      delete mentors[blockId];
      studentCounts[blockId] = 0; // Reset student count on mentor leave
      io.to(blockId).emit('student-count', { count: studentCounts[blockId] });
      io.to(blockId).emit('code-clear');  // Notify clients to clear code
      io.to(blockId).emit('redirect');    // Notify clients to redirect
    } else {
      studentCounts[blockId] = Math.max((studentCounts[blockId] || 1) - 1, 0);
      io.to(blockId).emit('student-count', { count: studentCounts[blockId] });
    }
    
    socket.leave(blockId);
    delete socketToBlockId[socket.id];  // Clean up the mapping
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});
