import logo from './logo.svg';
import './App.css';
import {io} from "socket.io-client";
import React, { useState } from 'react';

const socket = io("http://localhost:3000")
function App() {
  const [nickname, setNickname] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lobbies, setLobbies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');


  
  const handleNicknameSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      setIsLoggedIn(true);
      // emits an event to server to register user
      socket.emit('user:join', {nickname});
      // asks the server for available lobbies
      socket.emit('lobbies:get');
    }
  };
  
  //Setup socket listeners when component mounts
  React.useEffect(() => {
    socket.on('lobbies:list', (lobbyList) =>{
      setLobbies(lobbyList);
    });

    return () => {
      socket.off('lobbies:list');
    };
  }, []);

  const handleJoinLobby = (lobbyId) => {
    socket.emit('lobby:join', { lobbyId, nickname });
    // You would typically navigate to a game screen here
  };

  const filteredLobbies = lobbies.filter(lobby => 
    lobby.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (!isLoggedIn) {
      return (
        <div className="App">
          <header className="App-header">
            <h1>Welcome to Hangman!</h1>
            <form onSubmit={handleNicknameSubmit}>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="nickname-input"
              />
              <button type="submit" className="submit-button">
                Enter Lobby
              </button>
            </form>
          </header>
        </div>
      );
    }
 return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome, {nickname}!</h1>
        <div className="lobby-search">
          <input
            type="text"
            placeholder="Search lobbies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="lobbies-list">
          <h2>Available Lobbies</h2>
          {filteredLobbies.length > 0 ? (
            <ul>
              {filteredLobbies.map((lobby) => (
                <li key={lobby.id} className="lobby-item">
                  <span>{lobby.name}</span>
                  <span>Players: {lobby.players}/{lobby.maxPlayers}</span>
                  <button onClick={() => handleJoinLobby(lobby.id)}>
                    Join
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No lobbies available. Why not create one?</p>
          )}
          <button className="create-lobby-button">
            Create New Lobby
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
