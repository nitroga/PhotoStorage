import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import { routes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true });
const PORT = 3000;

const uploadDir = path.join(__dirname, '../../storage');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.register(fastifyMultipart);

app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'frontend'),
    prefix: '/',
});

app.register(fastifyStatic, {
    root: uploadDir,
    prefix: '/storage/',
    decorateReply: false,
});

app.register(routes, { uploadDir });

const start = async () => {
    try {
        await app.listen({ port: PORT });
        console.log(`Server listening at http://localhost:${PORT}`);
        console.log(`Upload directory: ${uploadDir}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();