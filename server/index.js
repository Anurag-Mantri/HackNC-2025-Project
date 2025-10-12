// server/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcrypt');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // <-- ADD THIS
const path = require('path');     // <-- AND THIS

const app = express();
const port = 3001;
const DB_PATH = './database.json';

const allowedOrigins = [
    'http://localhost:3000', // For local development
    'http://cama-lowesproj.us',
    'http://www.cama-lowesproj.us',
    'https://cama-lowesproj-frontend.onrender.com' // <-- THIS IS THE CRITICAL ADDITION
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
    }
};

app.use(cors());
app.use(express.json());

// Multer Configuration for Image Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // The 'uploads/' folder in your server directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

// --- Helper Functions to Read/Write from JSON Database ---
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// --- Middleware to Protect Routes with JWT ---
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

// GET all community posts
app.get('/api/posts', (req, res) => {
    const db = readDB();
    const sortedPosts = db.posts.sort((a, b) => b.timestamp - a.timestamp);
    res.json(sortedPosts);
});

// CREATE a new community post
app.post('/api/posts', protect, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const db = readDB();
        const user = db.users.find(u => u.id === req.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const newPost = {
            id: Date.now(),
            userId: req.userId,
            userEmail: user.email,
            content: content,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
            timestamp: Date.now()
        };

        db.posts.push(newPost);
        writeDB(db);
        res.status(201).json(newPost);

    } catch (error) {
        console.error("Post creation error:", error);
        res.status(500).json({ message: "Server error while creating post." });
    }
});

// server/index.js

// --- REPLACE your old app.delete with this entire block ---
app.delete('/api/posts/:postId', protect, (req, res) => {
    console.log(`--- DELETE request received for post ID: ${req.params.postId} ---`);
    try {
        const postId = parseInt(req.params.postId);
        const loggedInUserId = req.userId;
        console.log(`Parsed Post ID: ${postId}, Logged in User ID: ${loggedInUserId}`);

        if (isNaN(postId)) {
             console.error("Error: Post ID is not a number.");
             return res.status(400).json({ message: 'Invalid post ID.' });
        }

        const db = readDB();
        console.log("Database read successfully.");

        if (!db.posts || !Array.isArray(db.posts)) {
            console.error("CRITICAL: db.posts is not an array or does not exist.");
            return res.status(500).json({ message: 'Server database is malformed.' });
        }
        console.log("db.posts is a valid array.");

        const postToDelete = db.posts.find(p => p.id === postId);

        if (!postToDelete) {
            console.log(`Post with ID ${postId} not found in database.`);
            return res.status(404).json({ message: 'Post not found.' });
        }
        console.log("Found post to delete:", JSON.stringify(postToDelete));

        // Explicitly check if the post object has a userId
        if (postToDelete.userId === undefined) {
             console.error(`Post ${postId} is missing the 'userId' property.`);
             return res.status(403).json({ message: 'Cannot verify post author.' });
        }

        if (postToDelete.userId !== loggedInUserId) {
            console.log(`Authorization failed. Post Author ID: ${postToDelete.userId}, User ID: ${loggedInUserId}`);
            return res.status(403).json({ message: 'Forbidden: You can only delete your own posts.' });
        }
        console.log("Authorization successful. Proceeding with deletion.");

        db.posts = db.posts.filter(p => p.id !== postId);
        writeDB(db);
        console.log("Post deleted successfully from database.");

        res.status(200).json({ message: 'Post deleted successfully.' });

    } catch (error) {
        console.error("--- UNCAUGHT ERROR IN DELETE ENDPOINT ---");
        console.error(error); // This will print the full error and its stack trace
        res.status(500).json({ message: 'Server error while deleting post.' });
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
    const newProject = { id: Date.now(), userId: req.userId, name: req.body.name, todos: [], materials: [] };
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
        // --- EDIT: ADDED SAFETY CHECK ---
        if (!db.projects[projectIndex].todos) {
            db.projects[projectIndex].todos = [];
        }
        const newTodo = { id: Date.now(), text: text, completed: false };
        db.projects[projectIndex].todos.push(newTodo);
        writeDB(db);
        res.status(200).json(db.projects[projectIndex]);
    } else {
        res.status(404).json({ error: 'Project not found.' });
    }
});
app.put('/api/projects/:projectId/todos/:todoId', protect, (req, res) => {
    const { projectId, todoId } = req.params;
    const db = readDB();
    const projectIndex = db.projects.findIndex(p => p.id === parseInt(projectId) && p.userId === req.userId);
    if (projectIndex !== -1 && db.projects[projectIndex].todos) {
        const todoIndex = db.projects[projectIndex].todos.findIndex(t => t.id === parseInt(todoId));
        if (todoIndex !== -1) {
            db.projects[projectIndex].todos[todoIndex].completed = !db.projects[projectIndex].todos[todoIndex].completed;
            writeDB(db);
            return res.status(200).json(db.projects[projectIndex]);
        }
    }
    res.status(404).json({ message: "Project or To-Do not found." });
});
app.post('/api/projects/:id/materials', protect, (req, res) => {
    const projectId = parseInt(req.params.id);
    const { name, quantity, cost } = req.body;
    let db = readDB(); // Use let to allow modification
    const projectIndex = db.projects.findIndex(p => p.id === projectId && p.userId === req.userId);
    if (projectIndex !== -1) {
        // --- EDIT: ADDED SAFETY CHECK ---
        if (!db.projects[projectIndex].materials) {
            db.projects[projectIndex].materials = [];
        }
        const newMaterial = { id: Date.now(), name, quantity: quantity || '', cost: parseFloat(cost) || 0 };
        db.projects[projectIndex].materials.push(newMaterial);
        writeDB(db);
        res.status(200).json(db.projects[projectIndex]);
    } else {
        res.status(404).json({ error: 'Project not found.' });
    }
});

// --- EDIT: THIS ENTIRE ENDPOINT HAS BEEN REWRITTEN FOR CONVERSATIONAL MEMORY ---
app.post('/api/chat', protect, async (req, res) => {
    const { history, prompt, context } = req.body;

    // Safety check the context
    const safeContext = {
        todos: context?.todos || [],
        materials: context?.materials || []
    };

    // Define the AI's personality and rules
    const systemInstruction = `
        You are "CAMA," a methodical DIY project planner.
        Your primary goal is to break down a user's request into actionable plans.
        You MUST ALWAYS provide your response as a single, clean JSON object with no markdown.

        The "questions" array is the most important part of your response. It must contain 3-4 internal research queries or sub-problems that YOU, the AI, need to solve to give a more detailed and complete answer.
        These questions MUST NOT be directed at the user. They are for your own internal thought process. Think of them as search queries you would use to find more information.
        
        For example, if the user asks "how do I build a deck?", a GOOD question for this array is "Determine local building code for deck footing depth". A BAD question would be "What kind of wood do you want to use?".

        The JSON object must have these exact keys:
        - "summary": A single, concise sentence summarizing the answer.
        - "materials": An array of strings, listing any NEW tools and materials needed.
        - "steps": An array of strings, listing the next core action steps.
        - "questions": An array of your 3-4 internal research queries as described above.
        When answering, ALWAYS consider the user's current project state:
        - To-Do List: ${JSON.stringify(safeContext.todos)}
        - Materials on Hand: ${JSON.stringify(safeContext.materials)}
    `;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", // Correct model name
            systemInstruction: systemInstruction,
        });

        // Sanitize the history to ensure AI responses are strings, not objects
        const sanitizedHistory = (history || []).map(entry => {
            if (entry.role === 'user') return entry;
            if (entry.role === 'model') {
                if (typeof entry.parts[0].text === 'object') {
                    return { role: 'model', parts: [{ text: JSON.stringify(entry.parts[0].text) }] };
                }
            }
            return entry;
        });

        // Start the chat with the sanitized history
        const chat = model.startChat({ history: sanitizedHistory });
        const result = await chat.sendMessage(prompt);
        let textResponse = result.response.text();
        
        // Robustly clean the response to remove markdown and get pure JSON
        const startIndex = textResponse.indexOf('{');
        const endIndex = textResponse.lastIndexOf('}');
        if (startIndex === -1 || endIndex === -1) {
            throw new Error("AI response did not contain a valid JSON object.");
        }
        const jsonString = textResponse.substring(startIndex, endIndex + 1);
        const jsonResponse = JSON.parse(jsonString);

        res.json(jsonResponse);

    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ error: 'Failed to get a structured response from AI.' });
    }
});

app.delete('/api/projects/:id', protect, (req, res) => {
    const projectId = parseInt(req.params.id);
    let db = readDB();
    const initialLength = db.projects.length;
    const updatedProjects = db.projects.filter(
        p => !(p.id === projectId && p.userId === req.userId)
    );
    if (updatedProjects.length === initialLength) {
        return res.status(404).json({ message: "Project not found or you do not have permission to delete it." });
    }
    db.projects = updatedProjects;
    writeDB(db);
    res.status(200).json({ message: "Project deleted successfully." });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
