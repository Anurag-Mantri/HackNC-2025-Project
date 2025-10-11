// server/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcrypt');
const fs = require('fs');
const jwt = require('jsonwebtoken'); // <-- NEW: For JWT

const app = express();
const port = 3001;
const DB_PATH = './database.json';

app.use(cors());
app.use(express.json());

// --- Helper functions to read and write from our JSON database ---
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// --- NEW: Middleware to protect routes ---
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.id; // Add userId to the request object
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// --- AUTHENTICATION ENDPOINTS ---

// SIGN UP (Unchanged)
app.post('/api/signup', async (req, res) => { /* ... existing signup code ... */ });

// LOGIN (UPDATED to return a JWT)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = readDB();
        const user = db.users.find(u => u.email === email);
        if (user && (await bcrypt.compare(password, user.password))) {
            // --- NEW: Create and send token on successful login ---
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.status(200).json({ message: "Login successful!", token: token });
        } else {
            res.status(400).json({ message: "Invalid credentials." });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error during login." });
    }
});


// --- USER-SPECIFIC PROJECT & AI ENDPOINTS ---

// GET a user's projects (Protected)
app.get('/api/projects', protect, (req, res) => {
    const db = readDB();
    const userProjects = db.projects.filter(p => p.userId === req.userId);
    res.json(userProjects);
});

// CREATE a new project for a user (Protected)
app.post('/api/projects', protect, (req, res) => {
    const db = readDB();
    const newProject = {
        id: Date.now(),
        userId: req.userId, // Link project to the logged-in user
        name: req.body.name,
        todos: []
    };
    db.projects.push(newProject);
    writeDB(db);
    res.status(201).json(newProject);
});

// ADD a to-do to a project (Protected)
app.post('/api/projects/:id/todos', protect, (req, res) => {
    const projectId = parseInt(req.params.id);
    const { text } = req.body;
    const db = readDB();
    const projectIndex = db.projects.findIndex(p => p.id === projectId && p.userId === req.userId);

    if (projectIndex !== -1) {
        db.projects[projectIndex].todos.push(text);
        writeDB(db);
        res.status(200).json(db.projects[projectIndex]);
    } else {
        res.status(404).json({ error: 'Project not found or you do not have permission.' });
    }
});

// AI Chat Endpoint (Still needs protection)
app.post('/api/chat', protect, async (req, res) => {
    const { prompt } = req.body;
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.json({ response: text });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});