// client/src/App.js

import React, { useState } from 'react';
import Login from './Login'; // Import our new Login component
import ProjectHub from './ProjectHub'; // Import our new ProjectHub component

function App() {
    // This state will control whether the user is logged in or not.
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // This function will be passed to the Login component.
    // It will be called on a successful login to update our state.
    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    return (
        <div>
            {isLoggedIn ? (
                // If the user IS logged in, show the ProjectHub
                <ProjectHub />
            ) : (
                // If the user is NOT logged in, show the Login component
                <Login onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
}

export default App;