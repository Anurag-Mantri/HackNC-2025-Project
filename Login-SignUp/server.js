// Import the Express module
const express = require('express');
const path = require('path');
  
// Create an Express application
const app = express();
const PORT = 3000;
  
// --- Middleware ---
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
  
  
// --- In-Memory User Store (for MVP purposes) ---
// In a real application, you would use a database (e.g., MongoDB, PostgreSQL)
const users = [];
  
  
  // --- Routes ---
  
  // Sign-up Route
app.post('/signup', (req, res) => {
    const { email, password } = req.body;
  
      // Basic validation
    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }
  
      // Check if user already exists
    const userExists = users.find(user => user.email === email);
    if (userExists) {
        return res.status(409).send('User with this email already exists');
    }
  
      // In a real app, you would hash the password here!
    const newUser = { email, password };
    users.push(newUser);
  
    console.log('Users:', users); // For debugging
  
      // Redirect to the login page after successful sign-up
    res.redirect('/login.html');
});
  
  
  // Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;
  
      // Basic validation
    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }
  
      // Find the user
    const user = users.find(user => user.email === email);
  
      // Check if user exists and password matches
      // In a real app, you would compare a hashed password!
    if (!user || user.password !== password) {
        return res.status(401).send('Invalid email or password');
    }
  
      // For an MVP, we'll just redirect to a "dashboard" page
      // In a real app, you would create a session or JWT here
    res.redirect('/dashboard.html');
});
  
  
  // --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});