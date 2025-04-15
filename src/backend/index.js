const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, '../../storage');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderName = req.params.folderName || '';
        const dest = path.join(uploadDir, folderName);

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

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/storage', express.static(path.join(__dirname, '..', '..', 'storage')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.post('/upload', upload.any(), (req, res) => {
    const uploadPath = path.join(uploadDir, ''); // Root folder

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    res.redirect('/');
});

app.post('/upload/:folderName', upload.any(), (req, res) => {
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

app.delete('/folders/:name', (req, res) => {
    const folderName = req.params.name;
    if (!folderName || folderName.includes('..') || folderName.includes('/')) {
        return res.status(400).send('Invalid folder name');
    }
    const folderPath = path.join(uploadDir, folderName);
    if (!fs.existsSync(folderPath)) {
        return res.status(404).send('Folder does not exist');
    }
    fs.rm(folderPath, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error("Error deleting folder:", err);
            return res.status(500).send('Failed to delete folder');
        }
        res.status(200).send('Folder deleted');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Upload directory: ${uploadDir}`);
});