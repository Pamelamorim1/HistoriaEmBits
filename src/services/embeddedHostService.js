import deckData from '../data/cards.json';

let TcpSocket = null;
try {
  TcpSocket = require('react-native-tcp-socket').default || require('react-native-tcp-socket');
} catch (e) {
  TcpSocket = null;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

class EmbeddedHostService {
  constructor() {
    this.server = null;
    this.port = 3000;
    this.isRunning = false;
    this.hostIp = '192.168.43.1'; // IP padrão do Roteador / Ponto de Acesso do Android
    this.rooms = new Map();
  }

  isSupported() {
    // Retorna se o módulo nativo de socket de escuta está disponível (ativo no APK compilado)
    return !!(TcpSocket && typeof TcpSocket.createServer === 'function');
  }

  startServer(onStatusChange) {
    if (!this.isSupported()) {
      console.log('[EmbeddedHost] Módulo nativo TCP só está ativo no APK compilado (no Expo Go use a Partida Local ou Servidor).');
      if (onStatusChange) {
        onStatusChange({
          success: false,
          reason: 'expo_go_limit',
          message: 'No Expo Go, portas de escuta nativas são restritas. Ao gerar o APK, o celular vira o host local offline automaticamente!',
        });
      }
      return false;
    }

    try {
      if (this.server) {
        this.stopServer();
      }

      this.server = TcpSocket.createServer((socket) => {
        console.log('[EmbeddedHost] Novo aparelho conectado:', socket.address());
        
        socket.on('data', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(socket, message);
          } catch (err) {
            console.error('[EmbeddedHost] Erro ao parsear mensagem:', err);
          }
        });

        socket.on('error', (err) => {
          console.log('[EmbeddedHost] Erro no socket cliente:', err);
        });

        socket.on('close', () => {
          console.log('[EmbeddedHost] Aparelho desconectado');
        });
      });

      this.server.listen({ port: this.port, host: '0.0.0.0' }, () => {
        this.isRunning = true;
        console.log(`[EmbeddedHost] Servidor ativo no próprio celular na porta ${this.port}!`);
        if (onStatusChange) {
          onStatusChange({
            success: true,
            port: this.port,
            hotspotIp: this.hostIp,
            message: `Servidor rodando no seu aparelho! Peça para os colegas conectarem no seu Ponto de Acesso (IP: ${this.hostIp}:${this.port})`,
          });
        }
      });

      this.server.on('error', (err) => {
        console.error('[EmbeddedHost] Erro no servidor:', err);
        this.isRunning = false;
        if (onStatusChange) {
          onStatusChange({ success: false, error: err.message });
        }
      });

      return true;
    } catch (err) {
      console.error('[EmbeddedHost] Falha ao iniciar servidor no celular:', err);
      return false;
    }
  }

  stopServer() {
    if (this.server) {
      try {
        this.server.close();
      } catch (e) {}
      this.server = null;
      this.isRunning = false;
    }
  }

  handleMessage(socket, message) {
    // Tratamento de mensagens Socket/JSON nativo para o APK
    console.log('[EmbeddedHost] Recebido evento:', message.type);
  }
}

export default new EmbeddedHostService();
