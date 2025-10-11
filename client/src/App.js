import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, TextField, Button, Typography, List, ListItem, ListItemText, Paper, Box, CircularProgress } from '@mui/material';

const API_URL = 'http://localhost:3001';

function App() {
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [loading, setLoading] = useState(false);
    
    // --- NEW STATE for the to-do input ---
    const [newTodoText, setNewTodoText] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/projects`);
            setProjects(response.data);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName) return;
        await axios.post(`${API_URL}/api/projects`, { name: newProjectName });
        setNewProjectName('');
        fetchProjects();
    };

    const handleAskAI = async () => {
        if (!prompt || !selectedProject) return;
        setLoading(true);
        setAiResponse('');

        const enhancedPrompt = `For my project "${selectedProject.name}", I need help with the following: ${prompt}. Please provide a clear, step-by-step answer or a list of materials from a store like Lowe's.`;
        
        try {
            const response = await axios.post(`${API_URL}/api/chat`, { prompt: enhancedPrompt });
            setAiResponse(response.data.response);
        } catch (error) {
            console.error("AI chat failed:", error);
            setAiResponse("Sorry, something went wrong while contacting the AI.");
        } finally {
            setLoading(false);
        }
    };
    
    // --- NEW HANDLER for adding a to-do item ---
    const handleAddTodo = async () => {
        if (!newTodoText || !selectedProject) return;

        // Optimistically update the UI first for a better user experience
        const updatedSelectedProject = {
            ...selectedProject,
            todos: [...selectedProject.todos, newTodoText]
        };
        setSelectedProject(updatedSelectedProject);

        // Then send the request to the server
        await axios.post(`${API_URL}/api/projects/${selectedProject.id}/todos`, { text: newTodoText });
        
        setNewTodoText(''); // Clear the input box
        
        // Fetch projects again to ensure client and server are in sync
        fetchProjects();
    };


    return (
        <Container style={{ marginTop: '20px' }}>
            <Typography variant="h3" gutterBottom align="center">Lowe's Project Hub</Typography>

            <Paper elevation={3} style={{ padding: '16px', marginBottom: '24px' }}>
                <Typography variant="h5">Create New Project</Typography>
                <TextField
                    label="Project Name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                <Button variant="contained" onClick={handleCreateProject}>Create</Button>
            </Paper>

            <Box display="flex" gap={3}>
                <Paper elevation={3} style={{ flex: 1, padding: '16px' }}>
                    <Typography variant="h5">My Projects</Typography>
                    <List>
                        {projects.map((project) => (
                            <ListItem button key={project.id} onClick={() => setSelectedProject(project)} selected={selectedProject && selectedProject.id === project.id}>
                                <ListItemText primary={project.name} />
                            </ListItem>
                        ))}
                    </List>
                </Paper>

                <Paper elevation={3} style={{ flex: 2, padding: '16px' }}>
                    {selectedProject ? (
                        <>
                            <Typography variant="h5" gutterBottom>Project: {selectedProject.name}</Typography>
                            
                            <Typography variant="h6">Project To-Do List</Typography>
                            <List dense>
                                {selectedProject.todos.length > 0 ? selectedProject.todos.map((todo, index) => (
                                    <ListItem key={index}>
                                        <ListItemText primary={`• ${todo}`} />
                                    </ListItem>
                                )) : <Typography variant="body2" color="textSecondary">No tasks yet. Add one below!</Typography>}
                            </List>

                            {/* --- NEW UI for adding a to-do --- */}
                            <Box display="flex" mt={1} mb={3}>
                                <TextField
                                    label="New To-Do Item"
                                    value={newTodoText}
                                    onChange={(e) => setNewTodoText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()} // Allow pressing Enter
                                    fullWidth
                                    size="small"
                                />
                                <Button variant="contained" onClick={handleAddTodo} style={{ marginLeft: '8px' }}>Add</Button>
                            </Box>
                            
                            <Typography variant="h6">Ask Maac for Help!</Typography>
                            <TextField
                                label="Ask for ideas, steps, or materials..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
                                margin="normal"
                            />
                            <Button variant="contained" onClick={handleAskAI} disabled={loading}>
                                {loading ? <CircularProgress size={24} /> : 'Ask AI'}
                            </Button>

                            {aiResponse && (
                                <Box mt={2} p={2} border={1} borderColor="grey.300" borderRadius={1} style={{ backgroundColor: '#f7f7f7' }}>
                                    <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>AI Response:</Typography>
                                    <Typography style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{aiResponse}</Typography>
                                </Box>
                            )}
                        </>
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                            <Typography variant="h6" color="textSecondary">Select a project to get started</Typography>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}

export default App;