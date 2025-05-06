import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'db', 'items.json');

const app = express();
app.use(cors({
    origin: "https://mooor.vercel.app",
    methods: ["GET", "POST"]
}));

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "https://mooor.vercel.app",
        methods: ["GET", "POST"]
    }
});

let materials = [];
try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    materials = JSON.parse(data);
} catch (err) {
    console.error('❌ Error al leer items.json:', err.message);
}

function saveMaterials() {
    fs.writeFile(DB_PATH, JSON.stringify(materials, null, 2), err => {
        if (err) console.error('❌ Error al guardar items:', err.message);
    });
}

io.on('connection', socket => {
    console.log('🟢 Cliente conectado');

    socket.emit('updateList', materials);

    socket.on('addItem', text => {
        const newItem = { text, done: false };
        materials.push(newItem);
        saveMaterials();
        io.emit('updateList', materials);
    });

    socket.on('removeItem', index => {
        materials.splice(index, 1);
        saveMaterials();
        io.emit('updateList', materials);
    });

    socket.on('toggleItem', index => {
        if (materials[index]) {
            materials[index].done = !materials[index].done;
            saveMaterials();
            io.emit('updateList', materials);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔴 Cliente desconectado');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});