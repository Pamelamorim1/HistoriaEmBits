const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Rede de segurança: um erro em um evento não derruba o servidor (e não apaga as salas em memória)
process.on('uncaughtException', (err) => {
  console.error('[Servidor] Erro não tratado (servidor continua ativo):', err);
});
process.on('unhandledRejection', (err) => {
  console.error('[Servidor] Promise rejeitada não tratada:', err);
});

const PORT = process.env.PORT || 3000;
const PROF_PASSWORD = process.env.PROF_PASSWORD || 'PROF2026';
const MAX_ROOMS = 5;
const MAX_PLAYERS_PER_ROOM = 5;
const MIN_PLAYERS_TO_START = 2;

// Load Deck
const deckDataPath = path.join(__dirname, '../src/data/cards.json');
let deckData = null;
try {
  deckData = JSON.parse(fs.readFileSync(deckDataPath, 'utf8'));
} catch (err) {
  console.error('Erro ao carregar baralho:', err);
}

// In-Memory State
const rooms = new Map(); // roomId -> RoomState
const gameReports = []; // Completed game reports

function generateRoomId() {
  for (let i = 1; i <= MAX_ROOMS; i++) {
    const id = `SALA-0${i}`;
    if (!rooms.has(id)) return id;
  }
  return null;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function prepareCardRound(card) {
  if (!card) return null;
  const distractors = Array.isArray(card.distratores_binarios)
    ? card.distratores_binarios.filter((d) => typeof d === 'string' && d.length > 0)
    : [];
  const base = typeof card.ano_binario === 'string' && card.ano_binario.length > 0 ? [card.ano_binario] : [];
  const binaryOptions = shuffle([...base, ...distractors]);
  return {
    id: card.id || 'card',
    titulo: card.titulo || 'Evento Histórico',
    resumo_historico: card.resumo_historico || '',
    imagem_url: card.imagem_url || '',
    binaryOptions,
    // Do not reveal ano_decimal or ano_binario to clients during decoding
  };
}

function isSocketLeader(room, socket, playerId = null) {
  if (!room || !room.players || room.players.length === 0) return false;
  const currentLeader = room.players[room.leaderIndex];
  if (!currentLeader) return false;
  return (
    socket.id === currentLeader.socketId ||
    (socket.playerId && socket.playerId === currentLeader.id) ||
    (playerId && playerId === currentLeader.id) ||
    socket.id === currentLeader.id
  );
}

function findPlayerInRoom(room, socket, playerId = null) {
  if (!room || !room.players) return null;
  return room.players.find(
    (p) =>
      p.socketId === socket.id ||
      (socket.playerId && p.id === socket.playerId) ||
      (playerId && p.id === playerId) ||
      p.id === socket.id
  );
}

io.on('connection', (socket) => {
  console.log(`[Socket] Conectado: ${socket.id}`);

  // 1. Criar Sala
  socket.on('create_room', ({ playerName, playerId }) => {
    if (!playerName || !playerName.trim()) {
      return socket.emit('error_message', 'Nome de jogador obrigatório.');
    }

    if (rooms.size >= MAX_ROOMS) {
      return socket.emit(
        'error_message',
        'Limite máximo de 5 salas atingido. Aguarde uma turma finalizar ou entre em uma sala existente.'
      );
    }

    const roomId = generateRoomId();
    if (!roomId) {
      return socket.emit(
        'error_message',
        'Limite máximo de 5 salas atingido. Aguarde uma turma finalizar ou entre em uma sala existente.'
      );
    }

    const pId = playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const player = {
      id: pId,
      socketId: socket.id,
      name: playerName.trim(),
      isHost: true,
      connected: true,
      lastSeen: Date.now(),
    };

    const newRoom = {
      id: roomId,
      status: 'lobby', // 'lobby' | 'playing' | 'finished'
      players: [player],
      leaderIndex: 0,
      score: 1000,
      startTime: null,
      endTime: null,
      cardsDeck: [],
      currentCardIndex: -1,
      currentCard: null,
      currentCardRound: null,
      selectedBinary: null,
      roundAttempts: 0,
      revealedHints: [],
      promptThirdAttempt: false,
      timelineAttempts: 0,
      timelineHints: [],
      promptTimelineThirdAttempt: false,
      isRevealedAssisted: false,
      rescueUsed: false,
      rescueChallenge: null,
      phase: 'lobby', // 'lobby' | 'decoding' | 'timeline' | 'finished'
      timeline: [], // array of positioned cards
      roundLogs: [], // algorithmic logs for professor
      firstTryCorrectCount: 0,
      totalHintsUsed: 0,
      timelineErrors: 0,
    };

    rooms.set(roomId, newRoom);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerId = pId;

    socket.emit('room_created', { roomId, player, room: sanitizeRoomState(newRoom, pId) });
    io.to(roomId).emit('room_updated', sanitizeRoomState(newRoom));
  });

  // 2. Entrar em Sala
  socket.on('join_room', ({ roomId, playerName, playerId }) => {
    if (!playerName || !playerName.trim()) {
      return socket.emit('error_message', 'Nome de jogador obrigatório.');
    }
    const cleanRoomId = (roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);

    if (!room) {
      return socket.emit('error_message', `Sala "${cleanRoomId}" não encontrada.`);
    }

    // Se o jogador já pertence à sala (pelo ID estável ou pelo mesmo nome), reconecta sem expulsar
    const existingPlayer = room.players.find(
      (p) => (playerId && p.id === playerId) || p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
    );

    if (existingPlayer) {
      if (existingPlayer.disconnectTimer) {
        clearTimeout(existingPlayer.disconnectTimer);
        existingPlayer.disconnectTimer = null;
      }
      existingPlayer.socketId = socket.id;
      existingPlayer.connected = true;
      existingPlayer.disconnectedAt = null;
      existingPlayer.lastSeen = Date.now();
      socket.join(cleanRoomId);
      socket.roomId = cleanRoomId;
      socket.playerId = existingPlayer.id;

      socket.emit('room_joined', { roomId: cleanRoomId, player: existingPlayer, room: sanitizeRoomState(room, existingPlayer.id) });
      io.to(cleanRoomId).emit('room_updated', sanitizeRoomState(room));
      console.log(`[Socket] Jogador ${existingPlayer.name} restabeleceu presença na ${cleanRoomId}`);
      return;
    }

    if (room.status !== 'lobby') {
      return socket.emit('error_message', 'Esta partida já foi iniciada.');
    }

    if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
      return socket.emit('error_message', 'Sala cheia (máximo de 5 participantes).');
    }

    const pId = playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const player = {
      id: pId,
      socketId: socket.id,
      name: playerName.trim(),
      isHost: false,
      connected: true,
      lastSeen: Date.now(),
    };

    room.players.push(player);
    socket.join(cleanRoomId);
    socket.roomId = cleanRoomId;
    socket.playerId = pId;

    socket.emit('room_joined', { roomId: cleanRoomId, player, room: sanitizeRoomState(room, pId) });
    io.to(cleanRoomId).emit('room_updated', sanitizeRoomState(room));
  });

  // Reconexão explícita após queda transitória de conexão
  socket.on('reconnect_room', ({ roomId, playerId, playerName }) => {
    const cleanRoomId = (roomId || '').trim().toUpperCase();
    if (!rooms.has(cleanRoomId)) {
      return socket.emit('error_message', `Sala "${cleanRoomId}" não encontrada para reconexão.`);
    }
    const room = rooms.get(cleanRoomId);
    const existingPlayer = room.players.find(
      (p) => (playerId && p.id === playerId) || (playerName && p.name.trim().toLowerCase() === playerName.trim().toLowerCase())
    );

    if (existingPlayer) {
      if (existingPlayer.disconnectTimer) {
        clearTimeout(existingPlayer.disconnectTimer);
        existingPlayer.disconnectTimer = null;
      }
      existingPlayer.socketId = socket.id;
      existingPlayer.connected = true;
      existingPlayer.disconnectedAt = null;
      existingPlayer.lastSeen = Date.now();
      socket.join(cleanRoomId);
      socket.roomId = cleanRoomId;
      socket.playerId = existingPlayer.id;

      socket.emit('room_reconnected', {
        roomId: cleanRoomId,
        player: existingPlayer,
        room: sanitizeRoomState(room, existingPlayer.id),
      });
      io.to(cleanRoomId).emit('room_updated', sanitizeRoomState(room));
      console.log(`[Socket] Jogador ${existingPlayer.name} reconectou com sucesso na ${cleanRoomId}`);
    } else {
      socket.emit('error_message', 'Sessão anterior na sala não encontrada.');
    }
  });

  // Heartbeat do Cliente (mantém viva a presença na sala sem deixar a conexão cair)
  socket.on('player_heartbeat', ({ roomId, playerId }) => {
    const cleanRoomId = (roomId || '').trim().toUpperCase();
    if (cleanRoomId && rooms.has(cleanRoomId)) {
      const room = rooms.get(cleanRoomId);
      const player = room.players.find((p) => (playerId && p.id === playerId) || p.socketId === socket.id);
      if (player) {
        player.lastSeen = Date.now();
        if (!player.connected || player.socketId !== socket.id) {
          player.connected = true;
          player.socketId = socket.id;
          if (player.disconnectTimer) {
            clearTimeout(player.disconnectTimer);
            player.disconnectTimer = null;
          }
        }
      }
    }
  });

  // Sair da Sala Intencionalmente
  socket.on('leave_room', ({ roomId, playerId }) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    if (cleanRoomId && rooms.has(cleanRoomId)) {
      const room = rooms.get(cleanRoomId);
      const playerIndex = room.players.findIndex(
        (p) => (playerId && p.id === playerId) || p.socketId === socket.id
      );

      if (playerIndex !== -1) {
        const removedPlayer = room.players[playerIndex];
        if (removedPlayer.disconnectTimer) {
          clearTimeout(removedPlayer.disconnectTimer);
        }
        room.players.splice(playerIndex, 1);
        console.log(`[Socket] Jogador ${removedPlayer.name} saiu voluntariamente da sala ${cleanRoomId}`);

        if (room.players.length === 0) {
          rooms.delete(cleanRoomId);
        } else {
          if (room.leaderIndex >= room.players.length) {
            room.leaderIndex = 0;
          }
          if (room.timelineProposal) {
            const allAccepted = room.players.every((p) => room.timelineProposal.votes[p.id] === true);
            if (allAccepted) {
              executeActiveProposal(room);
            }
          }
          io.to(cleanRoomId).emit('player_left', {
            playerName: removedPlayer.name,
            room: sanitizeRoomState(room),
          });
        }
      }
      socket.leave(cleanRoomId);
      socket.roomId = null;
    }
  });

  // 3. Iniciar Partida
  socket.on('start_game', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error_message', 'Sala inexistente.');
    if (room.players.length < MIN_PLAYERS_TO_START) {
      return socket.emit('error_message', `Mínimo de ${MIN_PLAYERS_TO_START} jogadores necessários para iniciar.`);
    }

    // Setup initial reference card (random from full deck pool, year hidden until points spent)
    const centralCard = {
      ...deckData.carta_central_inicial,
      posicaoFixa: true,
      anoRevelado: false,
    };

    // Remaining cards form the game deck
    const shuffledCards = shuffle(deckData.cartas);

    room.status = 'playing';
    room.startTime = new Date().toISOString();
    room.score = 1000;
    room.leaderIndex = 0;
    room.timeline = [centralCard];
    room.cardsDeck = shuffledCards;
    room.timelineProposal = null;
    room.currentCardIndex = 0;
    room.currentCard = shuffledCards[0];
    room.currentCardRound = prepareCardRound(shuffledCards[0]);
    room.selectedBinary = null;
    room.roundAttempts = 0;
    room.revealedHints = [];
    room.promptThirdAttempt = false;
    room.timelineAttempts = 0;
    room.timelineHints = [];
    room.promptTimelineThirdAttempt = false;
    room.isRevealedAssisted = false;
    room.rescueUsed = false;
    room.rescueChallenge = null;
    room.phase = 'decoding';

    io.to(roomId).emit('game_started', sanitizeRoomState(room));
  });

  // 4. Selecionar Binário (Apenas Líder)
  socket.on('select_binary', ({ roomId, binaryString, playerId }) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room || room.status !== 'playing' || room.phase !== 'decoding') return;

    if (!isSocketLeader(room, socket, playerId)) {
      return socket.emit('error_message', 'Apenas o Líder da rodada pode selecionar o código.');
    }

    const currentLeader = room.players[room.leaderIndex];
    room.selectedBinary = binaryString;
    // Broadcast real-time selection to all team members
    io.to(room.id).emit('binary_selected', {
      selectedBinary: binaryString,
      leaderName: currentLeader.name,
    });
  });

  function executeYearSubmission(room, binaryString, guessedYear) {
    const currentLeader = room.players[room.leaderIndex] || { name: 'Equipe' };
    const card = room.currentCard;
    const yearNumber = parseInt(guessedYear, 10);
    const isBinaryCorrect = binaryString === card.ano_binario;
    const isYearCorrect = yearNumber === card.ano_decimal;
    const attemptNum = room.roundAttempts + 1;
    room.roundAttempts = attemptNum;

    if (isBinaryCorrect && isYearCorrect) {
      // SUCESSO!
      if (attemptNum === 1) {
        room.firstTryCorrectCount += 1;
      }
      const pointsEarned = attemptNum === 1 ? 100 : attemptNum === 2 ? 50 : 25;
      room.score += pointsEarned;

      room.roundLogs.push({
        leader: currentLeader.name,
        cardId: card.id,
        cardTitle: card.titulo,
        attempt: attemptNum,
        success: true,
        pointsEarned,
        selectedBinary: binaryString,
        guessedYear: yearNumber,
        revealedAssisted: false,
        hintsUsed: room.revealedHints.length,
      });

      room.phase = 'timeline';
      room.promptThirdAttempt = false;

      io.to(room.id).emit('year_verified', {
        success: true,
        pointsEarned,
        message: `Ano decodificado com sucesso! (+${pointsEarned} pontos) Agora definam a posição na Linha do Tempo.`,
        card: {
          id: card.id,
          titulo: card.titulo,
          ano_decimal: card.ano_decimal,
          ano_binario: card.ano_binario,
          resumo_historico: card.resumo_historico,
          imagem_url: card.imagem_url,
        },
        room: sanitizeRoomState(room),
      });
    } else {
      // ERRO
      const wasAlreadyZero = room.score === 0;
      let penalty = 50;
      if (attemptNum > 3) {
        penalty = 25; // Erros extras após decisão
      }
      room.score = Math.max(0, room.score - penalty);

      let newHint = null;
      let promptDecision = false;

      if (attemptNum === 1) {
        newHint = { nivel: 1, tipo: 'Contexto Histórico / Século', texto: card.dicas.dica_1_contexto };
        room.revealedHints.push(newHint);
        room.totalHintsUsed += 1;
      } else if (attemptNum === 2) {
        newHint = { nivel: 2, tipo: 'Pista Matemática / Eliminação', texto: card.dicas.dica_2_matematica };
        room.revealedHints.push(newHint);
        room.totalHintsUsed += 1;
      } else if (attemptNum === 3) {
        newHint = { nivel: 3, tipo: 'Pista Específica Final', texto: card.dicas.dica_3_especifica };
        room.revealedHints.push(newHint);
        room.totalHintsUsed += 1;
        promptDecision = true;
        room.promptThirdAttempt = true;
      }

      room.roundLogs.push({
        leader: currentLeader.name,
        cardId: card.id,
        cardTitle: card.titulo,
        attempt: attemptNum,
        success: false,
        selectedBinary: binaryString,
        guessedYear: yearNumber || 'inválido',
        penalty,
        hintRevealed: newHint ? newHint.tipo : null,
      });

      const zeroState = handleZeroScoreTransition(room, wasAlreadyZero);
      if (zeroState === 'game_over') return;

      io.to(room.id).emit('year_verified', {
        success: false,
        message: isBinaryCorrect
          ? 'Código binário correto, mas cálculo decimal incorreto! Verifique a conversão.'
          : 'Código binário incorreto ou ano incompatível com o evento histórico.',
        penalty,
        attempts: room.roundAttempts,
        hints: room.revealedHints,
        promptThirdAttempt: promptDecision,
        room: sanitizeRoomState(room),
      });
    }
  }

  // 5. Submeter Ano Decimal (Apenas Líder)
  socket.on('submit_year', ({ roomId, binaryString, guessedYear, playerId }) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room || room.status !== 'playing' || room.phase !== 'decoding') return;

    if (!isSocketLeader(room, socket, playerId)) {
      return socket.emit('error_message', 'Apenas o Líder da rodada pode submeter palpites.');
    }

    executeYearSubmission(room, binaryString, guessedYear);
  });

  // 6. Decisão Crítica do 3º Erro (Apenas Líder)
  socket.on('resolve_third_attempt', ({ roomId, action, playerId }) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room || room.status !== 'playing') return;

    if (!isSocketLeader(room, socket, playerId)) {
      return socket.emit('error_message', 'Apenas o Líder pode registrar a decisão do grupo.');
    }

    const currentLeader = room.players[room.leaderIndex] || { name: 'Equipe' };
    if (action === 'continue') {
      room.promptThirdAttempt = false;
      io.to(room.id).emit('third_attempt_resolved', {
        action: 'continue',
        message: 'O grupo optou por continuar tentando com base nas 3 pistas! Novos erros descontarão -25 pts.',
        room: sanitizeRoomState(room),
      });
    } else if (action === 'reveal') {
      if (room.score < 150) {
        return socket.emit('error_message', 'Saldo insuficiente na Reserva de Emergência (necessário 150 pts).');
      }
      const card = room.currentCard;
      room.score = Math.max(0, room.score - 150);
      room.isRevealedAssisted = true;
      room.promptThirdAttempt = false;
      room.phase = 'timeline';

      room.roundLogs.push({
        leader: currentLeader.name,
        cardId: card.id,
        cardTitle: card.titulo,
        action: 'Revelação Assistida (-150 pts)',
        revealedAssisted: true,
      });

      handleZeroScoreTransition(room, false);

      io.to(roomId).emit('third_attempt_resolved', {
        action: 'reveal',
        message: 'Revelação Assistida acionada (-150 pts). O ano foi revelado para posicionamento na linha.',
        card: {
          id: card.id,
          titulo: card.titulo,
          ano_decimal: card.ano_decimal,
          ano_binario: card.ano_binario,
          resumo_historico: card.resumo_historico,
        },
        room: sanitizeRoomState(room),
      });
    }
  });

  function createRescueChallenge() {
    const targetDecimal = Math.floor(Math.random() * 231) + 20; // 20..250 (8 bits)
    return {
      binaryCode: targetDecimal.toString(2).padStart(8, '0'),
      targetDecimal,
    };
  }

  function handleZeroScoreTransition(room, wasAlreadyZero) {
    if (room.score > 0) return 'none';
    if (!room.rescueUsed && !room.rescueChallenge) {
      room.rescueChallenge = createRescueChallenge();
      return 'rescue_triggered';
    }
    if (wasAlreadyZero && room.rescueUsed) {
      room.status = 'finished';
      room.phase = 'finished';
      room.endTime = new Date().toISOString();
      const report = generatePedagogicalReport(room, true);
      gameReports.push(report);
      io.to(room.id).emit('game_finished', {
        report,
        room: sanitizeRoomState(room),
      });
      return 'game_over';
    }
    return 'emergency_mode';
  }

  function findCorrectTimelineIndex(timeline, year) {
    for (let i = 0; i < timeline.length; i++) {
      if (year <= timeline[i].ano_decimal) return i;
    }
    return timeline.length;
  }

  function advanceTimelineRound(room, successMessage) {
    const nextIndex = room.currentCardIndex + 1;
    const totalCardsInDeck = Math.min(room.cardsDeck.length, 10);

    // Garante limpeza de propostas pendentes
    room.timelineProposal = null;

    // Na próxima escolha de posição, todas as cartas voltam a ter o ano decimal oculto
    room.timeline.forEach((c) => {
      c.anoRevelado = false;
    });

    if (nextIndex >= totalCardsInDeck) {
      room.status = 'finished';
      room.phase = 'finished';
      room.endTime = new Date().toISOString();

      const report = generatePedagogicalReport(room);
      gameReports.push(report);

      io.to(room.id).emit('game_finished', {
        report,
        room: sanitizeRoomState(room),
      });
    } else {
      room.currentCardIndex = nextIndex;
      room.currentCard = room.cardsDeck[nextIndex];
      room.currentCardRound = prepareCardRound(room.cardsDeck[nextIndex]);
      room.leaderIndex = (room.leaderIndex + 1) % room.players.length;
      room.selectedBinary = null;
      room.roundAttempts = 0;
      room.revealedHints = [];
      room.promptThirdAttempt = false;
      room.timelineAttempts = 0;
      room.timelineHints = [];
      room.promptTimelineThirdAttempt = false;
      room.isRevealedAssisted = false;
      room.phase = 'decoding';

      const nextLeader = room.players[room.leaderIndex];

      io.to(room.id).emit('timeline_placed', {
        success: true,
        message: successMessage,
        nextLeaderName: nextLeader ? nextLeader.name : null,
        nextLeaderId: nextLeader ? nextLeader.id : null,
        room: sanitizeRoomState(room),
      });
    }
  }

  function executeTimelinePlacement(room, insertIndex) {
    const currentLeader = room.players[room.leaderIndex];
    const card = room.currentCard;
    const year = card.ano_decimal;
    const timeline = room.timeline;

    const prevCard = insertIndex > 0 ? timeline[insertIndex - 1] : null;
    const nextCard = insertIndex < timeline.length ? timeline[insertIndex] : null;

    const isValidBefore = !prevCard || prevCard.ano_decimal <= year;
    const isValidAfter = !nextCard || year <= nextCard.ano_decimal;

    if (isValidBefore && isValidAfter) {
      const newCardInTimeline = {
        id: card.id,
        titulo: card.titulo,
        ano_decimal: card.ano_decimal,
        ano_binario: card.ano_binario,
        resumo_historico: card.resumo_historico,
        imagem_url: card.imagem_url,
        colocadoPor: currentLeader ? currentLeader.name : 'Equipe',
        anoRevelado: false,
      };

      timeline.splice(insertIndex, 0, newCardInTimeline);

      room.roundLogs.push({
        leader: currentLeader ? currentLeader.name : 'Equipe',
        action: 'Posicionamento Linha do Tempo',
        success: true,
        insertIndex,
      });

      const nextLeaderIndex = (room.leaderIndex + 1) % room.players.length;
      advanceTimelineRound(
        room,
        `Consenso da equipe aprovado! Carta posicionada com precisão. Liderança passou para ${room.players[nextLeaderIndex].name}.`
      );
    } else {
      const wasAlreadyZero = room.score === 0;
      const attemptNum = (room.timelineAttempts || 0) + 1;
      room.timelineAttempts = attemptNum;
      room.timelineErrors += 1;

      const penalty = attemptNum === 1 ? 25 : attemptNum === 2 ? 50 : attemptNum === 3 ? 50 : 25;
      room.score = Math.max(0, room.score - penalty);

      const correctIndex = findCorrectTimelineIndex(timeline, year);
      let newHint = null;
      let promptDecision = false;

      if (attemptNum === 1) {
        const directionText =
          insertIndex < correctIndex
            ? `O evento (${year}) aconteceu DEPOIS do ponto #${insertIndex} escolhido. Tentem mover mais para a DIREITA!`
            : `O evento (${year}) aconteceu ANTES do ponto #${insertIndex} escolhido. Tentem mover mais para a ESQUERDA!`;
        newHint = { nivel: 1, tipo: 'Direção Cronológica', texto: directionText };
        room.timelineHints.push(newHint);
      } else if (attemptNum === 2) {
        let rangeText = '';
        if (correctIndex === 0) {
          rangeText = `Este evento (${year}) é o MAIS ANTIGO da linha: deve ficar ANTES de "${timeline[0].titulo}".`;
        } else if (correctIndex === timeline.length) {
          rangeText = `Este evento (${year}) é o MAIS RECENTE da linha: deve ficar DEPOIS de "${timeline[timeline.length - 1].titulo}".`;
        } else {
          rangeText = `Este evento (${year}) fica exatamente ENTRE "${timeline[correctIndex - 1].titulo}" e "${timeline[correctIndex].titulo}".`;
        }
        newHint = { nivel: 2, tipo: 'Intervalo na Linha do Tempo', texto: rangeText };
        room.timelineHints.push(newHint);
      } else if (attemptNum === 3) {
        promptDecision = true;
        room.promptTimelineThirdAttempt = true;
      }

      room.roundLogs.push({
        leader: currentLeader ? currentLeader.name : 'Equipe',
        action: 'Erro de Posicionamento Linha do Tempo',
        success: false,
        attempt: attemptNum,
        insertIndex,
        penalty,
        hintRevealed: newHint ? newHint.tipo : null,
      });

      const zeroState = handleZeroScoreTransition(room, wasAlreadyZero);
      if (zeroState === 'game_over') return;

      io.to(room.id).emit('timeline_placed', {
        success: false,
        message: `Posição incorreta para o ano ${year} (-${penalty} pts). ${newHint ? newHint.texto : 'Comparem com as cartas vizinhas e tentem novamente.'}`,
        penalty,
        timelineAttempts: room.timelineAttempts,
        timelineHints: room.timelineHints,
        promptTimelineThirdAttempt: promptDecision,
        room: sanitizeRoomState(room),
      });
    }
  }

  function executeActiveProposal(room) {
    if (!room || !room.timelineProposal) return;
    const proposal = room.timelineProposal;
    room.timelineProposal = null;
    executeTimelinePlacement(room, proposal.insertIndex);
  }

  // 7. Propor Posicionamento na Linha do Tempo (Requer Consenso de Todos os Conectados)
  socket.on('place_card_timeline', ({ roomId, insertIndex, playerId }) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room || room.status !== 'playing' || room.phase !== 'timeline') return;

    if (!isSocketLeader(room, socket, playerId)) {
      return socket.emit('error_message', 'Apenas o Líder da rodada pode propor o posicionamento da carta.');
    }

    if (room.timelineProposal) return;

    // Apenas jogadores ativos (conectados) participam da contagem
    const connectedPlayers = room.players.filter((p) => p.connected !== false);

    // Se houver apenas 1 jogador conectado (ex: teste solo ou colegas desconectados), posiciona direto
    if (connectedPlayers.length <= 1) {
      return executeTimelinePlacement(room, insertIndex);
    }

    const currentLeader = room.players[room.leaderIndex] || { name: 'Equipe' };
    const votes = {};
    votes[currentLeader.id] = true; // Propositor (Líder) já concorda

    // Obter descrição pedagógica e contextualizada da posição entre as cartas
    let positionDescription = `Ponto #${insertIndex}`;
    const timeline = room.timeline;
    if (timeline && timeline.length > 0) {
      if (insertIndex === 0) {
        positionDescription = `no início da Linha do Tempo (antes de "${timeline[0].titulo}")`;
      } else if (insertIndex >= timeline.length) {
        positionDescription = `no final da Linha do Tempo (depois de "${timeline[timeline.length - 1].titulo}")`;
      } else {
        const prevCard = timeline[insertIndex - 1];
        const nextCard = timeline[insertIndex];
        positionDescription = `entre "${prevCard.titulo}" e "${nextCard.titulo}"`;
      }
    }

    room.timelineProposal = {
      type: 'timeline',
      insertIndex,
      positionDescription,
      proposerId: currentLeader.id,
      proposerName: currentLeader.name,
      cardTitle: room.currentCard?.titulo,
      cardYear: room.currentCard?.ano_decimal,
      votes,
    };

    io.to(room.id).emit('timeline_proposal_updated', {
      proposal: room.timelineProposal,
      room: sanitizeRoomState(room),
    });
  });

  // Votar na Proposta de Posicionamento (Consenso Coletivo)
  socket.on('vote_timeline_proposal', ({ roomId, accept, playerId }) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room || !room.timelineProposal) return;

    const voter = findPlayerInRoom(room, socket, playerId);
    if (!voter) return;

    if (!accept) {
      const rejectedMsg = `A proposta de posicionamento foi recusada por ${voter.name}. Conversem em grupo e cheguem a um novo consenso!`;
      room.timelineProposal = null;
      return io.to(room.id).emit('timeline_proposal_rejected', {
        message: rejectedMsg,
        room: sanitizeRoomState(room),
      });
    }

    room.timelineProposal.votes[voter.id] = true;

    // Checa se TODOS os jogadores ATIVOS (conectados) aceitaram
    const connectedPlayers = room.players.filter((p) => p.connected !== false);
    const allAccepted = connectedPlayers.every((p) => room.timelineProposal.votes[p.id] === true);

    if (allAccepted) {
      executeActiveProposal(room);
    } else {
      io.to(room.id).emit('timeline_proposal_updated', {
        proposal: room.timelineProposal,
        room: sanitizeRoomState(room),
      });
    }
  });

  // Cancelar Proposta de Posicionamento
  socket.on('cancel_timeline_proposal', ({ roomId, playerId }) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room || !room.timelineProposal) return;

    room.timelineProposal = null;
    io.to(room.id).emit('timeline_proposal_cancelled', {
      message: 'Proposta de posicionamento cancelada pela equipe.',
      room: sanitizeRoomState(room),
    });
  });

  // Decisão Crítica do 3º Erro na Linha do Tempo (Apenas Líder)
  socket.on('resolve_timeline_third_attempt', ({ roomId, action, playerId }) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room || room.status !== 'playing' || room.phase !== 'timeline') return;

    if (!isSocketLeader(room, socket, playerId)) {
      return socket.emit('error_message', 'Apenas o Líder pode registrar a decisão do grupo.');
    }

    const currentLeader = room.players[room.leaderIndex];

    if (action === 'continue') {
      room.promptTimelineThirdAttempt = false;
      io.to(roomId).emit('timeline_third_attempt_resolved', {
        action: 'continue',
        message: 'O grupo optou por continuar tentando posicionar com base nas 2 dicas! Novos erros descontarão -25 pts.',
        room: sanitizeRoomState(room),
      });
    } else if (action === 'reveal') {
      if (room.score < 150) {
        return socket.emit('error_message', 'Saldo insuficiente na Reserva de Emergência (necessário 150 pts).');
      }
      const card = room.currentCard;
      room.score = Math.max(0, room.score - 150);
      room.promptTimelineThirdAttempt = false;

      const correctIndex = findCorrectTimelineIndex(room.timeline, card.ano_decimal);
      const newCardInTimeline = {
        id: card.id,
        titulo: card.titulo,
        ano_decimal: card.ano_decimal,
        ano_binario: card.ano_binario,
        resumo_historico: card.resumo_historico,
        imagem_url: card.imagem_url,
        colocadoPor: `${currentLeader.name} (Assistido)`,
        anoRevelado: false,
      };
      room.timeline.splice(correctIndex, 0, newCardInTimeline);

      room.roundLogs.push({
        leader: currentLeader.name,
        cardId: card.id,
        cardTitle: card.titulo,
        action: 'Posicionamento Assistido (-150 pts)',
        insertIndex: correctIndex,
        revealedAssisted: true,
      });

      const nextLeaderIndex = (room.leaderIndex + 1) % room.players.length;
      io.to(room.id).emit('timeline_third_attempt_resolved', {
        action: 'reveal',
        message: `Posicionamento Assistido acionado (-150 pts). A carta foi inserida na posição correta (#${correctIndex}).`,
      });
      advanceTimelineRound(
        room,
        `Carta posicionada por Revelação Assistida (-150 pts). Liderança passou para ${room.players[nextLeaderIndex].name}.`
      );
    }
  });

  // Revelar Ano Decodificado de Carta da Linha do Tempo (Gasta 50 pontos)
  socket.on('reveal_central_year', ({ roomId, cardId }) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room || room.status !== 'playing') return;

    if (room.score < 50) {
      return socket.emit('error_message', 'Saldo insuficiente na Reserva de Emergência (necessário 50 pts).');
    }

    const targetCard = cardId
      ? room.timeline.find((c) => c.id === cardId)
      : room.timeline.find((c) => c.posicaoFixa);
    if (targetCard && !targetCard.anoRevelado) {
      room.score = Math.max(0, room.score - 50);
      targetCard.anoRevelado = true;
      handleZeroScoreTransition(room, false);
      io.to(room.id).emit('central_year_revealed', {
        message: `Ano de "${targetCard.titulo}" revelado (${targetCard.ano_decimal})! (-50 pontos da equipe)`,
        room: sanitizeRoomState(room),
      });
    }
  });

  // Responder Desafio de Resgate (Reinicialização Binária ao zerar pontos)
  socket.on('submit_rescue_challenge', ({ roomId, guessedDecimal, playerId }) => {
    const cleanRoomId = (roomId || socket.roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room || room.status !== 'playing' || !room.rescueChallenge) return;

    if (!isSocketLeader(room, socket, playerId)) {
      return socket.emit('error_message', 'Apenas o Líder pode enviar a resposta do Desafio de Resgate.');
    }

    const currentLeader = room.players[room.leaderIndex];
    const expected = room.rescueChallenge.targetDecimal;
    const isCorrect = parseInt(guessedDecimal, 10) === expected;
    room.rescueUsed = true;
    room.rescueChallenge = null;

    if (isCorrect) {
      room.score = 150;
      room.roundLogs.push({
        leader: currentLeader.name,
        action: 'Desafio de Resgate (Sucesso +150 pts)',
        success: true,
      });
      io.to(room.id).emit('rescue_challenge_resolved', {
        success: true,
        message: 'Reinicialização Binária concluída! A equipe recuperou +150 pontos de emergência!',
        room: sanitizeRoomState(room),
      });
    } else {
      room.score = 0;
      room.roundLogs.push({
        leader: currentLeader.name,
        action: 'Desafio de Resgate (Falha -> Reserva de Emergência)',
        success: false,
      });
      io.to(room.id).emit('rescue_challenge_resolved', {
        success: false,
        message: `Código incorreto (o valor era ${expected}). A equipe entrou em Reserva de Emergência: recursos pagos bloqueados e o próximo erro encerra a partida!`,
        room: sanitizeRoomState(room),
      });
    }
  });

  // 8. Relatórios Docentes (Protegido por Senha)
  socket.on('admin_get_reports', ({ password }) => {
    if (password !== PROF_PASSWORD) {
      return socket.emit('admin_error', 'Senha incorreta.');
    }

    const activeRoomsData = Array.from(rooms.values()).map((r) => ({
      id: r.id,
      status: r.status,
      players: r.players.map((p) => p.name),
      score: r.score,
      round: r.currentCardIndex + 1,
      totalCards: r.cardsDeck.length,
      startedAt: r.startTime,
    }));

    socket.emit('admin_reports_data', {
      reports: gameReports,
      activeRooms: activeRoomsData,
      maxRooms: MAX_ROOMS,
    });
  });

  // 9. Resetar Sala pelo Professor
  socket.on('admin_reset_room', ({ password, roomId }) => {
    if (password !== PROF_PASSWORD) {
      return socket.emit('admin_error', 'Senha incorreta.');
    }

    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.players.forEach((p) => {
        if (p.disconnectTimer) clearTimeout(p.disconnectTimer);
      });
      io.to(roomId).emit('room_closed', 'A sala foi resetada pelo docente.');
      rooms.delete(roomId);
    }

    socket.emit('admin_room_reset_success', { roomId });
  });

  // Desconexão (Tolerância para oscilações temporárias de rede/Wi-Fi)
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Desconectado: ${socket.id}, motivo: ${reason}`);
    const roomId = socket.roomId;
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      const player = room.players.find(
        (p) => p.socketId === socket.id || (socket.playerId && p.id === socket.playerId)
      );

      if (player) {
        player.connected = false;
        player.disconnectedAt = Date.now();
        console.log(`[Socket] Conexão perdida com ${player.name} (${player.id}) na ${roomId}. Aguardando reconexão (tolerância 120s)...`);

        if (player.disconnectTimer) {
          clearTimeout(player.disconnectTimer);
        }

        // Não remove imediatamente! Concede 120 segundos para o aparelho reconectar
        player.disconnectTimer = setTimeout(() => {
          if (!rooms.has(roomId)) return;
          const currentRoom = rooms.get(roomId);
          const pIdx = currentRoom.players.findIndex((p) => p.id === player.id);
          if (pIdx !== -1 && !currentRoom.players[pIdx].connected) {
            console.log(`[Socket] Tolerância expirada para ${player.name} na ${roomId}. Removendo da sala.`);
            const removed = currentRoom.players.splice(pIdx, 1)[0];
            if (currentRoom.players.length === 0) {
              rooms.delete(roomId);
            } else {
              if (currentRoom.leaderIndex >= currentRoom.players.length) {
                currentRoom.leaderIndex = 0;
              }
              if (currentRoom.timelineProposal) {
                const allAccepted = currentRoom.players.every((p) => currentRoom.timelineProposal.votes[p.id] === true);
                if (allAccepted) {
                  executeActiveProposal(currentRoom);
                }
              }
              io.to(roomId).emit('player_left', {
                playerName: removed.name,
                room: sanitizeRoomState(currentRoom),
              });
            }
          }
        }, 120000);
      }
    }
  });
});

function sanitizeRoomState(room, forSocketOrPlayerId = null) {
  const currentLeader = room.players[room.leaderIndex] || null;
  const isLeader = forSocketOrPlayerId
    ? currentLeader && (
      currentLeader.id === forSocketOrPlayerId ||
      currentLeader.socketId === forSocketOrPlayerId
    )
    : false;

  return {
    id: room.id,
    status: room.status,
    phase: room.phase,
    score: room.score,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: !!p.isHost,
      connected: p.connected !== false,
    })),
    leaderIndex: room.leaderIndex,
    currentLeaderName: currentLeader ? currentLeader.name : null,
    isLeader,
    currentCardRound: room.currentCardRound,
    // Reveal full card details only if in timeline phase or finished
    currentCard:
      room.phase === 'timeline' || room.phase === 'finished'
        ? {
          id: room.currentCard.id,
          titulo: room.currentCard.titulo,
          ano_decimal: room.currentCard.ano_decimal,
          ano_binario: room.currentCard.ano_binario,
          resumo_historico: room.currentCard.resumo_historico,
          imagem_url: room.currentCard.imagem_url,
        }
        : null,
    selectedBinary: room.selectedBinary,
    roundAttempts: room.roundAttempts,
    revealedHints: room.revealedHints,
    promptThirdAttempt: room.promptThirdAttempt,
    timelineAttempts: room.timelineAttempts || 0,
    timelineHints: room.timelineHints || [],
    promptTimelineThirdAttempt: room.promptTimelineThirdAttempt || false,
    rescueUsed: !!room.rescueUsed,
    emergencyMode: room.score === 0 && !!room.rescueUsed,
    rescueChallenge: room.rescueChallenge
      ? { binaryCode: room.rescueChallenge.binaryCode }
      : null,
    timelineProposal: room.timelineProposal || null,
    timeline: room.timeline.map((card) => {
      if (!card.anoRevelado) {
        return {
          ...card,
          ano_decimal: null,
          anoRevelado: false,
        };
      }
      return {
        ...card,
        anoRevelado: true,
      };
    }),
    currentCardIndex: room.currentCardIndex,
    totalCards: Math.min(room.cardsDeck.length, 10),
  };
}

function generatePedagogicalReport(room, gameOver = false) {
  const totalRounds = room.timeline.length - 1; // excluindo carta central
  const binaryAccuracy = totalRounds > 0 ? Math.round((room.firstTryCorrectCount / totalRounds) * 100) : 100;
  const timelineAccuracy =
    totalRounds > 0 ? Math.max(0, Math.round(((totalRounds - room.timelineErrors) / totalRounds) * 100)) : 100;

  const startMs = room.startTime ? new Date(room.startTime).getTime() : Date.now();
  const endMs = room.endTime ? new Date(room.endTime).getTime() : Date.now();
  const durationMinutes = Math.max(1, Math.round((endMs - startMs) / 60000));

  return {
    id: `REP-${Date.now()}`,
    roomId: room.id,
    dataHora: new Date().toLocaleString('pt-BR'),
    duracaoMinutos: durationMinutes,
    participantes: room.players.map((p) => p.name),
    pontuacaoFinal: room.score,
    gameOver,
    habilidadesBNCC: {
      EM13CHS103: {
        nome: 'Argumentação Histórica e Cronologia',
        precisaoCronologica: `${timelineAccuracy}%`,
        errosOrdenacao: room.timelineErrors,
      },
      EM13CO13: {
        nome: 'Representação de Dados e Lógica Binária',
        precisaoDecodificacao: `${binaryAccuracy}%`,
        acertosPrimeiraTentativa: room.firstTryCorrectCount,
        dicasUtilizadas: room.totalHintsUsed,
      },
    },
    linhaDoTempoFinal: room.timeline.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      ano: c.ano_decimal,
      binario: c.ano_binario,
      imagem_url: c.imagem_url,
      colocadoPor: c.colocadoPor || 'Referência Inicial',
    })),
    logDetalhadoRodadas: room.roundLogs,
  };
}

// REST Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    appName: 'História em Bits - Servidor Local',
    activeRooms: rooms.size,
    maxRooms: MAX_ROOMS,
    deckSize: deckData ? deckData.cartas.length : 0,
  });
});

app.get('/api/reports', (req, res) => {
  const { password } = req.query;
  if (password !== PROF_PASSWORD) {
    return res.status(403).json({ error: 'Senha docente incorreta.' });
  }
  res.json({ reports: gameReports });
});

// Endpoint leve para descoberta automática (responde texto puro sem JSON)
app.get('/api/ping', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Content-Type', 'text/plain');
  res.send('HISTORIA_EM_BITS_OK');
});

server.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const ifaces = os.networkInterfaces();
  console.log(`===============================================`);
  console.log(`🎮 História em Bits — Servidor Socket.io Online`);
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🔐 Senha do Professor: ${PROF_PASSWORD}`);
  console.log(`⚡ Salas simultâneas permitidas: ${MAX_ROOMS}`);
  console.log(`-----------------------------------------------`);
  console.log(`📲 ENDEREÇOS PARA O APP (configure no celular):`);
  Object.entries(ifaces).forEach(([name, addrs]) => {
    (addrs || []).forEach((addr) => {
      if (addr.family === 'IPv4' && !addr.internal) {
        console.log(`   ✅ http://${addr.address}:${PORT}  [${name}]`);
      }
    });
  });
  console.log(`===============================================`);
});
