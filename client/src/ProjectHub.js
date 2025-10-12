// client/src/ProjectHub.js

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CommunityTab from './components/CommunityTab';
import './ProjectHub.css';

const API_URL = 'http://localhost:3001';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

// --- No changes to the component's logic, state, or functions ---
function ProjectHub({ onLogout }) {
    const [activeView, setActiveView] = useState('projects');
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [newTodoText, setNewTodoText] = useState('');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [materialName, setMaterialName] = useState('');
    const [materialQty, setMaterialQty] = useState('');
    const [materialCost, setMaterialCost] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const chatHistoryRef = useRef(null);

    useEffect(() => {
        if (activeView === 'projects') {
            fetchProjects();
        }
    }, [activeView]);

    useEffect(() => {
        setConversationHistory([]);
        setPrompt('');
    }, [selectedProject]);
    
    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = 0;
        }
    }, [conversationHistory]);

    const fetchProjects = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/projects`, getAuthHeaders());
            setProjects(response.data);
            if (selectedProject) {
                const updatedSelectedProject = response.data.find(p => p.id === selectedProject.id);
                setSelectedProject(updatedSelectedProject || null);
            }
        } catch (error) { console.error("Failed to fetch projects:", error); }
    };
    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        try {
            await axios.post(`${API_URL}/api/projects`, { name: newProjectName }, getAuthHeaders());
            setNewProjectName('');
            fetchProjects();
        } catch (error) { console.error("Failed to create project:", error); }
    };
    const handleAddTodo = async () => {
        if (!newTodoText.trim() || !selectedProject) return;
        try {
            await axios.post(`${API_URL}/api/projects/${selectedProject.id}/todos`, { text: newTodoText }, getAuthHeaders());
            setNewTodoText('');
            fetchProjects();
        } catch (error) { console.error("Failed to add todo:", error); }
    };
    const handleToggleTodo = async (projectId, todoId) => {
        try {
            await axios.put(`${API_URL}/api/projects/${projectId}/todos/${todoId}`, {}, getAuthHeaders());
            fetchProjects();
        } catch (error) { console.error("Failed to toggle todo:", error); }
    };
    const handleAddMaterial = async () => {
        if (!selectedProject) return alert("Please select a project first.");
        if (!materialName.trim()) return alert("Please enter a material name.");
        const materialData = { name: materialName, quantity: materialQty, cost: materialCost };
        try {
            await axios.post(`${API_URL}/api/projects/${selectedProject.id}/materials`, materialData, getAuthHeaders());
            setMaterialName(''); setMaterialQty(''); setMaterialCost('');
            fetchProjects();
        } catch (error) { console.error("Failed to add material:", error); alert("Could not add material."); }
    };
    const handleDeleteProject = async (projectIdToDelete) => {
        if (!window.confirm("Are you sure you want to permanently delete this project?")) return;
        try {
            await axios.delete(`${API_URL}/api/projects/${projectIdToDelete}`, getAuthHeaders());
            fetchProjects();
        } catch (error) { console.error("Failed to delete project:", error); alert("Could not delete project."); }
    };
    const handleAskAI = async (currentPrompt) => {
        const promptToUse = currentPrompt || prompt;
        if (!promptToUse.trim() || !selectedProject) return;
        setLoading(true);
        const newUserMessage = { role: 'user', parts: [{ text: promptToUse }] };
        const currentHistory = [...conversationHistory, newUserMessage];
        setConversationHistory(currentHistory);
        setPrompt('');
        const projectContext = { todos: selectedProject.todos, materials: selectedProject.materials };
        try {
            const response = await axios.post(`${API_URL}/api/chat`, { history: currentHistory, prompt: promptToUse, context: projectContext }, getAuthHeaders());
            const newModelMessage = { role: 'model', parts: [{ text: response.data }] };
            setConversationHistory([...currentHistory, newModelMessage]);
        } catch (error) {
            console.error("AI chat failed:", error);
            const errorMessage = { role: 'model', parts: [{ text: { summary: "Sorry, I encountered an error. Please try again." } }] };
            setConversationHistory([...currentHistory, errorMessage]);
        } finally {
            setLoading(false);
        }
    };
    const handleFollowUpQuestion = (question) => {
        handleAskAI(question);
    };

    const totalCost = selectedProject?.materials?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;

    // --- MODIFIED JSX RETURN BLOCK ---
    return (
        <div className="hub-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 className="hub-title" style={{ marginBottom: '0', textAlign: 'left' }}>Lowe's Project Hub</h1>
                <div>
                    <button className="hub-button" onClick={() => setActiveView('projects')} style={{ width: 'auto', marginRight: '10px' }}>My Projects</button>
                    <button className="hub-button" onClick={() => setActiveView('community')} style={{ width: 'auto', marginRight: '10px' }}>Community</button>
                    <button className="hub-button" onClick={onLogout} style={{ width: 'auto', backgroundColor: '#d32f2f' }}>Logout</button>
                </div>
            </div>

            <div className="main-content">
                {activeView === 'community' ? (
                    // If view is 'community', render the CommunityTab
                    <div style={{ width: '100%' }}>
                        <CommunityTab />
                    </div>
                ) : (
                    // Otherwise, render the projects view using a Fragment
                    <>
                        <div className="left-column">
                            <div className="hub-panel">
                                <h2 className="panel-title">Create New Project</h2>
                                <input type="text" placeholder="Project Name" className="hub-input" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
                                <button className="hub-button" onClick={handleCreateProject}>Create</button>
                            </div>
                            <div className="hub-panel">
                                <h2 className="panel-title">My Projects</h2>
                                <ul className="project-list">
                                    {projects.map((project) => (
                                        <li key={project.id} className={`project-list-item ${selectedProject?.id === project.id ? 'selected' : ''}`} onClick={() => setSelectedProject(project)}>
                                            <span>{project.name}</span>
                                            <button className="delete-project-btn" onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}>&times;</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="right-column hub-panel">
                            {selectedProject ? (
                                <>
                                    <h2 className="panel-title">Project: {selectedProject.name}</h2>
                                    <h3 style={{ fontWeight: 500, marginBottom: '10px' }}>Project Checklist</h3>
                                    <ul className="todo-list">
                                        {selectedProject.todos?.map((todo) => (
                                            <li key={todo.id} className={`todo-checklist-item ${todo.completed ? 'completed' : ''}`} onClick={() => handleToggleTodo(selectedProject.id, todo.id)}>
                                                <div className="todo-checkbox"><div className="todo-checkbox-tick" /></div>
                                                <span>{todo.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="add-todo-box">
                                        <input type="text" placeholder="Add new checklist item" className="hub-input" value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()} />
                                        <button className="hub-button" onClick={handleAddTodo} style={{ width: 'auto', marginTop: '0' }}>Add</button>
                                    </div>
                                    <h3 style={{ fontWeight: 500, borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '10px' }}>Materials & Costs</h3>
                                    <table className="materials-table">
                                        <thead>
                                            <tr><th>Material</th><th>Quantity</th><th>Cost ($)</th></tr>
                                        </thead>
                                        <tbody>
                                            {selectedProject.materials?.map(mat => (
                                                <tr key={mat.id}><td>{mat.name}</td><td>{mat.quantity}</td><td>{mat.cost.toFixed(2)}</td></tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr><td><strong>Total Estimated Cost</strong></td><td></td><td><strong>${totalCost.toFixed(2)}</strong></td></tr>
                                        </tfoot>
                                    </table>
                                    <div className="add-material-form">
                                        <input type="text" placeholder="Material Name" className="hub-input" value={materialName} onChange={(e) => setMaterialName(e.target.value)} />
                                        <input type="text" placeholder="Quantity (e.g., 5 pcs)" className="hub-input" value={materialQty} onChange={(e) => setMaterialQty(e.target.value)} />
                                        <input type="number" placeholder="Total Cost" className="hub-input" value={materialCost} onChange={(e) => setMaterialCost(e.target.value)} />
                                        <button className="hub-button" onClick={handleAddMaterial} style={{ width: 'auto', marginTop: '0', padding: '12px 20px' }}>Add</button>
                                    </div>

                                    <h3 style={{ fontWeight: 500, borderTop: '1px solid #eee', paddingTop: '20px' }}>Ask CAMA for Help!</h3>
                                    
                                    <textarea placeholder="Ask a question about your project..." className="ai-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAskAI())} />
                                    <button className="hub-button" onClick={() => handleAskAI()} disabled={loading}>{loading ? 'Thinking...' : 'Ask AI'}</button>
                                    
                                    <div className="conversation-history" ref={chatHistoryRef}>
                                        {[...conversationHistory].reverse().map((entry, index) => (
                                            <div key={index} className="chat-entry">
                                                {entry.role === 'model' && (
                                                    <div className="chat-entry-model">
                                                        <strong>Maac:</strong>
                                                        <p style={{fontStyle: 'italic', margin: '10px 0'}}>{entry.parts[0].text.summary}</p>
                                                        {entry.parts[0].text.materials?.length > 0 && (<div className="ai-response-section"><h4>New Materials Needed</h4><ul>{entry.parts[0].text.materials.map((item, i) => <li key={i}>- {item}</li>)}</ul></div>)}
                                                        {entry.parts[0].text.steps?.length > 0 && (<div className="ai-response-section"><h4>Next Steps</h4><ul>{entry.parts[0].text.steps.map((step, i) => <li key={i}>- {step}</li>)}</ul></div>)}
                                                        {entry.parts[0].text.questions?.length > 0 && (<div className="ai-response-section ai-follow-up-questions"><h4>Next Questions</h4>{entry.parts[0].text.questions.map((q, i) => (<button key={i} onClick={() => handleFollowUpQuestion(q)}>{q}</button>))}</div>)}
                                                    </div>
                                                )}
                                                {entry.role === 'user' && (
                                                    <div className="chat-entry-user">You: {entry.parts[0].text}</div>
                                                )}
                                            </div>
                                        ))}
                                        {conversationHistory.length === 0 && <p style={{ fontSize: '14px', color: '#888', textAlign: 'center', margin: 'auto' }}>Ask a question to start the conversation...</p>}
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#888', paddingTop: '100px' }}>
                                    <h2>Select a project to get started</h2>
                                    <p>Your project details will appear here.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProjectHub;