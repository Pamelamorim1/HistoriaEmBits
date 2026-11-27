import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors } from '../theme/colors';

export default function ConsensusModal({
  visible,
  proposal,
  players = [],
  currentUserId,
  isLocalMode = false,
  onVote,
  onCancel,
}) {
  if (!proposal) return null;

  const votes = proposal.votes || {};
  const hasVoted = currentUserId ? votes[currentUserId] !== undefined : false;
  const isProposer = currentUserId && proposal.proposerId === currentUserId;
  const isYearVerification = proposal.type === 'year_verification';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🤝</Text>
            <Text style={styles.headerTitle}>Consenso da Equipe</Text>
            <Text style={styles.headerSubtitle}>
              {isYearVerification
                ? 'Todos os integrantes da sala devem aprovar o código binário e o ano antes da verificação!'
                : 'Todos os jogadores da sala devem aceitar o posicionamento na Linha do Tempo!'}
            </Text>
          </View>

          {/* Proposal Summary */}
          <View style={styles.proposalBox}>
            <Text style={styles.proposerLabel}>
              Proposta de <Text style={styles.proposerHighlight}>{proposal.proposerName || 'Líder'}</Text>:
            </Text>
            <Text style={styles.cardTitle}>{proposal.cardTitle}</Text>

            {isYearVerification ? (
              <View style={styles.verifDetailsBox}>
                <View style={styles.verifRow}>
                  <View style={styles.verifCol}>
                    <Text style={styles.verifColLabel}>CÓDIGO BINÁRIO:</Text>
                    <Text style={styles.verifBinaryValue}>{proposal.binaryString}</Text>
                  </View>
                  <View style={styles.verifCol}>
                    <Text style={styles.verifColLabel}>ANO DECIMAL:</Text>
                    <Text style={styles.verifYearValue}>{proposal.guessedYear}</Text>
                  </View>
                </View>
                <View style={[styles.infoBadge, styles.infoBadgeVerif]}>
                  <Text style={styles.infoBadgeTextVerif}>
                    ⚡ Verificar se o código binário e o ano estão corretos
                  </Text>
                </View>
              </View>
            ) : (
              <>
                {proposal.cardYear && (
                  <Text style={styles.cardYear}>Ano convertido: {proposal.cardYear}</Text>
                )}
                <View style={styles.infoBadge}>
                  <Text style={styles.infoBadgeText}>Posição escolhida na Linha do Tempo: Ponto #{proposal.insertIndex}</Text>
                </View>
              </>
            )}
          </View>

          {/* Question Banner: Pergunta de Consenso */}
          <View style={styles.questionBanner}>
            <Text style={styles.questionText}>
              ❓ <Text style={styles.questionBold}>Pergunta para a Equipe:</Text>{' '}
              {isYearVerification
                ? 'Todos concordam que o código binário e o ano decimal estão corretos?'
                : 'Todos concordam que esta carta deve ser posicionada neste ponto da Linha do Tempo?'}
            </Text>
          </View>

          {/* Team Vote Status (Multiplayer) */}
          {!isLocalMode && (
            <View style={styles.voteListSection}>
              <Text style={styles.voteListHeading}>Votos dos Participantes na Sala:</Text>
              <ScrollView style={styles.voteScroll} showsVerticalScrollIndicator={false}>
                {players.map((p) => {
                  const playerVoted = votes[p.id];
                  return (
                    <View key={p.id} style={styles.voteRow}>
                      <Text style={styles.playerName}>👤 {p.name}</Text>
                      {playerVoted === true ? (
                        <View style={styles.votedBadgeYes}>
                          <Text style={styles.votedTextYes}>✓ Aceitou</Text>
                        </View>
                      ) : playerVoted === false ? (
                        <View style={styles.votedBadgeNo}>
                          <Text style={styles.votedTextNo}>✗ Recusou</Text>
                        </View>
                      ) : (
                        <View style={styles.votedBadgePending}>
                          <Text style={styles.votedTextPending}>⏳ Aguardando...</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Local Mode Notice */}
          {isLocalMode && (
            <View style={styles.localNoticeBox}>
              <Text style={styles.localNoticeText}>
                🗣️ <Text style={styles.localNoticeBold}>Debate Coletivo:</Text>{' '}
                {isYearVerification
                  ? 'Todos os integrantes da equipe reunidos concordam que este código binário e ano decimal estão corretos?'
                  : 'Todos os integrantes da equipe reunidos concordam que esta carta pertence exatamente a este período?'}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {!hasVoted && !isLocalMode ? (
              <View style={styles.votingButtonsRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.acceptBtn]}
                  onPress={() => onVote(true)}
                >
                  <Text style={styles.acceptBtnText}>✅ Concordar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.rejectBtn]}
                  onPress={() => onVote(false)}
                >
                  <Text style={styles.rejectBtnText}>❌ Discordar</Text>
                </TouchableOpacity>
              </View>
            ) : isLocalMode ? (
              <View style={styles.votingButtonsRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.acceptBtn]}
                  onPress={() => onVote(true)}
                >
                  <Text style={styles.acceptBtnText}>✅ Confirmar Consenso</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.rejectBtn]}
                  onPress={onCancel}
                >
                  <Text style={styles.rejectBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.waitingNoticeBox}>
                <Text style={styles.waitingNoticeText}>
                  ✓ Seu voto foi registrado! Aguardando o restante da equipe votar...
                </Text>
                {isProposer && (
                  <TouchableOpacity style={styles.cancelProposerBtn} onPress={onCancel}>
                    <Text style={styles.cancelProposerText}>Cancelar Proposta</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#38BDF8',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  proposalBox: {
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    marginBottom: 14,
  },
  proposerLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  proposerHighlight: {
    color: Colors.secondary,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardYear: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginTop: 2,
  },
  infoBadge: {
    backgroundColor: '#0F172A',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  infoBadgeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  verifDetailsBox: {
    marginTop: 8,
  },
  verifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  verifCol: {
    flex: 1,
    alignItems: 'center',
  },
  verifColLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 2,
  },
  verifBinaryValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  verifYearValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F59E0B',
  },
  infoBadgeVerif: {
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1',
    borderWidth: 1,
    marginTop: 8,
  },
  infoBadgeTextVerif: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
  },
  questionBanner: {
    backgroundColor: '#1E1B4B',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#6366F1',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 12,
    color: '#E0E7FF',
    lineHeight: 16,
    textAlign: 'center',
  },
  questionBold: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  voteListSection: {
    marginBottom: 14,
  },
  voteListHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  voteScroll: {
    maxHeight: 140,
  },
  voteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  playerName: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
  },
  votedBadgeYes: {
    backgroundColor: '#064E3B',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  votedTextYes: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: 'bold',
  },
  votedBadgeNo: {
    backgroundColor: '#7F1D1D',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  votedTextNo: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: 'bold',
  },
  votedBadgePending: {
    backgroundColor: '#451A03',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  votedTextPending: {
    color: '#FDE68A',
    fontSize: 10,
  },
  localNoticeBox: {
    backgroundColor: '#1E1B4B',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4338CA',
    marginBottom: 14,
  },
  localNoticeText: {
    color: '#E0E7FF',
    fontSize: 12,
    lineHeight: 17,
  },
  localNoticeBold: {
    fontWeight: 'bold',
    color: '#A5B4FC',
  },
  actions: {
    marginTop: 4,
  },
  votingButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: '#059669',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
  },
  rejectBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  waitingNoticeBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  waitingNoticeText: {
    color: '#6EE7B7',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  cancelProposerBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cancelProposerText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
