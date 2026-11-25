import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Colors } from '../theme/colors';

export default function Header({
  score,
  currentRound,
  totalRounds,
  isLeader,
  currentLeaderName,
  onOpenGuide,
  onExitGame,
  roomId,
  playersCount = 1,
}) {
  const handleExit = () => {
    if (!onExitGame) return;
    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza de que deseja realmente sair da partida atual?')) {
        onExitGame();
      }
      return;
    }
    Alert.alert(
      'Sair da Partida',
      'Tem certeza de que deseja realmente sair da partida atual?',
      [
        { text: 'Continuar Jogando', style: 'cancel' },
        { text: 'Sim, Sair', style: 'destructive', onPress: onExitGame },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with Room, Score, Players and Guide Button */}
      <View style={styles.topRow}>
        <View style={styles.roomBadge}>
          <Text style={styles.roomText}>{roomId || 'MESA LOCAL'}</Text>
          <Text style={styles.playersBadgeText}>
            👥 {playersCount} {playersCount === 1 ? 'jogador' : 'jogadores'}
          </Text>
          <Text style={styles.roundText}>
            Carta {currentRound} de {totalRounds}
          </Text>
        </View>

        <View style={styles.scoreBadge}>
          <Text style={styles.scoreLabel}>Pontos</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.guideButton} onPress={onOpenGuide}>
            <Text style={styles.guideButtonText}>Guia 2</Text>
          </TouchableOpacity>

          {onExitGame && (
            <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
              <Text style={styles.exitButtonText}>Sair</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Role Banner: Leader vs Collaborator */}
      <View
        style={[
          styles.roleBanner,
          isLeader ? styles.leaderBanner : styles.memberBanner,
        ]}
      >
        <Text style={styles.roleBannerIcon}>{isLeader ? '👑' : '👥'}</Text>
        <View style={styles.roleBannerTextContainer}>
          <Text
            style={[
              styles.roleTitle,
              isLeader ? styles.leaderTitle : styles.memberTitle,
            ]}
          >
            {isLeader
              ? 'VOCÊ É O LÍDER DA RODADA'
              : `LÍDER ATUAL: ${currentLeaderName || 'Colega'}`}
          </Text>
          <Text style={styles.roleSubtitle}>
            {isLeader
              ? 'Debata com a equipe, selecione o binário e submeta o ano.'
              : 'Ajude na conversão binária e na justificativa cronológica!'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roomBadge: {
    backgroundColor: Colors.background,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  roomText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  playersBadgeText: {
    color: '#67E8F9',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 1,
  },
  roundText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  scoreBadge: {
    backgroundColor: Colors.background,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.secondaryDark,
  },
  scoreLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  scoreValue: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0369A1',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  guideButtonIcon: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  guideButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  exitButton: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  exitButtonText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  leaderBanner: {
    backgroundColor: Colors.leaderBg,
    borderColor: Colors.leaderBorder,
  },
  memberBanner: {
    backgroundColor: Colors.memberBg,
    borderColor: Colors.memberBorder,
  },
  roleBannerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  roleBannerTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  leaderTitle: {
    color: '#E0E7FF',
  },
  memberTitle: {
    color: '#BAE6FD',
  },
  roleSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
});
