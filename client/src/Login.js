// client/src/Login.js

import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const API_URL = 'http://localhost:3001';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Standard email format checker

// --- NEW: Define the list of allowed email domains ---
const allowedDomains = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'hotmail.com'
];

function Login({ onLoginSuccess }) {
    const [isLoginActive, setIsLoginActive] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // --- NEW: State to hold and display error messages on the screen ---
    const [error, setError] = useState('');

    // --- NEW: A reusable validation function ---
    const validateEmail = (emailToTest) => {
        // 1. Check the general format first
        if (!emailRegex.test(emailToTest)) {
            setError("Please enter a valid email address.");
            return false;
        }

        // 2. Extract the domain and check it against our allowed list
        const domain = emailToTest.split('@')[1].toLowerCase(); // .toLowerCase() makes it case-insensitive
        if (!allowedDomains.includes(domain)) {
            setError(`Sorry, only emails from standard providers are allowed.`);
            return false;
        }

        // If both checks pass, the email is valid
        return true;
    };


    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors on a new attempt

        // --- UPDATED: Use the new validation function ---
        if (!validateEmail(email)) {
            return; // Stop if validation fails
        }
        
        try {
            const response = await axios.post(`${API_URL}/api/signup`, { name, email, password });
            alert(response.data.message); // Show success message

            // Clear fields and switch to sign-in panel after successful registration
            setName('');
            setEmail('');
            setPassword('');
            setIsLoginActive(true);

        } catch (err) {
            // Use setError to display server errors (like "user already exists")
            setError(err.response.data.message);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateEmail(email)) return;

        try {
            const response = await axios.post(`${API_URL}/api/login`, { email, password });
            
            // --- NEW: Save the token to localStorage ---
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                onLoginSuccess(); // Switch to the ProjectHub
            }

        } catch (err) {
            setError(err.response.data.message);
        }
    };

    return (
        <div className="login-container">
            <div className={`container ${isLoginActive ? '' : 'active'}`}>
                <div className="form-container sign-up">
                    <form onSubmit={handleSignUp}>
                        <h1>Create Account</h1>
                        <span>or use your email for registration</span>
                        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        
                        {/* --- NEW: Display error messages directly in the form --- */}
                        {error && !isLoginActive && <p style={{color: 'red', fontSize: '12px', marginTop: '5px'}}>{error}</p>}
                        
                        <button type="submit">Sign Up</button>
                    </form>
                </div>
                <div className="form-container sign-in">
                    <form onSubmit={handleLogin}>
                        <h1>Sign In</h1>
                        <span>or use your email password</span>
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        
                        {/* --- NEW: Display error messages directly in the form --- */}
                        {error && isLoginActive && <p style={{color: 'red', fontSize: '12px', marginTop: '5px'}}>{error}</p>}

                        <a href="#">Forget Your Password?</a>
                        <button type="submit">Sign In</button>
                    </form>
                </div>
                <div className="toggle-container">
                    <div className="toggle">
                        <div className="toggle-panel toggle-left">
                            <h1>Welcome Back!</h1>
                            <p>Enter your personal details to use all of site features</p>
                            <button className="hidden" onClick={() => { setIsLoginActive(true); setError(''); }}>Sign In</button>
                        </div>
                        <div className="toggle-panel toggle-right">
                            <h1>Hello, Friend!</h1>
                            <p>Register with your personal details to use all of site features</p>
                            <button className="hidden" onClick={() => { setIsLoginActive(false); setError(''); }}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    
}

export default Login;