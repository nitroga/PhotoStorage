import fs from 'fs';
import path from 'path';

function sanitize(input) {
    return input.includes('..') || input.includes('/') || input.includes('\\');
}

export async function saveMultipartFiles(req, baseDir, folderName) {
    if (sanitize(folderName)) return { success: false, message: 'Invalid folder name' };

    const destPath = path.join(baseDir, folderName || '');
    fs.mkdirSync(destPath, { recursive: true });

    const parts = req.parts();

    let fileFound = false;
    for await (const part of parts) {
        if (part.file) {
            fileFound = true;
            const savePath = path.join(destPath, Date.now() + '-' + part.filename);
            await pumpStream(part.file, savePath);
        }
    }

    if (!fileFound) return { success: false, message: 'No files uploaded.' };
    return { success: true };
}

export function pumpStream(stream, filepath) {
    return new Promise((resolve, reject) => {
        const write = fs.createWriteStream(filepath);
        stream.pipe(write);
        stream.on('end', resolve);
        stream.on('error', reject);
    });
}

export async function getPhotos(baseDir, folder) {
    if (sanitize(folder)) return { success: false, message: 'Invalid folder' };

    const dirPath = path.join(baseDir, folder);
    try {
        const files = fs.readdirSync(dirPath);
        const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
        return { success: true, files: imageFiles };
    } catch {
        return { success: false, message: 'Unable to read folder' };
    }
}

export async function deletePhoto(baseDir, folder, filename) {
    if (sanitize(folder) || sanitize(filename)) return { success: false, message: 'Invalid input' };

    const filePath = path.join(baseDir, folder, filename);
    try {
        fs.unlinkSync(filePath);
        return { success: true, message: 'File deleted successfully' };
    } catch {
        return { success: false, message: 'Failed to delete file' };
    }
}

export async function getFolders(baseDir) {
    try {
        const folders = fs.readdirSync(baseDir, { withFileTypes: true })
            .filter(f => f.isDirectory())
            .map(f => f.name);
        return { success: true, folders };
    } catch {
        return { success: false, message: 'Unable to read folders' };
    }
}

export async function createFolder(baseDir, name) {
    if (!name || sanitize(name)) return { success: false, message: 'Invalid folder name' };
    const dirPath = path.join(baseDir, name);
    if (fs.existsSync(dirPath)) return { success: false, message: 'Folder already exists' };

    fs.mkdirSync(dirPath);
    return { success: true, message: 'Folder created' };
}

export async function deleteFolder(baseDir, name) {
    if (!name || sanitize(name)) return { success: false, message: 'Invalid folder name' };
    const dirPath = path.join(baseDir, name);
    if (!fs.existsSync(dirPath)) return { success: false, message: 'Folder does not exist' };

    try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        return { success: true, message: 'Folder deleted' };
    } catch {
        return { success: false, message: 'Failed to delete folder' };
    }
}
