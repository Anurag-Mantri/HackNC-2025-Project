// client/src/components/HomeTab.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HomeTab.css';

// --- Helper Functions ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

// --- Modal Component (No Changes Here) ---
const SuggestionModal = ({ suggestion, onClose }) => {
    // Check if materials is a valid array, otherwise create an empty array.
    const materialsList = Array.isArray(suggestion.materials) ? suggestion.materials : [];

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <img src={suggestion.imageUrl} alt={suggestion.title} className="modal-image" />
                <h2>{suggestion.title}</h2>
                <p>{suggestion.description}</p>
                <h3>Details</h3>
                <ul>
                    {/* Add fallbacks in case these fields are missing */}
                    <li><strong>Estimated Time:</strong> {suggestion.time || 'N/A'}</li>
                    <li><strong>Estimated Cost:</strong> {suggestion.cost || 'N/A'}</li>
                    <li>
                        <strong>Materials Needed:</strong> 
                        {/* Now we can safely use .join() on our materialsList */}
                        {materialsList.length > 0 ? materialsList.join(', ') : 'Not specified'}
                    </li>
                </ul>
                <button onClick={onClose} className="hub-button modal-close-btn">Close</button>
            </div>
        </div>
    );
};


// --- Main HomeTab Component ---
function HomeTab({ projects }) {
    // State is initialized with EMPTY arrays, not mock data.
    const [suggestions, setSuggestions] = useState([]); 
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                setLoadingSuggestions(true);
                // The API call to your backend
                const response = await axios.get(`${API_URL}/api/project-ideas`, getAuthHeaders());
                setSuggestions(response.data);
            } catch (error) {
                console.error("Failed to fetch project suggestions:", error);
                // If there's an error, suggestions will remain an empty array.
            } finally {
                setLoadingSuggestions(false);
            }
        };

        fetchSuggestions();
    }, []); // Empty array ensures this runs only once.

    const recentProjects = projects.slice(0, 3);

    return (
        <div className="home-tab-container">
            {selectedSuggestion && <SuggestionModal suggestion={selectedSuggestion} onClose={() => setSelectedSuggestion(null)} />}
            
            <div className="home-left-column">
                <h2 className="home-column-title">Recent Activity</h2>
                {recentProjects.length > 0 ? recentProjects.map(project => (
                    <div key={project.id} className="recent-project-card">
                        <h3>{project.name}</h3>
                        <ul>
                            {project.todos
                                .filter(todo => todo.isImportant)
                                .slice(0, 2)
                                .map(todo => <li key={todo.id}>❗ {todo.text} ❗</li>)
                            }
                        </ul>
                    </div>
                )) : <p>No recent projects to show.</p>}
            </div>

            <div className="home-right-column">
                <h2 className="home-column-title">Project Ideas & Inspiration</h2>
                
                {loadingSuggestions ? (
                    <p>Generating new project ideas for you...</p>
                ) : (
                    <div className="suggestions-grid">
                        {suggestions.map(suggestion => (
                            <div key={suggestion.title} className="suggestion-card" onClick={() => setSelectedSuggestion(suggestion)}>
                                <img src={suggestion.imageUrl} alt={suggestion.title} />
                                <div className="suggestion-title">{suggestion.title}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default HomeTab;