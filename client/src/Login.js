// client/src/Login.js

import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'aol.com', 'icloud.com', 'hotmail.com'];

function Login({ onLoginSuccess }) {
    const [isLoginActive, setIsLoginActive] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const validateEmail = (emailToTest) => {
        if (!emailRegex.test(emailToTest)) {
            setError("Please enter a valid email address.");
            return false;
        }
        const domain = emailToTest.split('@')[1].toLowerCase();
        if (!allowedDomains.includes(domain)) {
            setError(`Sorry, only emails from standard providers are allowed.`);
            return false;
        }
        return true;
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateEmail(email)) return;
        try {
            const response = await axios.post(`${API_URL}/api/signup`, { name, email, password });
            alert(response.data.message);
            setIsLoginActive(true);
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message);
            } else {
                setError("Cannot connect to the server. Please try again later.");
            }
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateEmail(email)) return;
        try {
            const response = await axios.post(`${API_URL}/api/login`, { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                onLoginSuccess();
            }
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message);
            } else {
                setError("Cannot connect to the server. Please try again later.");
            }
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