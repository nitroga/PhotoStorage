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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderName = req.params.folderName || '';
        const dest = path.join(__dirname, 'storage', folderName);

        fs.mkdirSync(dest, { recursive: true });

        cb(null, dest);
    },
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
app.use(express.json());

app.post('/upload', upload.array('photos', 10), (req, res) => {
    const uploadPath = path.join(uploadDir, ''); // Root folder

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    res.redirect('/');
});

app.post('/upload/:folderName', upload.array('photos', 10), (req, res) => {
    const folderName = req.params.folderName;
    const uploadPath = path.join(uploadDir, folderName);

    if (!fs.existsSync(uploadPath)) {
        return res.status(400).send('Folder does not exist');
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    res.redirect('/');
});

app.get('/photos', (req, res) => {
    const folder = req.query.folder || '';
    const folderPath = path.join(uploadDir, folder);

    if (folder.includes('..') || folder.includes('/')) {
        return res.status(400).send('Invalid folder');
    }

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to read folder');
        }

        const imageFiles = files.filter(file => {
            return /\.(jpg|jpeg|png|gif)$/i.test(file);
        });

        res.json(imageFiles);
    });
});

app.delete('/photos/:filename', (req, res) => {
    const folder = req.query.folder || '';
    const filename = req.params.filename;

    if (folder.includes('..') || folder.includes('/') || filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: 'Invalid filename or folder' });
    }

    const filepath = path.join(uploadDir, folder, filename);

    fs.unlink(filepath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
            return res.status(500).json({ error: 'Failed to delete file' });
        }
        res.json({ message: 'File deleted successfully' });
    });
});

app.get('/folders', (req, res) => {
    fs.readdir(uploadDir, { withFileTypes: true }, (err, files) => {
        if (err) return res.status(500).send('Unable to read folders');
        const folders = files
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        res.json(folders);
    });
});

app.post('/folders', (req, res) => {
    const folderName = req.body.name;
    if (!folderName || folderName.includes('..') || folderName.includes('/')) {
        return res.status(400).send('Invalid folder name');
    }
    const newFolderPath = path.join(uploadDir, folderName);
    if (fs.existsSync(newFolderPath)) {
        return res.status(409).send('Folder already exists');
    }
    fs.mkdirSync(newFolderPath);
    res.status(201).send('Folder created');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Upload directory: ${uploadDir}`);
});