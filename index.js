const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'storage');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

app.use(express.static('public'));
app.use('/storage', express.static('storage'));

app.post('/upload', upload.array('photos', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }
    res.redirect('/');
});

app.get('/photos', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading uploads directory');
        }
        const imageFiles = files.filter(file => 
            /\.(jpg|jpeg|png|gif)$/i.test(file)
        );
        res.json(imageFiles);
    });
});

app.delete('/photos/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);
    
    fs.unlink(filepath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
            return res.status(500).json({ error: 'Failed to delete file' });
        }
        res.json({ message: 'File deleted successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Upload directory: ${uploadDir}`);
});