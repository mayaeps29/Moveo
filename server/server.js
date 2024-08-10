const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    //origin: 'https://master--clinquant-smakager-c176c0.netlify.app',
    methods: ['GET', 'POST'],
  },
});

const initialCodeBlocks = {
  1: 'console.log("Async Case");',
  2: 'console.log("Closure Case");',
  3: 'console.log("Promise Case");',
  4: 'console.log("Callback Case");',
};

let mentors = {};
let studentCounts = {};  // Track student counts for each room
let codeBlocks = {
  1: 'console.log("Async Case");',
  2: 'console.log("Closure Case");',
  3: 'console.log("Promise Case");',
  4: 'console.log("Callback Case");',
};


let solutions = {
  1: 'solution 1',
  2: 'solution 2',
  3: 'solution 3',
  4: 'solution 4',
};

const readSolutionsFromDB = (callback) => {
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'moveo',
  });

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err.stack);
      return;
    }
    console.log('Connected to MySQL as id', connection.threadId);
  });

  const query = 'SELECT * FROM `moveo`.`codes_solutions`;';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err.stack);
      return;
    }

    results.forEach(row => {
      if (solutions.hasOwnProperty(row.id)) {
        solutions[row.id] = row.code;
      }
    });

    // Call the callback function with the updated solutions
    callback(solutions);

    connection.end(); // Close the connection
  });
};

// Usage of the function
readSolutionsFromDB((updatedSolutions) => {
  console.log('Updated Solutions:', updatedSolutions);
  if (Object.entries(updatedSolutions).length == 4)
  {
    solutions = updatedSolutions;  
  }
});


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
    const currentCode = codeBlocks[blockId];
    socket.emit('code-update', currentCode);
    io.to(blockId).emit('student-count', { count: studentCounts[blockId] });
  });

  socket.on('code-change', ({ blockId, code }) => {
    codeBlocks[blockId] = code;
    socket.to(blockId).emit('code-update', code);
  
    if (code === solutions[blockId]) {
      io.to(blockId).emit('solved');  // Notify all clients in the room that the problem is solved
    }
  });

  const leaveOrDisconnect = (blockId) => {
    if (mentors[blockId] === socket.id) {
      delete mentors[blockId];
      studentCounts[blockId] = 0; // Reset student count on mentor leave
      io.to(blockId).emit('student-count', { count: studentCounts[blockId] });
      io.to(blockId).emit('code-clear');  // Notify clients to clear code
      io.to(blockId).emit('redirect');    // Notify clients to redirect
    } else {
      studentCounts[blockId] = Math.max((studentCounts[blockId] || 1) - 1, 0);
      if (studentCounts[blockId] === 0) {
        codeBlocks[blockId] = initialCodeBlocks[blockId]; // Reset the code to the initial code
        io.to(blockId).emit('code-update', codeBlocks[blockId]);  // Send the reset code to clients
      }
      io.to(blockId).emit('student-count', { count: studentCounts[blockId] });
    }
    socket.leave(blockId);
    delete socketToBlockId[socket.id];  // Clean up the mapping
  }

  socket.on('leave', ({ blockId}) => {
    console.log('leave, id=' + socket.id + ', blockId=' + blockId);
    leaveOrDisconnect(blockId);
  });

  socket.on('disconnect', () => {
    const blockId = socketToBlockId[socket.id];
    if (!blockId) return;  // If blockId is not found, exit early
    console.log('disconnected, id=' + socket.id + ', blockId=' + blockId);
    leaveOrDisconnect(blockId);
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});
