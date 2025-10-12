// client/src/ProjectHub.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProjectHub.css';

const API_URL = 'http://localhost:3001';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

function ProjectHub({ onLogout }) {
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [aiResponse, setAiResponse] = useState(null); // Will hold the JSON object from the AI
    const [loading, setLoading] = useState(false);
    const [newTodoText, setNewTodoText] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/projects`, getAuthHeaders());
            setProjects(response.data);
        } catch (error) {
            console.error("Failed to fetch projects (check if logged in):", error);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName) return;
        try {
            await axios.post(`${API_URL}/api/projects`, { name: newProjectName }, getAuthHeaders());
            setNewProjectName('');
            fetchProjects();
        } catch (error) {
            console.error("Failed to create project:", error);
        }
    };

    const handleAddTodo = async () => {
        if (!newTodoText || !selectedProject) return;
        const updatedSelectedProject = { ...selectedProject, todos: [...selectedProject.todos, newTodoText] };
        setSelectedProject(updatedSelectedProject);
        try {
            await axios.post(`${API_URL}/api/projects/${selectedProject.id}/todos`, { text: newTodoText }, getAuthHeaders());
            setNewTodoText('');
            fetchProjects();
        } catch (error) {
            console.error("Failed to add todo:", error);
            fetchProjects(); // Revert optimistic update on failure
        }
    };

    const handleAskAI = async () => {
        if (!prompt || !selectedProject) return;
        setLoading(true);
        setAiResponse(null); // Clear previous response
        const enhancedPrompt = `For my project "${selectedProject.name}", I need help with the following: ${prompt}.`;
        
        try {
            const response = await axios.post(`${API_URL}/api/chat`, { prompt: enhancedPrompt }, getAuthHeaders());
            setAiResponse(response.data); // Store the entire JSON object
        } catch (error) {
            console.error("AI chat failed:", error);
            setAiResponse({ summary: "Sorry, something went wrong while contacting the AI.", materials: [], steps: [], questions: [] });
        } finally {
            setLoading(false);
        }
    };
    
    const handleFollowUpQuestion = (question) => {
        setPrompt(question);
        // This is a simple version. For an even better UX, you could automatically
        // call handleAskAI() right after setting the prompt.
    };

    return (
        <div className="hub-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 className="hub-title" style={{ marginBottom: '0' }}>Lowe's Project Hub</h1>
                <button 
                    className="hub-button" 
                    onClick={onLogout} 
                    style={{ width: 'auto', backgroundColor: '#d32f2f' }}
                >
                    Logout
                </button>
            </div>

            <div className="main-content">
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

                            {/* --- NEW, STRUCTURED AI RESPONSE RENDERING --- */}
                            {aiResponse && (
                                <div className="ai-response-box">
                                    <strong>AI Response:</strong>
                                    <p style={{fontStyle: 'italic', margin: '10px 0'}}>{aiResponse.summary}</p>
                                    
                                    {aiResponse.materials && aiResponse.materials.length > 0 && (
                                        <div className="ai-response-section">
                                            <h4>Materials & Tools</h4>
                                            <ul>{aiResponse.materials.map((item, i) => <li key={i}>{item}</li>)}</ul>
                                        </div>
                                    )}

                                    {aiResponse.steps && aiResponse.steps.length > 0 && (
                                        <div className="ai-response-section">
                                            <h4>Next Steps</h4>
                                            <ul>{aiResponse.steps.map((step, i) => <li key={i}>{step}</li>)}</ul>
                                        </div>
                                    )}

                                    {aiResponse.questions && aiResponse.questions.length > 0 && (
                                        <div className="ai-response-section ai-follow-up-questions">
                                            <h4>Next Questions</h4>
                                            {aiResponse.questions.map((q, i) => (
                                                <button key={i} onClick={() => handleFollowUpQuestion(q)}>{q}</button>
                                            ))}
                                        </div>
                                    )}
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