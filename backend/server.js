const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",  // In production, set this to your frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// In-memory data structures
const users = new Map(); // socketId -> user data
const lobbies = new Map(); // lobbyId -> lobby data

// Generate a unique ID (for lobby creation)
const generateId = () => Math.random().toString(36).substring(2, 10);

// Initialize with some sample lobbies
lobbies.set('lobby1', { id: 'lobby1', name: 'Beginner Room', players: 1, maxPlayers: 4 });
lobbies.set('lobby2', { id: 'lobby2', name: 'Advanced Players', players: 2, maxPlayers: 4 });
lobbies.set('lobby3', { id: 'lobby3', name: 'Word Wizards', players: 0, maxPlayers: 3 });

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining with nickname
    socket.on('user:join', ({ nickname }) => {
        console.log(`User ${nickname} joined with ID: ${socket.id}`);
        users.set(socket.id, { id: socket.id, nickname });
    });

    // Handle request for lobbies list
    socket.on('lobbies:get', () => {
        console.log('Sending lobby list');
        socket.emit('lobbies:list', Array.from(lobbies.values()));
    });

    // Handle user joining a lobby
    socket.on('lobby:join', ({ lobbyId, nickname }) => {
        console.log(`User ${nickname} joining lobby ${lobbyId}`);
        const lobby = lobbies.get(lobbyId);
        
        if (lobby && lobby.players < lobby.maxPlayers) {
            // Add player to lobby
            lobby.players++;
            lobbies.set(lobbyId, lobby);
            
            // Join socket room for this lobby
            socket.join(`lobby:${lobbyId}`);
            
            // Let everyone know the lobby was updated
            io.emit('lobbies:list', Array.from(lobbies.values()));
            
            // Let the lobby members know about the new player
            io.to(`lobby:${lobbyId}`).emit('lobby:playerJoined', { 
                nickname,
                playersCount: lobby.players 
            });
        } else {
            socket.emit('lobby:error', { message: 'Could not join lobby' });
        }
    });

    // Handle user creating a new lobby
    socket.on('lobby:create', ({ name, maxPlayers, nickname }) => {
        const lobbyId = generateId();
        const newLobby = {
            id: lobbyId,
            name,
            players: 1, // Creator joins automatically
            maxPlayers: maxPlayers || 4
        };
        
        lobbies.set(lobbyId, newLobby);
        socket.join(`lobby:${lobbyId}`);
        
        // Let everyone know about the new lobby
        io.emit('lobbies:list', Array.from(lobbies.values()));
        
        // Confirm to creator
        socket.emit('lobby:created', newLobby);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Clean up user data
        const user = users.get(socket.id);
        if (user) {
            users.delete(socket.id);
            
            // Update player counts in lobbies if needed
            // This would require tracking which lobby each user is in
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));