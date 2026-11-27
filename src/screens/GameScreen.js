import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Colors } from '../theme/colors';
import { getCardImage } from '../data/cardImages';
import Header from '../components/Header';
import BinaryGuideModal from '../components/BinaryGuideModal';
import ThirdAttemptModal from '../components/ThirdAttemptModal';
import TimelineView from '../components/TimelineView';
import ConsensusModal from '../components/ConsensusModal';
import RescueChallengeModal from '../components/RescueChallengeModal';
import LeaderTransitionModal from '../components/LeaderTransitionModal';

export default function GameScreen({
  roomState,
  isLeader,
  currentLeaderName,
  currentUser,
  isLocalMode = false,
  onSelectBinary,
  onSubmitYear,
  onResolveThirdAttempt,
  onResolveTimelineThirdAttempt,
  onPlaceCardTimeline,
  onVoteProposal,
  onCancelProposal,
  onRevealCentralYear,
  onSubmitRescueChallenge,
  onExitGame,
  verificationFeedback,
  timelineFeedback,
  leaderTransition,
  onDismissLeaderTransition,
}) {
  const [guideVisible, setGuideVisible] = useState(false);
  const [typedYear, setTypedYear] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    setTypedYear('');
  }, [roomState?.currentCardIndex, roomState?.phase]);

  const handlePromptRevealCentralYear = (cardId = null, cardTitle = null) => {
    const label = cardTitle ? `de "${cardTitle}"` : 'desta carta da linha do tempo';
    const msg = `Deseja gastar 50 pontos da equipe para revelar o ano decodificado ${label}?`;
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        onRevealCentralYear(cardId);
      }
      return;
    }
    Alert.alert(
      'Revelar Ano Decodificado',
      msg,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, Revelar (-50 pts)', onPress: () => onRevealCentralYear(cardId) },
      ]
    );
  };

  const currentRound = (roomState?.currentCardIndex || 0) + 1;
  const totalRounds = roomState?.totalCards || 10;
  const currentCardRound = roomState?.currentCardRound;
  const selectedBinary = roomState?.selectedBinary;
  const revealedHints = roomState?.revealedHints || [];
  const promptThirdAttempt = roomState?.promptThirdAttempt || false;
  const timelineHints = roomState?.timelineHints || [];
  const promptTimelineThirdAttempt = roomState?.promptTimelineThirdAttempt || false;
  const emergencyMode = !!roomState?.emergencyMode;
  const rescueChallenge = roomState?.rescueChallenge || null;
  const score = roomState?.score ?? 1000;
  const phase = roomState?.phase || 'decoding'; // 'decoding' | 'timeline' | 'finished'

  const handleSelectBinary = (binaryCode) => {
    if (!isLeader) {
      Alert.alert(
        'Modo Espectador Colaborativo',
        `Apenas o Líder (${currentLeaderName}) pode selecionar o código. Sugira a opção verbalmente para a equipe!`
      );
      return;
    }
    // Se tocar no mesmo que já estava selecionado, desmarca!
    if (selectedBinary === binaryCode) {
      onSelectBinary(null);
    } else {
      onSelectBinary(binaryCode);
    }
  };

  const handleDeselectBinary = () => {
    if (!isLeader) return;
    onSelectBinary(null);
  };

  const handleSubmitYear = () => {
    if (!isLeader) return;
    if (!selectedBinary) {
      Alert.alert('Atenção', 'Selecione primeiro uma das 3 opções de códigos binários.');
      return;
    }
    if (!typedYear.trim()) {
      Alert.alert('Atenção', 'Digite o ano convertido em formato decimal (ex: 1789).');
      return;
    }
    onSubmitYear(selectedBinary, typedYear.trim());
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      <Header
        score={score}
        currentRound={currentRound}
        totalRounds={totalRounds}
        isLeader={isLeader}
        currentLeaderName={currentLeaderName}
        onOpenGuide={() => setGuideVisible(true)}
        onExitGame={onExitGame}
        roomId={roomState?.id}
        playersCount={roomState?.players?.length || 1}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        style={styles.keyboardContainer}
      >
        {emergencyMode && (
          <View style={styles.emergencyBanner}>
            <Text style={styles.emergencyBannerText}>
              ⚡ RESERVA DE EMERGÊNCIA (0 pts): Recursos pagos bloqueados. Acerte para recuperar pontos; outro erro encerra a partida!
            </Text>
          </View>
        )}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* FASE 1: DECODIFICAÇÃO BINÁRIA */}
          {phase === 'decoding' && (
            <View style={styles.decodingSection}>
              {/* Historical Card Info with Photo */}
              <View style={styles.cardHeader}>
                <View style={styles.eraBadge}>
                  <Text style={styles.eraBadgeText}>ERA DAS REVOLUÇÕES</Text>
                </View>

                {(getCardImage(currentCardRound?.id) || currentCardRound?.imagem_url) && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={getCardImage(currentCardRound?.id) || { uri: currentCardRound.imagem_url }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlayBadge}>
                      <Text style={styles.imageOverlayText}>Acontecimento Histórico</Text>
                    </View>
                  </View>
                )}

                <Text style={styles.cardTitle}>{currentCardRound?.titulo || 'Carregando carta...'}</Text>
                <Text style={styles.cardSummary}>
                  {currentCardRound?.resumo_historico || ''}
                </Text>
                <View style={styles.questionBanner}>
                  <Text style={styles.questionText}>
                    Qual é o código binário correspondente ao ano deste evento histórico?
                  </Text>
                </View>
              </View>

              {/* Binary Options Selection - Only selected visible, deselect reveals all */}
              <View style={styles.binarySection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>
                    {selectedBinary
                      ? 'CÓDIGO BINÁRIO SELECIONADO:'
                      : 'CÓDIGOS BINÁRIOS DISPONÍVEIS (SELECIONE 1):'}
                  </Text>
                  {selectedBinary && isLeader && (
                    <TouchableOpacity
                      style={styles.deselectLink}
                      onPress={handleDeselectBinary}
                    >
                      <Text style={styles.deselectLinkText}>↩️ Desmarcar / Ver Todos</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {selectedBinary ? (
                  // QUANDO SELECIONADO: SÓ ELE DEVE SER VISTO!
                  <View style={styles.singleSelectedContainer}>
                    <TouchableOpacity
                      style={[styles.binaryButton, styles.binaryButtonSelectedSolo]}
                      onPress={() => isLeader && handleDeselectBinary()}
                      activeOpacity={isLeader ? 0.7 : 1}
                    >
                      <View style={styles.soloTopRow}>
                        <View style={styles.selectedPillSolo}>
                          <Text style={styles.selectedPillText}>
                            {isLeader ? '✓ CÓDIGO SELECIONADO' : `✓ ${currentLeaderName} escolheu`}
                          </Text>
                        </View>
                        {isLeader && (
                          <Text style={styles.tapToDeselectHint}>Toque para desmarcar</Text>
                        )}
                      </View>

                      <Text style={styles.binaryTextSelectedSolo}>{selectedBinary}</Text>

                      {isLeader && (
                        <View style={styles.deselectActionRow}>
                          <TouchableOpacity
                            style={styles.deselectBtn}
                            onPress={handleDeselectBinary}
                          >
                            <Text style={styles.deselectBtnText}>
                              ↩️ Desmarcar código e ver todas as 3 opções
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  // CASO DESMARQUE: CONSEGUE VER TODOS OS 3!
                  <View style={styles.binaryCardsRow}>
                    <Text style={styles.binaryInstructions}>
                      {isLeader
                        ? 'Toque no código que o grupo julga correto para isolá-lo e liberar a conversão decimal:'
                        : `Aguardando o Líder (${currentLeaderName}) selecionar uma das 3 opções:`}
                    </Text>
                    {currentCardRound?.binaryOptions?.map((binaryCode, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.binaryButton,
                          !isLeader && styles.binaryButtonDisabled,
                        ]}
                        onPress={() => handleSelectBinary(binaryCode)}
                        activeOpacity={isLeader ? 0.7 : 1}
                      >
                        <View style={styles.binaryOptionHeader}>
                          <View style={styles.binaryIndexBadge}>
                            <Text style={styles.binaryIndexText}>Opção {idx + 1}</Text>
                          </View>
                          {isLeader && (
                            <Text style={styles.selectActionHint}>Toque para isolar este</Text>
                          )}
                        </View>
                        <Text style={styles.binaryText}>{binaryCode}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Year Decimal Input & Verification */}
              <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>CONVERSÃO DECIMAL DO CÓDIGO ESCOLHIDO:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.yearInput,
                      !selectedBinary && styles.yearInputDisabled,
                    ]}
                    placeholder={
                      selectedBinary
                        ? 'Digite o ano em decimal (ex: 1789)'
                        : 'Selecione um código binário acima'
                    }
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    maxLength={4}
                    value={typedYear}
                    onChangeText={setTypedYear}
                    editable={isLeader && !!selectedBinary}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 150);
                    }}
                  />

                  {isLeader && (
                    <TouchableOpacity
                      style={[
                        styles.verifyBtn,
                        (!selectedBinary || !typedYear.trim()) && styles.verifyBtnDisabled,
                      ]}
                      disabled={!selectedBinary || !typedYear.trim()}
                      onPress={handleSubmitYear}
                    >
                      <Text style={styles.verifyBtnText}>Verificar Ano</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {!isLeader && (
                  <Text style={styles.collaboratorNotice}>
                    💡 Apenas o Líder ({currentLeaderName}) submete a resposta. Usem a Tabela 2ⁿ para ajudar no cálculo!
                  </Text>
                )}
              </View>

              {/* Verification Feedback Banner */}
              {verificationFeedback && (
                <View
                  style={[
                    styles.feedbackBanner,
                    verificationFeedback.success ? styles.feedbackSuccess : styles.feedbackError,
                  ]}
                >
                  <Text style={styles.feedbackText}>{verificationFeedback.message}</Text>
                  {verificationFeedback.penalty && (
                    <Text style={styles.penaltyText}>
                      Penalidade da Equipe: -{verificationFeedback.penalty} pontos
                    </Text>
                  )}
                </View>
              )}

              {/* Progressive Hints Section */}
              {revealedHints.length > 0 && (
                <View style={styles.hintsSection}>
                  <Text style={styles.hintsHeading}>
                    💡 Dicas Pedagógicas Desbloqueadas ({revealedHints.length}/3):
                  </Text>
                  {revealedHints.map((hint, i) => (
                    <View key={i} style={styles.hintCard}>
                      <View style={styles.hintHeader}>
                        <Text style={styles.hintTag}>Dica {hint.nivel} • {hint.tipo}</Text>
                      </View>
                      <Text style={styles.hintContent}>{hint.texto}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* FASE 2: LINHA DO TEMPO COLETIVA */}
          {phase === 'timeline' && (
            <>
              {verificationFeedback && verificationFeedback.success && (
                <View style={[styles.feedbackBanner, styles.feedbackSuccess, { marginHorizontal: 12, marginTop: 12 }]}>
                  <Text style={styles.feedbackText}>{verificationFeedback.message}</Text>
                </View>
              )}
              <TimelineView
                timeline={roomState?.timeline || []}
                currentCard={roomState?.currentCard}
                isLeader={isLeader}
                onPlaceCard={onPlaceCardTimeline}
                onRevealCentralYear={handlePromptRevealCentralYear}
                feedbackError={timelineFeedback}
                timelineHints={timelineHints}
                score={score}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Guia Binário Global */}
      <BinaryGuideModal
        visible={guideVisible}
        onClose={() => setGuideVisible(false)}
      />

      {/* Modal Decisão Crítica do 3º Erro */}
      <ThirdAttemptModal
        visible={promptThirdAttempt}
        isLeader={isLeader}
        mode="decoding"
        score={score}
        onContinue={() => onResolveThirdAttempt('continue')}
        onReveal={() => onResolveThirdAttempt('reveal')}
      />

      {/* Modal Decisão Crítica do 3º Erro na Linha do Tempo */}
      <ThirdAttemptModal
        visible={promptTimelineThirdAttempt}
        isLeader={isLeader}
        mode="timeline"
        score={score}
        onContinue={() => onResolveTimelineThirdAttempt('continue')}
        onReveal={() => onResolveTimelineThirdAttempt('reveal')}
      />

      {/* Modal Desafio de Resgate (0 pontos) */}
      <RescueChallengeModal
        visible={!!rescueChallenge}
        binaryCode={rescueChallenge?.binaryCode}
        isLeader={isLeader}
        onSubmit={onSubmitRescueChallenge}
      />

      {/* Modal de Consenso Coletivo para Posicionamento */}
      <ConsensusModal
        visible={!!roomState?.timelineProposal}
        proposal={roomState?.timelineProposal}
        players={roomState?.players || []}
        currentUserId={currentUser?.id}
        isLocalMode={isLocalMode}
        onVote={onVoteProposal}
        onCancel={onCancelProposal}
      />

      {/* Modal Alerta de Transição de Líder após Posicionamento */}
      <LeaderTransitionModal
        visible={!!leaderTransition?.visible}
        isLeader={isLeader}
        leaderName={leaderTransition?.leaderName || currentLeaderName}
        onClose={onDismissLeaderTransition}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  emergencyBanner: {
    backgroundColor: '#7F1D1D',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EF4444',
  },
  emergencyBannerText: {
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollArea: {
    paddingBottom: 150,
  },
  decodingSection: {
    padding: 16,
  },
  cardHeader: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
  },
  eraBadge: {
    backgroundColor: '#1E1B4B',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  eraBadgeText: {
    color: '#A5B4FC',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  imageOverlayText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  cardSummary: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  questionBanner: {
    backgroundColor: Colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  questionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  binarySection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  deselectLink: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  deselectLinkText: {
    color: Colors.secondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  binaryInstructions: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginBottom: 6,
  },
  binaryCardsRow: {
    gap: 8,
  },
  binaryButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
  },
  binaryButtonDisabled: {
    opacity: 0.95,
  },
  binaryOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  binaryIndexBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  binaryIndexText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectActionHint: {
    color: Colors.primary,
    fontSize: 10,
  },
  binaryText: {
    fontFamily: 'monospace',
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    letterSpacing: 2,
    textAlign: 'center',
    marginVertical: 4,
  },
  singleSelectedContainer: {
    width: '100%',
  },
  binaryButtonSelectedSolo: {
    borderColor: Colors.primary,
    backgroundColor: '#0A2540',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  soloTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedPillSolo: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  selectedPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tapToDeselectHint: {
    color: Colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
  binaryTextSelectedSolo: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38BDF8',
    letterSpacing: 3,
    textAlign: 'center',
    marginVertical: 8,
  },
  deselectActionRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  deselectBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondaryDark,
  },
  deselectBtnText: {
    color: Colors.secondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  inputSection: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  yearInput: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  yearInputDisabled: {
    opacity: 0.5,
  },
  verifyBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnDisabled: {
    opacity: 0.4,
    backgroundColor: '#4B5563',
  },
  verifyBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  collaboratorNotice: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  feedbackBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  feedbackSuccess: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.success,
  },
  feedbackError: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger,
  },
  feedbackText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  penaltyText: {
    color: '#FECACA',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: 'bold',
  },
  hintsSection: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 10,
  },
  hintsHeading: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  hintCard: {
    backgroundColor: Colors.surfaceLight,
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  hintHeader: {
    marginBottom: 4,
  },
  hintTag: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  hintContent: {
    color: Colors.text,
    fontSize: 12,
    lineHeight: 17,
  },
});
