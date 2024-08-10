const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS)

// Create an HTTP server and a Socket.IO server attached to it
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    //origin: 'http://localhost:3000',
    origin: 'https://master--clinquant-smakager-c176c0.netlify.app', // Specify the origin that is allowed to connect to the server
    methods: ['GET', 'POST'],
  },
});

// Initial code blocks for each problem type
const initialCodeBlocks = {
  1: 'console.log("Async Case");',
  2: 'console.log("Closure Case");',
  3: 'console.log("Promise Case");',
  4: 'console.log("Callback Case");',
};

let mentors = {}; // Track the mentors by block ID
let studentCounts = {}; // Track student counts for each room
// Track the current code for each block
let codeBlocks = {
  1: 'console.log("Async Case");',
  2: 'console.log("Closure Case");',
  3: 'console.log("Promise Case");',
  4: 'console.log("Callback Case");',
};

// Default solutions for each problem block
let solutions = {
  1: 'solution 1',
  2: 'solution 2',
  3: 'solution 3',
  4: 'solution 4',
};

// Function to read solutions from the database and update the 'solutions' object
const readSolutionsFromDB = (callback) => {
  const connection = mysql.createConnection({
    /*host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'moveo',*/
    host: 'monorail.proxy.rlwy.net',
    user: 'root',
    password: 'OOCeDAtvRqmkSHTgORaKsfeuNrugfPvy',
    database: 'railway',
    port: 10306,
  });

  // Connect to the MySQL database
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err.stack);
      return;
    }
    console.log('Connected to MySQL as id', connection.threadId);
  });

  const query = 'SELECT * FROM `codes_solutions`;'; // Query the database for the code solutions

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err.stack);
      return;
    }

    // Update the solutions object with the data from the database
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

// Call the function to load solutions from the database
readSolutionsFromDB((updatedSolutions) => {
  console.log('Updated Solutions:', updatedSolutions);
  if (Object.entries(updatedSolutions).length == 4)
  {
    solutions = updatedSolutions;  
  }
});

const socketToBlockId = {}; // Map each socket to a block ID

// Handle connections from clients
io.on('connection', (socket) => {
  console.log('a user connected' + socket.id);

  // Handle when a client joins a code block room
  socket.on('join', ({ blockId }) => {
    socketToBlockId[socket.id] = blockId;  // Associate the socket.id with blockId
    console.log('join, id=' + socket.id + ', blockId=' + blockId);

    // Assign the first user in the block as the mentor
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

  // Handle code changes from clients
  socket.on('code-change', ({ blockId, code }) => {
    codeBlocks[blockId] = code;
    socket.to(blockId).emit('code-update', code);
  
    if (code === solutions[blockId]) {
      io.to(blockId).emit('solved');  // Notify all clients in the room that the problem is solved
    }
  });

  // Function to handle when a user leaves or disconnects from a block
  const leaveOrDisconnect = (blockId) => {
    if (mentors[blockId] === socket.id) {
      delete mentors[blockId];
      studentCounts[blockId] = 0; // Reset student count on mentor leave
      io.to(blockId).emit('student-count', { count: studentCounts[blockId] });
      io.to(blockId).emit('code-clear');  
      io.to(blockId).emit('redirect');    
    } else {
      studentCounts[blockId] = Math.max((studentCounts[blockId] || 1) - 1, 0); // Decrement student count
      if (studentCounts[blockId] === 0) {
        codeBlocks[blockId] = initialCodeBlocks[blockId]; // Reset the code to the initial code
        io.to(blockId).emit('code-update', codeBlocks[blockId]);  
      }
      io.to(blockId).emit('student-count', { count: studentCounts[blockId] });
    }
    socket.leave(blockId); // Remove the socket from the room
    delete socketToBlockId[socket.id];  // Clean up the mapping
  }

  // Handle when a client leaves the room
  socket.on('leave', ({ blockId}) => {
    console.log('leave, id=' + socket.id + ', blockId=' + blockId);
    leaveOrDisconnect(blockId);
  });

  // Handle when a client disconnects
  socket.on('disconnect', () => {
    const blockId = socketToBlockId[socket.id];
    if (!blockId) return;  
    console.log('disconnected, id=' + socket.id + ', blockId=' + blockId);
    leaveOrDisconnect(blockId);
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});
