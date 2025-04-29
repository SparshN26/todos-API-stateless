// server.js
// A simple Express.js backend for a Todo list API

const express = require('express');
const path = require('path')
const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Middle ware to inlcude static content
app.use(express.static('public'))

// ADD: sqlite3 database setup
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./todos.db');

// Create the table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    priority TEXT DEFAULT 'low',
    isComplete BOOLEAN DEFAULT 0,
    isFun BOOLEAN DEFAULT 1
  )
`);

// In-memory array to store todo items
// DELETE this old in-memory array logic (replaced with database)
//// let todos = [
////   {
////   id: 0,
////   name: 'nina',
////   priority: 'high',
////   isComplete: false,
////   isFun: false
//// }
//// ];
//// let nextId = 1;

// server index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET all todo items
app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos', (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching todos' });
    } else {
      res.json(rows);
    }
  });
});

// GET a specific todo item by ID
app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching todo' });
    } else if (row) {
      res.json(row);
    } else {
      res.status(404).json({ message: 'Todo item not found' });
    }
  });
});

// POST a new todo item
app.post('/todos', (req, res) => {
  const { name, priority = 'low', isFun = true } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  db.run(
    'INSERT INTO todos (name, priority, isComplete, isFun) VALUES (?, ?, 0, ?)',
    [name, priority, isFun ? 1 : 0],
    function (err) {
      if (err) {
        res.status(500).json({ message: 'Error adding todo' });
      } else {
        res.status(201).json({
          id: this.lastID,
          name,
          priority,
          isComplete: false,
          isFun: isFun ? true : false
        });
      }
    }
  );
});

// DELETE a todo item by ID
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);

  db.run('DELETE FROM todos WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting todo' });
    } else if (this.changes > 0) {
      res.json({ message: `Todo item ${id} deleted.` });
    } else {
      res.status(404).json({ message: 'Todo item not found' });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Todo API server running at http://localhost:${port}`);
});
