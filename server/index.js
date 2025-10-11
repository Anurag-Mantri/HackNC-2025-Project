// server/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory database for hackathon simplicity
let projects = [
    { id: 1, name: 'Build a Bookshelf', todos: ['Design the shelf', 'Buy wood', 'Cut pieces'] },
    { id: 2, name: 'Garden Bed', todos: ['Clear area', 'Build the frame'] }
];

// --- API Endpoints ---

// GET all projects
app.get('/api/projects', (req, res) => {
    res.json(projects);
});

// CREATE a new project
app.post('/api/projects', (req, res) => {
    const newProject = { id: Date.now(), name: req.body.name, todos: [] };
    projects.push(newProject);
    res.status(201).json(newProject);
});

// AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;

    try {
        // Use the updated, correct model name
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        res.json({ response: text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});

// --- NEW ENDPOINT: Add a to-do item to a specific project ---
app.post('/api/projects/:id/todos', (req, res) => {
    const projectId = parseInt(req.params.id);
    const { text } = req.body;

    const project = projects.find(p => p.id === projectId);

    if (project) {
        if (text) {
            project.todos.push(text);
        }
        res.status(200).json(project);
    } else {
        res.status(404).json({ error: 'Project not found' });
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});