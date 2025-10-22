class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.playerRooms = new Map();
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom(hostPlayer, hostSocketId, isStaked = false) {
    const roomCode = this.generateRoomCode();

    if (this.rooms.has(roomCode)) {
      return this.createRoom(hostPlayer, hostSocketId, isStaked);
    }

    this.rooms.set(roomCode, {
      code: roomCode,
      host: {
        ...hostPlayer,
        socketId: hostSocketId
      },
      guest: null,
      spectators: new Set(),
      status: 'waiting',
      createdAt: Date.now(),
      isStaked: isStaked,
      hostStaked: isStaked, // For staked games, host must have already staked
      guestStaked: false    // Guest hasn't staked yet
    });

    this.playerRooms.set(hostSocketId, roomCode);

    return roomCode;
  }

  createRoomWithCode(roomCode, hostPlayer, hostSocketId, isStaked = false) {
    if (this.rooms.has(roomCode)) {
      throw new Error('Room code already exists');
    }

    this.rooms.set(roomCode, {
      code: roomCode,
      host: {
        ...hostPlayer,
        socketId: hostSocketId
      },
      guest: null,
      spectators: new Set(),
      status: 'waiting',
      createdAt: Date.now(),
      isStaked: isStaked,
      hostStaked: isStaked, // For staked games, host must have already staked
      guestStaked: false    // Guest hasn't staked yet
    });

    this.playerRooms.set(hostSocketId, roomCode);

    return roomCode;
  }

  joinRoom(roomCode, guestPlayer, guestSocketId) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.status !== 'waiting') {
      return { success: false, error: 'Room is not available' };
    }

    if (room.guest) {
      return { success: false, error: 'Room is full' };
    }

    room.guest = {
      ...guestPlayer,
      socketId: guestSocketId
    };
    room.status = 'ready';

    this.playerRooms.set(guestSocketId, roomCode);

    return { success: true, room };
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }

  getRoomByPlayer(socketId) {
    const roomCode = this.playerRooms.get(socketId);
    return roomCode ? this.rooms.get(roomCode) : null;
  }

  getRoomByUsername(username) {
    // Search all rooms for a player with this username
    for (const room of this.rooms.values()) {
      if (room.host?.name === username || room.guest?.name === username) {
        return room;
      }
    }
    return null;
  }

  markGuestStaked(roomCode) {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.guestStaked = true;
      return true;
    }
    return false;
  }

  startGame(roomCode) {
    const room = this.rooms.get(roomCode);
    if (room && room.status === 'ready') {
      room.status = 'playing';
      return true;
    }
    return false;
  }

  removePlayerFromRoom(socketId) {
    const roomCode = this.playerRooms.get(socketId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    if (room.host.socketId === socketId) {
      this.rooms.delete(roomCode);
      if (room.guest) {
        this.playerRooms.delete(room.guest.socketId);
      }
      this.playerRooms.delete(socketId);
      return room;
    }

    if (room.guest && room.guest.socketId === socketId) {
      room.guest = null;
      // Don't reset status if game is finished (preserving for rematch)
      if (room.status !== 'finished') {
        room.status = 'waiting';
      }
      this.playerRooms.delete(socketId);
      return room;
    }

    return null;
  }

  detachPlayerFromRoom(socketId) {
    const roomCode = this.playerRooms.get(socketId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) {
      this.playerRooms.delete(socketId);
      return null;
    }

    if (room.host && room.host.socketId === socketId) {
      room.host.socketId = null;
    }

    if (room.guest && room.guest.socketId === socketId) {
      room.guest.socketId = null;
    }

    this.playerRooms.delete(socketId);
    return room;
  }

  attachPlayerSocket(roomCode, username, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const updateMapping = (player) => {
      if (!player || player.name !== username) return false;

      if (player.socketId && this.playerRooms.get(player.socketId) === roomCode) {
        this.playerRooms.delete(player.socketId);
      }

      player.socketId = socketId;
      this.playerRooms.set(socketId, roomCode);
      return true;
    };

    if (updateMapping(room.host)) return true;
    if (updateMapping(room.guest)) return true;

    return false;
  }

  endGame(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      console.log(`⚠️ roomManager.endGame: Room ${roomCode} not found`);
      return;
    }

    console.log(`🗑️  roomManager.endGame: DESTROYING room ${roomCode}`);
    console.log(`   - Host: ${room.host?.name}, Guest: ${room.guest?.name}`);
    console.log(`   - Status: ${room.status}, isStaked: ${room.isStaked}`);
    console.trace('   - Called from:'); // Show stack trace

    if (room.host) {
      this.playerRooms.delete(room.host.socketId);
    }
    if (room.guest) {
      this.playerRooms.delete(room.guest.socketId);
    }

    this.rooms.delete(roomCode);
    console.log(`✅ Room ${roomCode} destroyed`);
  }

  addSpectator(roomCode, spectatorSocketId, spectatorName) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (!room.spectators) {
      room.spectators = new Set();
    }

    room.spectators.add({ socketId: spectatorSocketId, name: spectatorName });
    return { success: true, room };
  }

  removeSpectator(roomCode, spectatorSocketId) {
    const room = this.rooms.get(roomCode);
    if (!room || !room.spectators) return;

    room.spectators = new Set(
      Array.from(room.spectators).filter(s => s.socketId !== spectatorSocketId)
    );
  }

  getActiveGames() {
    const activeGames = [];
    for (const [code, room] of this.rooms.entries()) {
      if (room.status === 'playing' || room.status === 'ready') {
        activeGames.push({
          roomCode: code,
          players: [room.host?.name, room.guest?.name].filter(Boolean),
          spectatorCount: room.spectators ? room.spectators.size : 0,
          status: room.status
        });
      }
    }
    return activeGames;
  }

  cleanupStaleRooms(maxAgeMs = 600000) {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (room.status === 'waiting' && now - room.createdAt > maxAgeMs) {
        this.removePlayerFromRoom(room.host.socketId);
      }
    }
  }
}

module.exports = RoomManager;
