// server/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcrypt');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;
const DB_PATH = './database.json';

app.use(cors());
app.use(express.json());

// --- Helper functions to read and write from our JSON database ---
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// --- Middleware to protect routes ---
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.id;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// --- AUTHENTICATION ENDPOINTS ---

// SIGN UP Endpoint (RESTORED)
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const db = readDB();

        const userExists = db.users.find(user => user.email === email);
        if (userExists) {
            return res.status(400).json({ message: "User with this email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = { id: Date.now(), name, email, password: hashedPassword };
        db.users.push(newUser);
        writeDB(db);

        res.status(201).json({ message: "User created successfully!" });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Server error during signup." });
    }
});

// LOGIN Endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = readDB();
        const user = db.users.find(u => u.email === email);
        if (user && (await bcrypt.compare(password, user.password))) {
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

app.get('/api/projects', protect, (req, res) => {
    const db = readDB();
    const userProjects = db.projects.filter(p => p.userId === req.userId);
    res.json(userProjects);
});

app.post('/api/projects', protect, (req, res) => {
    const db = readDB();
    const newProject = {
        id: Date.now(),
        userId: req.userId,
        name: req.body.name,
        todos: []
    };
    db.projects.push(newProject);
    writeDB(db);
    res.status(201).json(newProject);
});

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

app.post('/api/chat', protect, async (req, res) => {
    const { prompt } = req.body;

    // --- NEW, highly-specific prompt ---
    const structuredPrompt = `
        You are a helpful DIY project assistant for a user of an application similar to Lowe's.
        Analyze the following request and provide a response formatted as a single, clean JSON object.
        Do not include the markdown "\`\`\`json" wrapper in your response.

        The JSON object must have these exact keys:
        - "summary": A single, concise sentence summarizing the answer.
        - "materials": An array of strings, listing necessary tools and materials. This can be empty.
        - "steps": An array of strings, listing the core action steps. This can be empty.
        - "questions": An array of 3-4 relevant, short follow-up questions to guide the user towards the next step or a more detailed plan.

        Here is the user's request: "${prompt}"
    `;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(structuredPrompt);
        const textResponse = result.response.text();

        // --- NEW: Parse the AI's text response into a JSON object ---
        const jsonResponse = JSON.parse(textResponse);

        res.json(jsonResponse); // Send the structured JSON to the frontend
    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ error: 'Failed to get a structured response from AI.' });
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});