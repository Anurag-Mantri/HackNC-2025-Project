// client/src/Login.js

import React, { useState } from 'react';
import './Login.css'; // Import the styles we just created

function Login({ onLoginSuccess }) {
    const [isLoginActive, setIsLoginActive] = useState(true);

    // This function will be called when the user clicks the "Login" button.
    // In a real app, you'd check a username/password here.
    // For the hackathon, we just call the success function immediately.
    const handleLogin = (e) => {
        e.preventDefault(); // Prevent the form from refreshing the page
        onLoginSuccess();
    };

    return (
        <div className="login-container">
            <div className={`container ${isLoginActive ? '' : 'active'}`}>
                <div className="form-container sign-up">
                    <form>
                        <h1>Create Account</h1>
                        <div className="social-icons">
                            {/* You can add social icons here if you want */}
                        </div>
                        <span>or use your email for registration</span>
                        <input type="text" placeholder="Name" />
                        <input type="email" placeholder="Email" />
                        <input type="password" placeholder="Password" />
                        <button>Sign Up</button>
                    </form>
                </div>
                <div className="form-container sign-in">
                    <form onSubmit={handleLogin}>
                        <h1>Sign In</h1>
                        <div className="social-icons">
                           {/* You can add social icons here if you want */}
                        </div>
                        <span>or use your email password</span>
                        <input type="email" placeholder="Email" />
                        <input type="password" placeholder="Password" />
                        <a href="#">Forget Your Password?</a>
                        <button type="submit">Sign In</button>
                    </form>
                </div>
                <div className="toggle-container">
                    <div className="toggle">
                        <div className="toggle-panel toggle-left">
                            <h1>Welcome Back!</h1>
                            <p>Enter your personal details to use all of site features</p>
                            <button className="hidden" onClick={() => setIsLoginActive(true)}>Sign In</button>
                        </div>
                        <div className="toggle-panel toggle-right">
                            <h1>Hello, Friend!</h1>
                            <p>Register with your personal details to use all of site features</p>
                            <button className="hidden" onClick={() => setIsLoginActive(false)}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;