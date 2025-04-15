import {
    saveMultipartFiles,
    getPhotos,
    deletePhoto,
    getFolders,
    createFolder,
    deleteFolder,
} from './methods.js';

export async function routes(fastify, opts) {
    const uploadDir = opts.uploadDir;

    fastify.get('/', async (req, reply) => {
        return reply.sendFile('index.html');
    });

    fastify.post('/upload', async (req, reply) => {
        const result = await saveMultipartFiles(req, uploadDir, '');
        if (!result.success) return reply.code(400).send(result.message);
        return reply.redirect('/');
    });

    fastify.post('/upload/:folderName', async (req, reply) => {
        const folder = req.params.folderName;
        const result = await saveMultipartFiles(req, uploadDir, folder);
        if (!result.success) return reply.code(400).send(result.message);
        return reply.redirect('/');
    });

    fastify.get('/photos', async (req, reply) => {
        const folder = req.query.folder || '';
        const result = await getPhotos(uploadDir, folder);
        if (!result.success) return reply.code(400).send(result.message);
        return result.files;
    });

    fastify.delete('/photos/:filename', async (req, reply) => {
        const { folder = '' } = req.query;
        const { filename } = req.params;
        const result = await deletePhoto(uploadDir, folder, filename);
        if (!result.success) return reply.code(400).send(result.message);
        return result;
    });

    fastify.get('/folders', async (req, reply) => {
        const result = await getFolders(uploadDir);
        if (!result.success) return reply.code(500).send(result.message);
        return result.folders;
    });

    fastify.post('/folders', async (req, reply) => {
        const name = req.body.name;
        const result = await createFolder(uploadDir, name);
        if (!result.success) return reply.code(400).send(result.message);
        return reply.code(201).send(result.message);
    });

    fastify.delete('/folders/:name', async (req, reply) => {
        const name = req.params.name;
        const result = await deleteFolder(uploadDir, name);
        if (!result.success) return reply.code(400).send(result.message);
        return reply.send(result.message);
    });
}
