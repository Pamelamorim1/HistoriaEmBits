import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Colors } from '../theme/colors';

export default function LobbyScreen({
  room,
  currentUser,
  onStartGame,
  onLeaveRoom,
  onOpenGuide,
  onAddBot,
}) {
  const players = room?.players || [];
  const isHost = currentUser?.isHost || (players.length > 0 && players[0].id === currentUser?.id);
  const canStart = players.length >= 2;

  const handleLeavePress = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza de que deseja realmente sair desta sala?')) {
        onLeaveRoom();
      }
      return;
    }
    Alert.alert(
      'Sair da Sala',
      'Tem certeza de que deseja realmente sair desta sala?',
      [
        { text: 'Permanecer na Sala', style: 'cancel' },
        { text: 'Sim, Sair', style: 'destructive', onPress: onLeaveRoom },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Room Header */}
        <View style={styles.headerCard}>
          <View style={styles.livePlayersCounter}>
            <View style={styles.liveDot} />
            <Text style={styles.livePlayersText}>
              {players.length} {players.length === 1 ? 'PESSOA NA SALA' : 'PESSOAS NA SALA'}
            </Text>
          </View>

          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeText}>CÓDIGO DA SALA</Text>
            <Text style={styles.roomCode}>{room?.id || 'SALA-01'}</Text>
          </View>
          <Text style={styles.roomInstructions}>
            Informe este código aos colegas na sala de aula para entrarem pela rede Wi-Fi local.
          </Text>
          <View style={styles.capacityBadge}>
            <Text style={styles.capacityText}>
              👥 {players.length} {players.length === 1 ? 'pessoa conectada' : 'pessoas conectadas'} (Capacidade: 2 a 5)
            </Text>
          </View>
        </View>

        {/* Players List */}
        <View style={styles.playersCard}>
          <Text style={styles.sectionTitle}>Jogadores Conectados na Sala</Text>
          <View style={styles.playersList}>
            {players.map((p, index) => {
              const isYou = p.id === currentUser?.id;
              return (
                <View
                  key={p.id || index}
                  style={[styles.playerItem, isYou && styles.playerItemYou]}
                >
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>
                      {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                      {p.name} {isYou && <Text style={styles.youTag}>(Você)</Text>}
                    </Text>
                    <Text style={styles.playerStatus}>
                      {index === 0 ? '👑 Anfitrião / Primeiro Líder' : `Integrante ${index + 1}`}
                    </Text>
                  </View>
                  <View style={styles.readyIndicator}>
                    <Text style={styles.readyCheck}>✓ Pronto</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {players.length < 2 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Aguardando mais 1 participante entrar para liberar o início da partida.
              </Text>
            </View>
          )}
        </View>

        {/* Rules Reminder */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Regras de Cooperação:</Text>
          <Text style={styles.rulesText}>
            • A liderança rotacionará a cada rodada entre os participantes da sala.{'\n'}
            • O Líder escolhe o código e digita o ano, mas toda a equipe deve debater e calcular em conjunto!{'\n'}
            • Pontuação inicial: 1000 pontos. Cada erro desconta pontos e libera pistas históricas.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {isHost && players.length < 5 && onAddBot && (
            <TouchableOpacity style={styles.addBotBtn} onPress={onAddBot}>
              <Text style={styles.addBotBtnText}>
                🤖 Adicionar Colega Virtual para Teste (+1)
              </Text>
            </TouchableOpacity>
          )}

          {isHost ? (
            <TouchableOpacity
              style={[styles.startButton, !canStart && styles.disabledButton]}
              disabled={!canStart}
              onPress={onStartGame}
            >
              <Text style={styles.startButtonText}>
                🚀 Iniciar Partida Cooperativa
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.guestWaitBox}>
              <Text style={styles.guestWaitText}>
                Aguardando o Anfitrião iniciar a partida...
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.guideBtn} onPress={onOpenGuide}>
            <Text style={styles.guideBtnText}>📘 Revisar Tabela 2ⁿ Antes do Jogo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.leaveButton} onPress={handleLeavePress}>
            <Text style={styles.leaveButtonText}>Sair da Sala</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    marginBottom: 16,
  },
  livePlayersCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  livePlayersText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  roomBadge: {
    alignItems: 'center',
    marginBottom: 8,
  },
  roomBadgeText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  roomCode: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginTop: 2,
  },
  roomInstructions: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
  },
  capacityBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  capacityText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  playersCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  playersList: {
    gap: 10,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  playerItemYou: {
    borderColor: Colors.primary,
    backgroundColor: '#0F2338',
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playerAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  youTag: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'normal',
  },
  playerStatus: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  readyIndicator: {
    backgroundColor: Colors.successBg,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  readyCheck: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: Colors.warningBg,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    color: '#FEF3C7',
    fontSize: 12,
    textAlign: 'center',
  },
  rulesCard: {
    backgroundColor: '#1E1B4B',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4338CA',
    marginBottom: 20,
  },
  rulesTitle: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rulesText: {
    color: '#E0E7FF',
    fontSize: 11,
    lineHeight: 16,
  },
  actionRow: {
    gap: 10,
  },
  addBotBtn: {
    backgroundColor: '#1E1B4B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  addBotBtnText: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: Colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#374151',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  guestWaitBox: {
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  guestWaitText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  guideBtn: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  guideBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: Colors.danger,
    fontSize: 13,
  },
});
