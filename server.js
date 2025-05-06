import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const DB_PATH = path.join(__dirname, 'db', 'items.json');

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

app.use(express.static(path.join(__dirname, 'public')));

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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});