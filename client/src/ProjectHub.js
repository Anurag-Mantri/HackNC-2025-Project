// client/src/ProjectHub.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProjectHub.css'; // We will continue to use our beautiful stylesheet

const API_URL = 'http://localhost:3001';

// --- NEW: A helper function to create the authorization headers ---
// This function reads the token from browser storage and prepares it for API calls.
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

function ProjectHub() {
    // All state management remains the same
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [newTodoText, setNewTodoText] = useState('');

    // This useEffect will run once when the component loads to get the user's projects
    useEffect(() => {
        fetchProjects();
    }, []);

    // --- UPDATED: All API functions now use getAuthHeaders() ---

    const fetchProjects = async () => {
        try {
            // We now send the token to prove who we are
            const response = await axios.get(`${API_URL}/api/projects`, getAuthHeaders());
            setProjects(response.data);
        } catch (error) {
            console.error("Failed to fetch projects (check if logged in):", error);
            // In a real app, you might log the user out here if the token is invalid
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName) return;
        try {
            await axios.post(`${API_URL}/api/projects`, { name: newProjectName }, getAuthHeaders());
            setNewProjectName('');
            fetchProjects(); // Refresh the list with the new project
        } catch (error) {
            console.error("Failed to create project:", error);
        }
    };

    const handleAddTodo = async () => {
        if (!newTodoText || !selectedProject) return;
        
        // Optimistic UI update for a smoother experience
        const updatedSelectedProject = { ...selectedProject, todos: [...selectedProject.todos, newTodoText] };
        setSelectedProject(updatedSelectedProject);

        try {
            await axios.post(`${API_URL}/api/projects/${selectedProject.id}/todos`, { text: newTodoText }, getAuthHeaders());
            setNewTodoText('');
            fetchProjects(); // Re-sync with the server to be safe
        } catch (error) {
            console.error("Failed to add todo:", error);
            // Optionally revert the optimistic update on failure
            fetchProjects();
        }
    };

    const handleAskAI = async () => {
        if (!prompt || !selectedProject) return;
        setLoading(true);
        setAiResponse('');
        const enhancedPrompt = `For my project "${selectedProject.name}", I need help with the following: ${prompt}.`;
        
        try {
            const response = await axios.post(`${API_URL}/api/chat`, { prompt: enhancedPrompt }, getAuthHeaders());
            setAiResponse(response.data.response);
        } catch (error) {
            console.error("AI chat failed:", error);
            setAiResponse("Sorry, something went wrong while contacting the AI.");
        } finally {
            setLoading(false);
        }
    };

    // The JSX (the visual part) is completely unchanged because all the logic changes
    // happened in the functions above. The UI will look and feel the same.
    return (
        <div className="hub-container">
            <h1 className="hub-title">Lowe's Project Hub</h1>
            <div className="main-content">

                {/* --- LEFT COLUMN --- */}
                <div className="left-column">
                    <div className="hub-panel">
                        <h2 className="panel-title">Create New Project</h2>
                        <input
                            type="text"
                            placeholder="Project Name"
                            className="hub-input"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                        />
                        <button className="hub-button" onClick={handleCreateProject}>Create</button>
                    </div>

                    <div className="hub-panel">
                        <h2 className="panel-title">My Projects</h2>
                        <ul className="project-list">
                            {projects.map((project) => (
                                <li
                                    key={project.id}
                                    className={`project-list-item ${selectedProject && selectedProject.id === project.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedProject(project)}
                                >
                                    {project.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="right-column hub-panel">
                    {selectedProject ? (
                        <>
                            <h2 className="panel-title">Project: {selectedProject.name}</h2>

                            <h3 style={{ fontWeight: 500, marginBottom: '10px' }}>Project To-Do List</h3>
                            <ul className="todo-list">
                                {selectedProject.todos.length > 0 ? selectedProject.todos.map((todo, index) => (
                                    <li key={index} className="todo-list-item">{todo}</li>
                                )) : <p style={{ fontSize: '14px', color: '#888' }}>No tasks yet. Add one below!</p>}
                            </ul>

                            <div className="add-todo-box">
                                <input
                                    type="text"
                                    placeholder="New To-Do Item"
                                    className="hub-input"
                                    value={newTodoText}
                                    onChange={(e) => setNewTodoText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                                />
                                <button className="hub-button" onClick={handleAddTodo} style={{ width: 'auto', marginTop: '0' }}>Add</button>
                            </div>

                            <h3 style={{ fontWeight: 500, borderTop: '1px solid #eee', paddingTop: '20px' }}>Ask Maac for Help!</h3>
                            <textarea
                                placeholder="Ask for ideas, steps, or materials..."
                                className="ai-textarea"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                            <button className="hub-button" onClick={handleAskAI} disabled={loading}>
                                {loading ? 'Thinking...' : 'Ask AI'}
                            </button>

                            {aiResponse && (
                                <div className="ai-response-box">
                                    <strong>AI Response:</strong>
                                    <p>{aiResponse}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#888', paddingTop: '100px' }}>
                            <h2>Select a project to get started</h2>
                            <p>Your project details will appear here.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default ProjectHub;