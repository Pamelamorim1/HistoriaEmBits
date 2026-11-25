import { io } from 'socket.io-client';
import Constants from 'expo-constants';

export const HOTSPOT_DEFAULT_URL = 'http://192.168.43.1:3000';

export function getDefaultServerUrl() {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants.manifest?.debuggerHost ||
      '';
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3000`;
      }
    }
  } catch (err) {
    console.log('Erro ao detectar hostUri:', err);
  }
  return 'http://192.168.1.5:3000';
}

class SocketService {
  constructor() {
    this.socket = null;
    this.serverUrl = getDefaultServerUrl();
    this.listeners = new Map();
  }

  setServerUrl(url) {
    if (!url) return;
    let formatted = url.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `http://${formatted}`;
    }
    this.serverUrl = formatted;
    if (this.socket) {
      this.disconnect();
    }
  }

  connect(customUrl = null) {
    if (customUrl) {
      this.setServerUrl(customUrl);
    }

    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 6000,
      reconnectionAttempts: 3,
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] Conectado ao servidor:', this.socket.id);
      this.emitInternal('connection_change', { connected: true, id: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Desconectado:', reason);
      this.emitInternal('connection_change', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.log('[SocketService] Erro de conexão:', error.message);
      this.emitInternal(
        'error_message',
        `Não foi possível conectar ao servidor em ${this.serverUrl}.\n\n1. Verifique se o servidor está rodando no terminal com "npm run server".\n2. Verifique se o celular está no mesmo Wi-Fi.`
      );
      this.emitInternal('connection_error', error.message);
    });

    // Registrar forward de eventos do servidor
    const events = [
      'room_created',
      'room_joined',
      'room_updated',
      'game_started',
      'binary_selected',
      'year_verified',
      'third_attempt_resolved',
      'timeline_placed',
      'timeline_third_attempt_resolved',
      'timeline_proposal_updated',
      'timeline_proposal_rejected',
      'timeline_proposal_cancelled',
      'central_year_revealed',
      'rescue_challenge_resolved',
      'game_finished',
      'player_left',
      'room_closed',
      'error_message',
      'admin_reports_data',
      'admin_room_reset_success',
      'admin_error',
    ];

    events.forEach((evt) => {
      this.socket.on(evt, (data) => {
        this.emitInternal(evt, data);
      });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  createRoom(playerName) {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }
    this.socket.emit('create_room', { playerName });
  }

  joinRoom(roomId, playerName) {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }
    this.socket.emit('join_room', { roomId, playerName });
  }

  startGame(roomId) {
    if (!this.socket) return;
    this.socket.emit('start_game', { roomId });
  }

  selectBinary(roomId, binaryString) {
    if (!this.socket) return;
    this.socket.emit('select_binary', { roomId, binaryString });
  }

  submitYear(roomId, binaryString, guessedYear) {
    if (!this.socket) return;
    this.socket.emit('submit_year', { roomId, binaryString, guessedYear });
  }

  resolveThirdAttempt(roomId, action) {
    if (!this.socket) return;
    this.socket.emit('resolve_third_attempt', { roomId, action });
  }

  resolveTimelineThirdAttempt(roomId, action) {
    if (!this.socket) return;
    this.socket.emit('resolve_timeline_third_attempt', { roomId, action });
  }

  placeCardTimeline(roomId, insertIndex) {
    if (!this.socket) return;
    this.socket.emit('place_card_timeline', { roomId, insertIndex });
  }

  voteTimelineProposal(roomId, accept) {
    if (!this.socket) return;
    this.socket.emit('vote_timeline_proposal', { roomId, accept });
  }

  cancelTimelineProposal(roomId) {
    if (!this.socket) return;
    this.socket.emit('cancel_timeline_proposal', { roomId });
  }

  revealCentralYear(roomId, cardId = null) {
    if (!this.socket) return;
    this.socket.emit('reveal_central_year', { roomId, cardId });
  }

  submitRescueChallenge(roomId, guessedDecimal) {
    if (!this.socket) return;
    this.socket.emit('submit_rescue_challenge', { roomId, guessedDecimal });
  }

  getAdminReports(password) {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }
    this.socket.emit('admin_get_reports', { password });
  }

  resetRoom(password, roomId) {
    if (!this.socket) return;
    this.socket.emit('admin_reset_room', { password, roomId });
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback);
      }
    };
  }

  emitInternal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Erro no listener de ${event}:`, err);
        }
      });
    }
  }
}

export default new SocketService();
