import deckData from '../data/cards.json';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class LocalGameEngine {
  constructor(playerNames = ['Jogador 1'], totalCards = 10, isIndividual = false) {
    this.players = playerNames.map((name, index) => ({
      id: `local-p-${index}`,
      name,
      isHost: index === 0,
    }));
    this.leaderIndex = 0;
    this.isIndividual = !!isIndividual;
    const centralCard = {
      ...deckData.carta_central_inicial,
      posicaoFixa: true,
      anoRevelado: false,
    };

    this.score = 1000;
    this.startTime = new Date().toISOString();
    this.endTime = null;
    this.cardsDeck = shuffle(deckData.cartas);
    this.totalCardsCount = Math.max(1, Math.min(this.cardsDeck.length, totalCards || 10));
    this.currentCardIndex = 0;
    this.currentCard = this.cardsDeck[0];
    this.timeline = [centralCard];
    this.timelineProposal = null;
    this.selectedBinary = null;
    this.roundAttempts = 0;
    this.revealedHints = [];
    this.promptThirdAttempt = false;
    this.timelineAttempts = 0;
    this.timelineHints = [];
    this.promptTimelineThirdAttempt = false;
    this.rescueUsed = false;
    this.rescueChallenge = null;
    this.phase = 'decoding'; // 'decoding' | 'timeline' | 'finished'
    this.roundLogs = [];
    this.firstTryCorrectCount = 0;
    this.totalHintsUsed = 0;
    this.timelineErrors = 0;

    this.listeners = new Set();
  }

  getState() {
    const currentLeader = this.players[this.leaderIndex];
    const distractors = this.currentCard && Array.isArray(this.currentCard.distratores_binarios)
      ? this.currentCard.distratores_binarios
      : [];
    const binaryOptions = this.currentCard
      ? shuffle([this.currentCard.ano_binario, ...distractors])
      : [];

    return {
      id: this.isIndividual ? 'MODO-INDIVIDUAL' : 'SALA-LOCAL',
      status: this.phase === 'finished' ? 'finished' : 'playing',
      phase: this.phase,
      score: this.score,
      players: this.players,
      leaderIndex: this.leaderIndex,
      currentLeaderName: currentLeader ? currentLeader.name : (this.isIndividual ? 'Jogador' : 'Equipe'),
      isLeader: true, // No modo local compartilhado, o aparelho atual é do líder da vez
      isIndividual: this.isIndividual,
      currentCardRound: this.currentCard
        ? {
            id: this.currentCard.id,
            titulo: this.currentCard.titulo,
            resumo_historico: this.currentCard.resumo_historico,
            imagem_url: this.currentCard.imagem_url,
            binaryOptions: this._cachedOptions || (this._cachedOptions = binaryOptions),
          }
        : null,
      currentCard:
        this.phase === 'timeline' || this.phase === 'finished'
          ? {
              id: this.currentCard.id,
              titulo: this.currentCard.titulo,
              ano_decimal: this.currentCard.ano_decimal,
              ano_binario: this.currentCard.ano_binario,
              resumo_historico: this.currentCard.resumo_historico,
              imagem_url: this.currentCard.imagem_url,
            }
          : null,
      selectedBinary: this.selectedBinary,
      roundAttempts: this.roundAttempts,
      revealedHints: this.revealedHints,
      promptThirdAttempt: this.promptThirdAttempt,
      timelineAttempts: this.timelineAttempts,
      timelineHints: this.timelineHints,
      promptTimelineThirdAttempt: this.promptTimelineThirdAttempt,
      rescueUsed: this.rescueUsed,
      emergencyMode: this.score === 0 && this.rescueUsed,
      rescueChallenge: this.rescueChallenge
        ? { binaryCode: this.rescueChallenge.binaryCode }
        : null,
      timelineProposal: this.timelineProposal,
      timeline: this.timeline.map((card) => {
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
      currentCardIndex: this.currentCardIndex,
      totalCards: this.totalCardsCount,
    };
  }

  selectBinary(binaryString) {
    this.selectedBinary = binaryString;
    this.notify();
  }

  submitYear(binaryString, guessedYear) {
    const card = this.currentCard;
    const yearNumber = parseInt(guessedYear, 10);
    const isBinaryCorrect = binaryString === card.ano_binario;
    const isYearCorrect = yearNumber === card.ano_decimal;
    const attemptNum = this.roundAttempts + 1;
    this.roundAttempts = attemptNum;
    const currentLeader = this.players[this.leaderIndex];

    if (isBinaryCorrect && isYearCorrect) {
      if (attemptNum === 1) {
        this.firstTryCorrectCount += 1;
      }
      const pointsEarned = attemptNum === 1 ? 100 : attemptNum === 2 ? 50 : 25;
      this.score += pointsEarned;

      this.roundLogs.push({
        leader: currentLeader.name,
        cardId: card.id,
        cardTitle: card.titulo,
        attempt: attemptNum,
        success: true,
        pointsEarned,
        selectedBinary: binaryString,
        guessedYear: yearNumber,
        revealedAssisted: false,
        hintsUsed: this.revealedHints.length,
      });

      this.phase = 'timeline';
      this.promptThirdAttempt = false;
      this.notify({
        type: 'year_verified',
        success: true,
        pointsEarned,
        message: `Ano decodificado com sucesso! (+${pointsEarned} pontos) Agora definam a posição na Linha do Tempo.`,
      });
    } else {
      const wasAlreadyZero = this.score === 0;
      let penalty = attemptNum > 3 ? 25 : 50;
      this.score = Math.max(0, this.score - penalty);

      let newHint = null;
      let promptDecision = false;

      if (attemptNum === 1) {
        newHint = { nivel: 1, tipo: 'Contexto Histórico / Século', texto: card.dicas.dica_1_contexto };
        this.revealedHints.push(newHint);
        this.totalHintsUsed += 1;
      } else if (attemptNum === 2) {
        newHint = { nivel: 2, tipo: 'Pista Matemática / Eliminação', texto: card.dicas.dica_2_matematica };
        this.revealedHints.push(newHint);
        this.totalHintsUsed += 1;
      } else if (attemptNum === 3) {
        newHint = { nivel: 3, tipo: 'Pista Específica Final', texto: card.dicas.dica_3_especifica };
        this.revealedHints.push(newHint);
        this.totalHintsUsed += 1;
        promptDecision = true;
        this.promptThirdAttempt = true;
      }

      this.roundLogs.push({
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

      const zeroState = this.handleZeroScoreTransition(wasAlreadyZero);
      if (zeroState === 'game_over') return;

      this.notify({
        type: 'year_verified',
        success: false,
        message: isBinaryCorrect
          ? 'Código binário correto, mas cálculo decimal incorreto! Verifique a conversão.'
          : 'Código binário incorreto ou ano incompatível com o evento histórico.',
        penalty,
        attempts: this.roundAttempts,
        hints: this.revealedHints,
        promptThirdAttempt: promptDecision,
      });
    }
  }

  resolveThirdAttempt(action) {
    if (action === 'continue') {
      this.promptThirdAttempt = false;
      this.notify({
        type: 'third_attempt_resolved',
        action: 'continue',
        message: 'Continuando com as 3 dicas! Próximos erros: -25 pts.',
      });
    } else if (action === 'reveal') {
      if (this.score < 150) return;
      const card = this.currentCard;
      const currentLeader = this.players[this.leaderIndex];
      this.score = Math.max(0, this.score - 150);
      this.promptThirdAttempt = false;
      this.phase = 'timeline';

      this.roundLogs.push({
        leader: currentLeader.name,
        cardId: card.id,
        cardTitle: card.titulo,
        action: 'Revelação Assistida (-150 pts)',
        revealedAssisted: true,
      });

      this.handleZeroScoreTransition(false);

      this.notify({
        type: 'third_attempt_resolved',
        action: 'reveal',
        message: 'Revelação Assistida (-150 pts). O ano foi liberado para posicionamento.',
      });
    }
  }

  handleZeroScoreTransition(wasAlreadyZero) {
    if (this.score > 0) return 'none';
    if (!this.rescueUsed && !this.rescueChallenge) {
      const targetDecimal = Math.floor(Math.random() * 231) + 20;
      this.rescueChallenge = {
        binaryCode: targetDecimal.toString(2).padStart(8, '0'),
        targetDecimal,
      };
      return 'rescue_triggered';
    }
    if (wasAlreadyZero && this.rescueUsed) {
      this.phase = 'finished';
      this.endTime = new Date().toISOString();
      const report = this.generateReport(true);
      this.notify({
        type: 'game_finished',
        report,
      });
      return 'game_over';
    }
    return 'emergency_mode';
  }

  submitRescueChallenge(guessedDecimal) {
    if (!this.rescueChallenge) return;
    const expected = this.rescueChallenge.targetDecimal;
    const isCorrect = parseInt(guessedDecimal, 10) === expected;
    const currentLeader = this.players[this.leaderIndex];
    this.rescueUsed = true;
    this.rescueChallenge = null;

    if (isCorrect) {
      this.score = 150;
      this.roundLogs.push({
        leader: currentLeader.name,
        action: 'Desafio de Resgate (Sucesso +150 pts)',
        success: true,
      });
      this.notify({
        type: 'rescue_challenge_resolved',
        success: true,
        message: 'Reinicialização Binária concluída! A equipe recuperou +150 pontos de emergência!',
      });
    } else {
      this.score = 0;
      this.roundLogs.push({
        leader: currentLeader.name,
        action: 'Desafio de Resgate (Falha -> Reserva de Emergência)',
        success: false,
      });
      this.notify({
        type: 'rescue_challenge_resolved',
        success: false,
        message: `Código incorreto (era ${expected}). A equipe entrou em Reserva de Emergência: recursos pagos bloqueados e o próximo erro encerra a partida!`,
      });
    }
  }

  revealCentralYear(cardId = null) {
    if (this.score < 50) return;
    const targetCard = cardId
      ? this.timeline.find((c) => c.id === cardId)
      : this.timeline.find((c) => c.posicaoFixa);
    if (targetCard && !targetCard.anoRevelado) {
      this.score = Math.max(0, this.score - 50);
      targetCard.anoRevelado = true;
      this.handleZeroScoreTransition(false);
      this.notify({
        type: 'central_year_revealed',
        message: `Ano de "${targetCard.titulo}" (${targetCard.ano_decimal}) revelado! (-50 pontos da equipe)`,
      });
    }
  }

  proposeYearVerification(binaryString, guessedYear) {
    if (this.isIndividual) {
      return this.submitYear(binaryString, guessedYear);
    }
    const currentLeader = this.players[this.leaderIndex];
    this.timelineProposal = {
      type: 'year_verification',
      binaryString,
      guessedYear,
      proposerName: currentLeader.name,
      cardTitle: this.currentCard?.titulo,
      cardYear: guessedYear,
      votes: { 'local-team': true },
    };
    this.notify({
      type: 'timeline_proposal_updated',
      proposal: this.timelineProposal,
    });
  }

  proposeTimelinePlacement(insertIndex) {
    if (this.isIndividual) {
      return this.placeCardTimeline(insertIndex);
    }
    const currentLeader = this.players[this.leaderIndex];

    let positionDescription = `Ponto #${insertIndex}`;
    const timeline = this.timeline;
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

    this.timelineProposal = {
      type: 'timeline',
      insertIndex,
      positionDescription,
      proposerName: currentLeader.name,
      cardTitle: this.currentCard?.titulo,
      cardYear: this.currentCard?.ano_decimal,
      votes: { 'local-team': true },
    };
    this.notify({
      type: 'timeline_proposal_updated',
      proposal: this.timelineProposal,
    });
  }

  cancelTimelineProposal() {
    this.timelineProposal = null;
    this.notify({
      type: 'timeline_proposal_cancelled',
    });
  }

  confirmProposal() {
    if (!this.timelineProposal) return;
    const proposal = this.timelineProposal;
    this.timelineProposal = null;
    if (proposal.type === 'year_verification') {
      this.submitYear(proposal.binaryString, proposal.guessedYear);
    } else {
      this.placeCardTimeline(proposal.insertIndex);
    }
  }

  confirmTimelinePlacement() {
    this.confirmProposal();
  }

  findCorrectTimelineIndex(year) {
    for (let i = 0; i < this.timeline.length; i++) {
      if (year <= this.timeline[i].ano_decimal) return i;
    }
    return this.timeline.length;
  }

  advanceTimelineRound(successMessage) {
    const nextIndex = this.currentCardIndex + 1;
    const totalCards = this.totalCardsCount;

    // Na próxima escolha de posição, todas as cartas voltam a ter o ano decimal oculto
    this.timeline.forEach((c) => {
      c.anoRevelado = false;
    });

    if (nextIndex >= totalCards) {
      this.phase = 'finished';
      this.endTime = new Date().toISOString();
      const report = this.generateReport();
      this.notify({
        type: 'game_finished',
        report,
      });
    } else {
      this.currentCardIndex = nextIndex;
      this.currentCard = this.cardsDeck[nextIndex];
      this._cachedOptions = null;
      this.leaderIndex = (this.leaderIndex + 1) % this.players.length;
      this.selectedBinary = null;
      this.roundAttempts = 0;
      this.revealedHints = [];
      this.promptThirdAttempt = false;
      this.timelineAttempts = 0;
      this.timelineHints = [];
      this.promptTimelineThirdAttempt = false;
      this.phase = 'decoding';

      const nextLeader = this.players[this.leaderIndex];

      this.notify({
        type: 'timeline_placed',
        success: true,
        message: successMessage,
        nextLeaderName: nextLeader ? nextLeader.name : null,
      });
    }
  }

  resolveTimelineThirdAttempt(action) {
    if (action === 'continue') {
      this.promptTimelineThirdAttempt = false;
      this.notify({
        type: 'timeline_third_attempt_resolved',
        action: 'continue',
        message: 'Continuando com as 2 dicas! Próximos erros de posição descontarão -25 pts.',
      });
    } else if (action === 'reveal') {
      if (this.score < 150) return;
      const card = this.currentCard;
      const currentLeader = this.players[this.leaderIndex];
      this.score = Math.max(0, this.score - 150);
      this.promptTimelineThirdAttempt = false;

      const correctIndex = this.findCorrectTimelineIndex(card.ano_decimal);
      this.timeline.splice(correctIndex, 0, {
        id: card.id,
        titulo: card.titulo,
        ano_decimal: card.ano_decimal,
        ano_binario: card.ano_binario,
        resumo_historico: card.resumo_historico,
        imagem_url: card.imagem_url,
        colocadoPor: `${currentLeader.name} (Assistido)`,
        anoRevelado: false,
      });

      this.roundLogs.push({
        leader: currentLeader.name,
        cardId: card.id,
        cardTitle: card.titulo,
        action: 'Posicionamento Assistido (-150 pts)',
        insertIndex: correctIndex,
        revealedAssisted: true,
      });

      this.notify({
        type: 'timeline_third_attempt_resolved',
        action: 'reveal',
        message: `Posicionamento Assistido (-150 pts). A carta foi inserida na posição correta (#${correctIndex}).`,
      });
      this.advanceTimelineRound('Carta posicionada por Revelação Assistida (-150 pts).');
    }
  }

  placeCardTimeline(insertIndex) {
    const card = this.currentCard;
    const year = card.ano_decimal;
    const timeline = this.timeline;
    const currentLeader = this.players[this.leaderIndex];

    const prevCard = insertIndex > 0 ? timeline[insertIndex - 1] : null;
    const nextCard = insertIndex < timeline.length ? timeline[insertIndex] : null;

    const isValidBefore = !prevCard || prevCard.ano_decimal <= year;
    const isValidAfter = !nextCard || year <= nextCard.ano_decimal;

    if (isValidBefore && isValidAfter) {
      const placed = {
        id: card.id,
        titulo: card.titulo,
        ano_decimal: card.ano_decimal,
        ano_binario: card.ano_binario,
        resumo_historico: card.resumo_historico,
        imagem_url: card.imagem_url,
        colocadoPor: currentLeader.name,
        anoRevelado: false,
      };

      timeline.splice(insertIndex, 0, placed);

      this.roundLogs.push({
        leader: currentLeader.name,
        action: 'Posicionamento Linha do Tempo',
        success: true,
        insertIndex,
      });

      const nextLeaderIndex = (this.leaderIndex + 1) % this.players.length;
      this.advanceTimelineRound(
        `Carta posicionada com precisão! Agora a liderança passou para ${this.players[nextLeaderIndex].name}.`
      );
    } else {
      const wasAlreadyZero = this.score === 0;
      const attemptNum = this.timelineAttempts + 1;
      this.timelineAttempts = attemptNum;
      this.timelineErrors += 1;

      const penalty = attemptNum === 1 ? 25 : attemptNum === 2 ? 50 : attemptNum === 3 ? 50 : 25;
      this.score = Math.max(0, this.score - penalty);

      const correctIndex = this.findCorrectTimelineIndex(year);
      let newHint = null;
      let promptDecision = false;

      if (attemptNum === 1) {
        const directionText =
          insertIndex < correctIndex
            ? `O evento (${year}) aconteceu DEPOIS do ponto #${insertIndex} escolhido. Tentem mover mais para a DIREITA!`
            : `O evento (${year}) aconteceu ANTES do ponto #${insertIndex} escolhido. Tentem mover mais para a ESQUERDA!`;
        newHint = { nivel: 1, tipo: 'Direção Cronológica', texto: directionText };
        this.timelineHints.push(newHint);
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
        this.timelineHints.push(newHint);
      } else if (attemptNum === 3) {
        promptDecision = true;
        this.promptTimelineThirdAttempt = true;
      }

      this.roundLogs.push({
        leader: currentLeader.name,
        action: 'Erro de Posicionamento Linha do Tempo',
        success: false,
        attempt: attemptNum,
        insertIndex,
        penalty,
        hintRevealed: newHint ? newHint.tipo : null,
      });

      const zeroState = this.handleZeroScoreTransition(wasAlreadyZero);
      if (zeroState === 'game_over') return;

      this.notify({
        type: 'timeline_placed',
        success: false,
        message: `Posição incorreta para o ano ${year} (-${penalty} pts). ${newHint ? newHint.texto : 'Comparem com as cartas vizinhas e tentem novamente.'}`,
        penalty,
        timelineAttempts: this.timelineAttempts,
        timelineHints: this.timelineHints,
        promptTimelineThirdAttempt: promptDecision,
      });
    }
  }

  generateReport(gameOver = false) {
    const totalRounds = this.timeline.length - 1;
    const binaryAccuracy = totalRounds > 0 ? Math.round((this.firstTryCorrectCount / totalRounds) * 100) : 100;
    const timelineAccuracy =
      totalRounds > 0 ? Math.max(0, Math.round(((totalRounds - this.timelineErrors) / totalRounds) * 100)) : 100;

    const startMs = this.startTime ? new Date(this.startTime).getTime() : Date.now();
    const endMs = this.endTime ? new Date(this.endTime).getTime() : Date.now();
    const durationMinutes = Math.max(1, Math.round((endMs - startMs) / 60000));

    return {
      id: `LOCAL-${Date.now()}`,
      roomId: 'SALA-LOCAL',
      dataHora: new Date().toLocaleString('pt-BR'),
      duracaoMinutos: durationMinutes,
      participantes: this.players.map((p) => p.name),
      pontuacaoFinal: this.score,
      gameOver,
      habilidadesBNCC: {
        EM13CHS103: {
          nome: 'Argumentação Histórica e Cronologia',
          precisaoCronologica: `${timelineAccuracy}%`,
          errosOrdenacao: this.timelineErrors,
        },
        EM13CO13: {
          nome: 'Representação de Dados e Lógica Binária',
          precisaoDecodificacao: `${binaryAccuracy}%`,
          acertosPrimeiraTentativa: this.firstTryCorrectCount,
          dicasUtilizadas: this.totalHintsUsed,
        },
      },
      linhaDoTempoFinal: this.timeline.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        ano: c.ano_decimal,
        binario: c.ano_binario,
        imagem_url: c.imagem_url,
        colocadoPor: c.colocadoPor || 'Referência Inicial',
      })),
      logDetalhadoRodadas: this.roundLogs,
    };
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(eventPayload = null) {
    const state = this.getState();
    this.listeners.forEach((cb) => cb(state, eventPayload));
  }
}
