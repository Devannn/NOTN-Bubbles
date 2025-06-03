const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// API endpoint to get dashboard stats
app.get('/api/dashboard-stats', (req, res) => {
    const scriptPath = path.join(__dirname, 'dashboard-overview.sh');

    exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error}`);
            return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }

        try {
            const stats = JSON.parse(stdout);
            res.json(stats);
        } catch (err) {
            console.error(`Error parsing script output: ${err}`);
            res.status(500).json({ error: 'Failed to parse dashboard stats' });
        }
    });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 