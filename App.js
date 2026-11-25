import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, StatusBar, Alert, Platform, SafeAreaView, BackHandler } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Colors } from './src/theme/colors';

import HomeScreen from './src/screens/HomeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import GameScreen from './src/screens/GameScreen';
import VictoryScreen from './src/screens/VictoryScreen';
import TeacherScreen from './src/screens/TeacherScreen';
import BinaryGuideModal from './src/components/BinaryGuideModal';

import socketService, { getDefaultServerUrl } from './src/services/socketService';
import { LocalGameEngine } from './src/services/localGameService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'lobby' | 'game' | 'victory' | 'teacher'
  const [gameMode, setGameMode] = useState('wifi'); // 'wifi' | 'local'
  const [serverUrl, setServerUrl] = useState(getDefaultServerUrl());
  const [currentUser, setCurrentUser] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [finalReport, setFinalReport] = useState(null);
  const [localReports, setLocalReports] = useState([]);
  const [verificationFeedback, setVerificationFeedback] = useState(null);
  const [timelineFeedback, setTimelineFeedback] = useState(null);
  const [homeGuideVisible, setHomeGuideVisible] = useState(false);

  const localEngineRef = useRef(null);

  // Inscrever-se nos eventos do Socket.io
  useEffect(() => {
    const unsubRoomCreated = socketService.subscribe('room_created', ({ roomId, player, room }) => {
      setCurrentUser(player);
      setRoomState(room);
      setCurrentScreen('lobby');
    });

    const unsubRoomJoined = socketService.subscribe('room_joined', ({ roomId, player, room }) => {
      setCurrentUser(player);
      setRoomState(room);
      setCurrentScreen('lobby');
    });

    const unsubRoomUpdated = socketService.subscribe('room_updated', (room) => {
      setRoomState(room);
    });

    const unsubGameStarted = socketService.subscribe('game_started', (room) => {
      setRoomState(room);
      setVerificationFeedback(null);
      setTimelineFeedback(null);
      setCurrentScreen('game');
    });

    const unsubBinarySelected = socketService.subscribe('binary_selected', ({ selectedBinary }) => {
      setRoomState((prev) => (prev ? { ...prev, selectedBinary } : prev));
    });

    const unsubYearVerified = socketService.subscribe('year_verified', (data) => {
      setVerificationFeedback({
        success: data.success,
        message: data.message,
        penalty: data.penalty,
        pointsEarned: data.pointsEarned,
      });
      if (data.room) {
        setRoomState(data.room);
      }
      setTimeout(() => {
        setVerificationFeedback(null);
      }, 4000);
    });

    const unsubThirdResolved = socketService.subscribe('third_attempt_resolved', (data) => {
      if (data.room) {
        setRoomState(data.room);
      }
      Alert.alert('Decisão da Equipe', data.message);
    });

    const unsubTimelinePlaced = socketService.subscribe('timeline_placed', (data) => {
      if (data.success) {
        setTimelineFeedback(null);
        if (data.room) setRoomState(data.room);
      } else {
        setTimelineFeedback(data.message);
        if (data.room) setRoomState(data.room);
      }
    });

    const unsubTimelineThirdResolved = socketService.subscribe('timeline_third_attempt_resolved', (data) => {
      if (data.room) {
        setRoomState(data.room);
      }
      if (data.action === 'continue') {
        Alert.alert('Decisão da Equipe', data.message);
      }
    });

    const unsubTimelineProposal = socketService.subscribe('timeline_proposal_updated', (data) => {
      if (data.room) setRoomState(data.room);
      else if (data.proposal) setRoomState((prev) => (prev ? { ...prev, timelineProposal: data.proposal } : prev));
    });

    const unsubTimelineProposalRejected = socketService.subscribe('timeline_proposal_rejected', (data) => {
      Alert.alert('Consenso Não Atingido', data.message);
      if (data.room) setRoomState(data.room);
      else setRoomState((prev) => (prev ? { ...prev, timelineProposal: null } : prev));
    });

    const unsubTimelineProposalCancelled = socketService.subscribe('timeline_proposal_cancelled', (data) => {
      if (data.room) setRoomState(data.room);
      else setRoomState((prev) => (prev ? { ...prev, timelineProposal: null } : prev));
    });

    const unsubCentralYearRevealed = socketService.subscribe('central_year_revealed', (data) => {
      Alert.alert('Ano Revelado', data.message);
      if (data.room) setRoomState(data.room);
    });

    const unsubRescueResolved = socketService.subscribe('rescue_challenge_resolved', (data) => {
      Alert.alert(data.success ? 'Sistema Reiniciado!' : 'Reserva de Emergência', data.message);
      if (data.room) setRoomState(data.room);
    });

    const unsubGameFinished = socketService.subscribe('game_finished', ({ report, room }) => {
      setFinalReport(report);
      setLocalReports((prev) => [report, ...prev]);
      if (room) setRoomState(room);
      setCurrentScreen('victory');
    });

    const unsubPlayerLeft = socketService.subscribe('player_left', ({ playerName, room }) => {
      Alert.alert('Aviso', `${playerName} saiu da sala.`);
      if (room) setRoomState(room);
    });

    const unsubRoomClosed = socketService.subscribe('room_closed', (msg) => {
      Alert.alert('Sala Encerrada', msg);
      setCurrentScreen('home');
      setRoomState(null);
    });

    const unsubError = socketService.subscribe('error_message', (msg) => {
      Alert.alert('Atenção', msg);
    });

    return () => {
      unsubRoomCreated();
      unsubRoomJoined();
      unsubRoomUpdated();
      unsubGameStarted();
      unsubBinarySelected();
      unsubYearVerified();
      unsubThirdResolved();
      unsubTimelinePlaced();
      unsubTimelineThirdResolved();
      unsubTimelineProposal();
      unsubTimelineProposalRejected();
      unsubTimelineProposalCancelled();
      unsubCentralYearRevealed();
      unsubRescueResolved();
      unsubGameFinished();
      unsubPlayerLeft();
      unsubRoomClosed();
      unsubError();
    };
  }, []);

  // Handlers para Wi-Fi Multiplayer
  const handleCreateWifiRoom = (name) => {
    setCurrentUser({ name });
    setGameMode('wifi');
    socketService.connect(serverUrl);
    socketService.createRoom(name);
  };

  const handleJoinWifiRoom = (roomId, name) => {
    setCurrentUser({ name });
    setGameMode('wifi');
    socketService.connect(serverUrl);
    socketService.joinRoom(roomId, name);
  };

  const handleStartGameWifi = () => {
    if (roomState?.id) {
      socketService.startGame(roomState.id);
    }
  };

  const handleSelectBinary = (binaryCode) => {
    if (gameMode === 'wifi') {
      socketService.selectBinary(roomState.id, binaryCode);
    } else if (localEngineRef.current) {
      localEngineRef.current.selectBinary(binaryCode);
    }
  };

  const handleSubmitYear = (binaryCode, year) => {
    if (gameMode === 'wifi') {
      socketService.submitYear(roomState.id, binaryCode, year);
    } else if (localEngineRef.current) {
      localEngineRef.current.submitYear(binaryCode, year);
    }
  };

  const handleResolveThirdAttempt = (action) => {
    if (gameMode === 'wifi') {
      socketService.resolveThirdAttempt(roomState.id, action);
    } else if (localEngineRef.current) {
      localEngineRef.current.resolveThirdAttempt(action);
    }
  };

  const handleResolveTimelineThirdAttempt = (action) => {
    if (gameMode === 'wifi') {
      socketService.resolveTimelineThirdAttempt(roomState.id, action);
    } else if (localEngineRef.current) {
      localEngineRef.current.resolveTimelineThirdAttempt(action);
    }
  };

  const handlePlaceCardTimeline = (insertIndex) => {
    if (gameMode === 'wifi') {
      socketService.placeCardTimeline(roomState.id, insertIndex);
    } else if (localEngineRef.current) {
      localEngineRef.current.proposeTimelinePlacement(insertIndex);
    }
  };

  const handleVoteProposal = (accept) => {
    if (gameMode === 'wifi') {
      socketService.voteTimelineProposal(roomState.id, accept);
    } else if (localEngineRef.current) {
      if (accept) {
        localEngineRef.current.confirmTimelinePlacement();
      } else {
        localEngineRef.current.cancelTimelineProposal();
      }
    }
  };

  const handleCancelProposal = () => {
    if (gameMode === 'wifi') {
      socketService.cancelTimelineProposal(roomState.id);
    } else if (localEngineRef.current) {
      localEngineRef.current.cancelTimelineProposal();
    }
  };

  const handleRevealCentralYear = (cardId = null) => {
    if (gameMode === 'wifi') {
      socketService.revealCentralYear(roomState.id, cardId);
    } else if (localEngineRef.current) {
      localEngineRef.current.revealCentralYear(cardId);
    }
  };

  const handleSubmitRescueChallenge = (guessedDecimal) => {
    if (gameMode === 'wifi') {
      socketService.submitRescueChallenge(roomState.id, guessedDecimal);
    } else if (localEngineRef.current) {
      localEngineRef.current.submitRescueChallenge(guessedDecimal);
    }
  };

  const handleLeaveRoom = () => {
    if (gameMode === 'wifi') {
      socketService.disconnect();
    }
    setRoomState(null);
    setCurrentScreen('home');
  };

  // Interceptar botão Voltar do Android quando estiver dentro de uma sala (lobby ou jogo)
  useEffect(() => {
    if (currentScreen !== 'lobby' && currentScreen !== 'game') return;

    const backAction = () => {
      const title = currentScreen === 'lobby' ? 'Sair da Sala' : 'Sair da Partida';
      const message =
        currentScreen === 'lobby'
          ? 'Tem certeza de que deseja realmente sair desta sala?'
          : 'Tem certeza de que deseja realmente sair da partida atual?';

      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, Sair', style: 'destructive', onPress: handleLeaveRoom },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentScreen, gameMode]);

  // Handlers para Modo Local
  const handleStartLocalGame = (teamName) => {
    setGameMode('local');
    const playersList = Array.isArray(teamName) ? teamName : [teamName];
    const engine = new LocalGameEngine(playersList);
    localEngineRef.current = engine;

    engine.subscribe((newState, event) => {
      setRoomState(newState);

      if (event) {
        if (event.type === 'year_verified') {
          setVerificationFeedback({
            success: event.success,
            message: event.message,
            penalty: event.penalty,
            pointsEarned: event.pointsEarned,
          });
          setTimeout(() => setVerificationFeedback(null), 4000);
        } else if (event.type === 'timeline_placed') {
          if (!event.success) {
            setTimelineFeedback(event.message);
          } else {
            setTimelineFeedback(null);
          }
        } else if (event.type === 'third_attempt_resolved') {
          Alert.alert('Decisão Registrada', event.message);
        } else if (event.type === 'timeline_third_attempt_resolved') {
          if (event.action === 'continue') {
            Alert.alert('Decisão Registrada', event.message);
          }
        } else if (event.type === 'central_year_revealed') {
          Alert.alert('Ano Revelado', event.message);
        } else if (event.type === 'rescue_challenge_resolved') {
          Alert.alert(event.success ? 'Sistema Reiniciado!' : 'Reserva de Emergência', event.message);
        } else if (event.type === 'game_finished') {
          setFinalReport(event.report);
          setLocalReports((prev) => [event.report, ...prev]);
          setCurrentScreen('victory');
        }
      }
    });

    setRoomState(engine.getState());
    setCurrentUser({ id: 'local-p-0', name: teamName, isHost: true });
    setVerificationFeedback(null);
    setTimelineFeedback(null);
    setCurrentScreen('game');
  };

  // Determinar se o usuário atual é o Líder da rodada
  const isLeader =
    gameMode === 'local'
      ? true
      : roomState && currentUser
      ? roomState.players &&
        roomState.players[roomState.leaderIndex] &&
        roomState.players[roomState.leaderIndex].id === currentUser.id
      : false;

  const currentLeaderName =
    roomState?.players && roomState?.players[roomState.leaderIndex]
      ? roomState.players[roomState.leaderIndex].name
      : 'Equipe';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#020617" />
      <View style={styles.appContainer}>
        {currentScreen === 'home' && (
        <HomeScreen
          onStartLocalGame={handleStartLocalGame}
          onCreateWifiRoom={handleCreateWifiRoom}
          onJoinWifiRoom={handleJoinWifiRoom}
          onOpenTeacherArea={() => setCurrentScreen('teacher')}
          onOpenGuide={() => setHomeGuideVisible(true)}
          serverUrl={serverUrl}
          onUpdateServerUrl={(newUrl) => {
            setServerUrl(newUrl);
            socketService.setServerUrl(newUrl);
          }}
        />
      )}

      {currentScreen === 'lobby' && (
        <LobbyScreen
          room={roomState}
          currentUser={currentUser}
          onStartGame={handleStartGameWifi}
          onLeaveRoom={handleLeaveRoom}
          onOpenGuide={() => setHomeGuideVisible(true)}
          onAddBot={() => socketService.addBot(roomState?.id)}
        />
      )}

      {currentScreen === 'game' && (
        <GameScreen
          roomState={roomState}
          isLeader={isLeader}
          currentLeaderName={currentLeaderName}
          currentUser={currentUser}
          isLocalMode={gameMode === 'local'}
          onSelectBinary={handleSelectBinary}
          onSubmitYear={handleSubmitYear}
          onResolveThirdAttempt={handleResolveThirdAttempt}
          onResolveTimelineThirdAttempt={handleResolveTimelineThirdAttempt}
          onPlaceCardTimeline={handlePlaceCardTimeline}
          onVoteProposal={handleVoteProposal}
          onCancelProposal={handleCancelProposal}
          onRevealCentralYear={handleRevealCentralYear}
          onSubmitRescueChallenge={handleSubmitRescueChallenge}
          onExitGame={handleLeaveRoom}
          verificationFeedback={verificationFeedback}
          timelineFeedback={timelineFeedback}
        />
      )}

      {currentScreen === 'victory' && (
        <VictoryScreen
          report={finalReport}
          onRestart={() => setCurrentScreen('home')}
          onOpenTeacherArea={() => setCurrentScreen('teacher')}
        />
      )}

      {currentScreen === 'teacher' && (
        <TeacherScreen
          onClose={() => setCurrentScreen('home')}
          localReports={localReports}
        />
      )}

      <BinaryGuideModal
        visible={homeGuideVisible}
        onClose={() => setHomeGuideVisible(false)}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  appContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
  },
});
