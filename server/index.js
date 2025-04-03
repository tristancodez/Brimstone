import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", process.env.FRONTEND_URL || "*"],
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: ["http://localhost:5173", process.env.FRONTEND_URL || "*"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));
app.use(express.json());

// In-memory storage (replace with a proper database in production)
const messages = [];
const meetings = [];
const todos = [];





// Message routes
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

// Meeting routes
app.get('/api/meetings', (req, res) => {
  res.json(meetings);
});

app.post('/api/meetings', (req, res) => {
  const { title, date, description, attendees } = req.body;
  const meeting = {
    id: meetings.length + 1,
    title,
    date,
    description,
    attendees,
    createdAt: new Date().toISOString()
  };
  meetings.push(meeting);
  io.emit('newMeeting', meeting);
  res.status(201).json(meeting);
});

// Todo routes
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const { title, description, dueDate } = req.body;
  const todo = {
    id: todos.length + 1,
    title,
    description,
    dueDate,
    completed: false,
    createdAt: new Date().toISOString()
  };
  todos.push(todo);
  res.status(201).json(todo);
});

app.patch('/api/todos/:id', (req, res) => {
  const todoId = parseInt(req.params.id);
  const todoIndex = todos.findIndex(t => t.id === todoId);
  
  if (todoIndex === -1) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  todos[todoIndex] = { ...todos[todoIndex], ...req.body };
  res.json(todos[todoIndex]);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('message', (message) => {
    messages.push(message);
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});