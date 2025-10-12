import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// A simple CSS-in-JS for styling to keep this component self-contained
const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    color: '#333',
  },
  form: {
    background: '#f9f9f9',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    marginBottom: '2rem',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    resize: 'vertical',
  },
  fileInput: {
    marginBottom: '1rem',
    fontSize: '0.9rem',
    display: 'block',
  },
  imagePreview: {
    maxWidth: '100px',
    maxHeight: '100px',
    borderRadius: '4px',
    marginBottom: '1rem',
    objectFit: 'cover',
    display: 'block',
  },
  postImage: {
    maxWidth: '100%',
    borderRadius: '8px',
    marginTop: '1rem',
  },
  button: {
    background: '#007bff',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  error: {
    color: '#d9534f',
    marginTop: '1rem',
  },
  post: {
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    color: '#555',
  },
  postEmail: {
    fontWeight: 'bold',
  },
  postTimestamp: {
    fontSize: '0.8rem',
    color: '#888',
  },
  postContent: {
    lineHeight: '1.6',
  },
  loading: {
    textAlign: 'center',
    fontSize: '1.2rem',
    color: '#777',
  },
  // <-- 2. ADD A STYLE FOR THE DELETE BUTTON
  deleteButton: {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    marginLeft: '1rem', // Add some space
  },
};

function CommunityTab() {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

// <-- 3. GET THE CURRENT USER'S ID FROM THE TOKEN
let currentUserId = null;
const token = localStorage.getItem('token');
if (token) {
  try {
    const decodedToken = jwtDecode(token);
    currentUserId = decodedToken.id;
  } catch (e) {
    console.error("Invalid or expired token", e);
  }
}

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError('Failed to load posts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);
      // Create a temporary local URL for the image preview
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to create a post.');
      return;
    }

    if (!newPostContent.trim()) {
      setError('Post content cannot be empty.');
      return;
    }

    // Use FormData to package the text and file for sending
    const formData = new FormData();
    formData.append('content', newPostContent);
    if (postImage) {
      formData.append('image', postImage);
    }

    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setNewPostContent('');
        setPostImage(null);
        setPreviewUrl(null);
        fetchPosts(); // Refresh posts to show the new one
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'An error occurred while posting.');
      }
    } catch (err) {
      setError('Could not connect to the server. Please check your connection.');
    }
  };

   // <-- 4. CREATE THE DELETE POST HANDLER
   const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to permanently delete this post?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchPosts(); // Refresh the posts list after deletion
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete post.');
      }
    } catch (err) {
      setError('Could not connect to the server.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Community Hub</h2>

      {/* Post Creation Form */}
      <div style={styles.form}>
        <form onSubmit={handlePostSubmit}>
          <textarea
            style={styles.textarea}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share your thoughts with the community..."
            rows="4"
          />
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.fileInput}
          />

          {/* Show a preview of the selected image */}
          {previewUrl && <img src={previewUrl} alt="Preview" style={styles.imagePreview} />}
          
          <button type="submit" style={styles.button}>
            Publish Post
          </button>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '2rem 0' }} />

      <h3>Recent Posts</h3>
      {isLoading ? (
        <p style={styles.loading}>Loading posts...</p>
      ) : posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.id} style={styles.post}>
            <div style={styles.postHeader}>
              <span style={styles.postEmail}>{post.userEmail}</span>
              <span style={styles.postTimestamp}>
                {new Date(post.timestamp).toLocaleString()}
              </span>
            </div>
            {/* <-- 5. CONDITIONALLY RENDER THE DELETE BUTTON */}
            {currentUserId === post.userId && (
                <button
                  onClick={() => handleDeletePost(post.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              )}
            <p style={styles.postContent}>{post.content}</p>
            
            {post.imageUrl && (
              <img
                src={`${API_URL}${post.imageUrl}`}
                alt="Post content"
                style={styles.postImage}
              />
            )}
          </div>
        ))
      ) : (
        <p>No posts yet. Be the first to share something!</p>
      )}
    </div>
  );
}

export default CommunityTab;

