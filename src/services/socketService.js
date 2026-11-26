import { io } from 'socket.io-client';
import Constants from 'expo-constants';

export const HOTSPOT_DEFAULT_URL = process.env.HOTSPOT_DEFAULT_URL || 'http://185.225.233.145:3080';
// 'http://192.168.43.1:3000';

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
  return HOTSPOT_DEFAULT_URL;
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

  // Verifica se um servidor responde no endpoint /api/ping (mais leve que /api/status)
  async checkServerPing(url, timeoutMs = 1200) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${url}/api/ping`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) return false;
      const text = await response.text();
      return text && text.includes('HISTORIA_EM_BITS_OK');
    } catch (e) {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  // Fallback: verifica /api/status (compatibilidade com versões antigas do servidor)
  async checkServerHealth(url, timeoutMs = 1200) {
    // Tenta /api/ping primeiro (mais rápido)
    if (await this.checkServerPing(url, timeoutMs)) return true;
    // Fallback para /api/status
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${url}/api/status`, {
        method: 'GET',
        signal: controller.signal,
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data && data.status === 'online' && typeof data.activeRooms === 'number';
    } catch (e) {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  // Descoberta automática de servidor na rede local
  // onProgress(msg) — callback opcional para feedback em tempo real na UI
  async autoDiscoverServer(onProgress = null) {
    const notify = (msg) => {
      console.log('[AutoDiscover]', msg);
      if (onProgress) onProgress(msg);
    };

    // 1. Testa primeiro a URL atual configurada
    notify(`Testando ${this.serverUrl}...`);
    if (this.serverUrl && (await this.checkServerPing(this.serverUrl, 1500))) {
      notify(`✅ Servidor encontrado em ${this.serverUrl}`);
      return { found: true, url: this.serverUrl };
    }

    // Helper: retorna o primeiro IP que responder de um lote
    const findFirstOnline = (urls, timeoutMs = 1000) =>
      new Promise((resolve) => {
        if (!urls.length) return resolve(null);
        let pending = urls.length;
        let settled = false;
        urls.forEach((url) => {
          this.checkServerPing(url, timeoutMs).then((ok) => {
            if (settled) return;
            if (ok) {
              settled = true;
              resolve(url);
            } else {
              pending -= 1;
              if (pending === 0) resolve(null);
            }
          });
        });
      });

    // 2. Testa localhost / emulador primeiro
    notify('Testando localhost e emulador...');
    const localFound = await findFirstOnline(
      ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://10.0.2.2:3000'],
      600
    );
    if (localFound) {
      this.setServerUrl(localFound);
      notify(`✅ Servidor local encontrado: ${localFound}`);
      return { found: true, url: localFound };
    }

    // 3. Monta sub-redes prioritárias
    // Hotspot Android: 192.168.43.x; iPhone: 172.20.10.x; Windows: 192.168.137.x
    const subnets = [];
    const currentMatch = (this.serverUrl || '').match(/(\d+\.\d+\.\d+)\.\d+/);
    if (currentMatch && currentMatch[1]) subnets.push(currentMatch[1]);
    [
      '192.168.43',  // Hotspot Android (padrão)
      '192.168.1',
      '192.168.0',
      '192.168.15',
      '192.168.137', // Hotspot Windows
      '172.20.10',   // Hotspot iPhone
      '10.0.0',
      '10.42.0',     // Hotspot Linux
    ].forEach((s) => { if (!subnets.includes(s)) subnets.push(s); });

    // 4. Para cada sub-rede, varrer IPs priorizando extremos (.1, .100, .105, .254)
    // e depois o meio — assim encontra mais rápido sem esperar varrer 254 IPs
    const batchSize = 60;
    for (const prefix of subnets) {
      notify(`🔍 Varrendo rede ${prefix}.x...`);

      // Prioridade: IPs mais comuns de gateways/PCs
      const priorityIps = [1, 2, 100, 101, 105, 110, 50, 254, 200, 150];
      const candidates = [];
      // Primeiro os IPs de alta prioridade
      priorityIps.forEach((i) => {
        const url = `http://${prefix}.${i}:3000`;
        if (url !== this.serverUrl) candidates.push(url);
      });
      // Depois o resto 1..254 que ainda não foi incluído
      for (let i = 1; i <= 254; i++) {
        if (priorityIps.includes(i)) continue;
        const url = `http://${prefix}.${i}:3000`;
        if (url !== this.serverUrl) candidates.push(url);
      }

      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        const foundUrl = await findFirstOnline(batch, 1000);
        if (foundUrl) {
          this.setServerUrl(foundUrl);
          notify(`✅ Servidor encontrado: ${foundUrl}`);
          return { found: true, url: foundUrl };
        }
      }
    }

    notify('❌ Servidor não encontrado em nenhuma sub-rede.');
    return { found: false, url: this.serverUrl };
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
