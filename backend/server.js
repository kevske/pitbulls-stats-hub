const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'kevske';
const REPO_NAME = 'pitbulls-stats-hub';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

// Helper function to make GitHub API requests
async function githubRequest(path, options = {}) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/${path}`;
  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3+json',
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Routes

// Read JSON file
app.get('/api/github/:path(*)', async (req, res) => {
  try {
    const { path } = req.params;
    const data = await githubRequest(`contents/${path}`);
    
    if (data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      res.json(JSON.parse(content));
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Write JSON file
app.put('/api/github/:path(*)', async (req, res) => {
  try {
    const { path } = req.params;
    const { data, message } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    // Get current file SHA if it exists
    let sha;
    try {
      const existingFile = await githubRequest(`contents/${path}`);
      sha = existingFile.sha;
    } catch (error) {
      // File doesn't exist, that's okay
    }

    const content = JSON.stringify(data, null, 2);
    const encodedContent = Buffer.from(content).toString('base64');

    const result = await githubRequest(`contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: message || `Update ${path}`,
        content: encodedContent,
        sha: sha
      })
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete file
app.delete('/api/github/:path(*)', async (req, res) => {
  try {
    const { path } = req.params;
    const { message } = req.query;
    
    // Get current file SHA
    const existingFile = await githubRequest(`contents/${path}`);
    
    const result = await githubRequest(`contents/${path}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message: message || `Delete ${path}`,
        sha: existingFile.sha
      })
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// List JSON files in directory
app.get('/api/github/list/:path(*)', async (req, res) => {
  try {
    const { path } = req.params;
    const data = await githubRequest(`contents/${path || ''}`);
    
    const jsonFiles = data
      .filter(file => file.type === 'file' && file.name.endsWith('.json'))
      .map(file => ({
        name: file.name,
        path: file.path,
        size: file.size,
        lastModified: file.modified_at
      }));

    res.json(jsonFiles);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
