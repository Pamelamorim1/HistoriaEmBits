import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Colors } from '../theme/colors';
import { getCardImage } from '../data/cardImages';

export default function TimelineView({
  timeline = [],
  currentCard = null,
  isLeader = false,
  onPlaceCard,
  onRevealCentralYear,
  feedbackError = null,
  timelineHints = [],
  score = 1000,
}) {
  const canAffordReveal = score >= 50;
  return (
    <View style={styles.container}>
      {/* Pedagogical Guideline */}
      <View style={styles.pedagogyBanner}>
        <Text style={styles.pedagogyIcon}>🗣️</Text>
        <Text style={styles.pedagogyText}>
          <Text style={styles.pedagogyBold}>Consenso Histórico Coletivo:</Text>{' '}
          Antes de posicionar, declarem em voz alta para o grupo: este evento vem ANTES ou DEPOIS das cartas na mesa e por quê?
        </Text>
      </View>

      {/* Card being placed */}
      {currentCard && (
        <View style={styles.currentCardContainer}>
          <Text style={styles.currentCardBadge}>CARTA PRONTA PARA POSICIONAMENTO</Text>
          <View style={styles.currentCardBox}>
            {(getCardImage(currentCard.id) || currentCard.imagem_url) && (
              <Image
                source={getCardImage(currentCard.id) || { uri: currentCard.imagem_url }}
                style={styles.currentCardThumb}
                resizeMode="cover"
              />
            )}
            <Text style={styles.currentCardYear}>{currentCard.ano_decimal}</Text>
            <View style={styles.currentCardInfo}>
              <Text style={styles.currentCardTitle}>{currentCard.titulo}</Text>
              <Text style={styles.currentCardBinary}>Binário: {currentCard.ano_binario}</Text>
            </View>
          </View>
          {isLeader ? (
            <Text style={styles.instructionText}>
              Toque no botão <Text style={styles.insertBtnHighlight}>[ + Inserir Aqui ]</Text> na ordem cronológica correta abaixo:
            </Text>
          ) : (
            <Text style={styles.instructionTextMuted}>
              Aguardando o Líder selecionar o ponto correto na Linha do Tempo...
            </Text>
          )}
        </View>
      )}

      {/* Error feedback if misplaced */}
      {feedbackError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{feedbackError}</Text>
        </View>
      )}

      {/* Timeline Hints (up to 2) */}
      {timelineHints.length > 0 && (
        <View style={styles.hintsSection}>
          <Text style={styles.hintsHeading}>
            💡 Dicas de Posicionamento ({timelineHints.length}/2):
          </Text>
          {timelineHints.map((hint, i) => (
            <View key={i} style={styles.hintCard}>
              <Text style={styles.hintTag}>Dica {hint.nivel} • {hint.tipo}</Text>
              <Text style={styles.hintContent}>{hint.texto}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Horizontal Timeline Scroll */}
      <View style={styles.scrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.timelineScroll}
        >
          {/* Slot 0: Before first card */}
          {currentCard && (
            <View style={styles.slotWrapper}>
              <TouchableOpacity
                style={[styles.insertButton, !isLeader && styles.disabledButton]}
                disabled={!isLeader}
                onPress={() => onPlaceCard(0)}
              >
                <Text style={styles.insertButtonPlus}>+</Text>
                <Text style={styles.insertButtonText}>Inserir Aqui</Text>
              </TouchableOpacity>
              <View style={styles.timelineConnector} />
            </View>
          )}

          {/* Placed cards and intermediate slots */}
          {timeline.map((card, index) => (
            <React.Fragment key={card.id || `timeline-${index}`}>
              {/* Card Node */}
              <View style={styles.cardNode}>
                <View style={[styles.yearPill, !card.anoRevelado && styles.yearPillHidden]}>
                  <Text style={styles.yearPillText}>
                    {!card.anoRevelado ? '????' : card.ano_decimal}
                  </Text>
                </View>
                <View style={styles.nodeCircle} />
                <View style={styles.cardBubble}>
                  {(getCardImage(card.id) || card.imagem_url) && (
                    <Image
                      source={getCardImage(card.id) || { uri: card.imagem_url }}
                      style={styles.cardBubbleThumb}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.cardBubbleTitle} numberOfLines={2}>
                    {card.titulo}
                  </Text>

                  <Text style={styles.cardBubbleBinary}>{card.ano_binario}</Text>

                  {!card.anoRevelado && (
                    <View style={styles.hiddenCentralArea}>
                      <Text style={styles.hiddenCentralNotice}>
                        {card.posicaoFixa ? 'Referência (Ano Oculto)' : 'Ano Decimal Oculto'}
                      </Text>
                      {onRevealCentralYear && (
                        <TouchableOpacity
                          style={[styles.revealCentralBtn, !canAffordReveal && { opacity: 0.45 }]}
                          disabled={!canAffordReveal}
                          onPress={() => onRevealCentralYear(card.id, card.titulo)}
                        >
                          <Text style={styles.revealCentralBtnText}>
                            {canAffordReveal ? '🔓 Revelar (-50 pts)' : '🔒 Sem Saldo (Reserva)'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {card.colocadoPor && (
                    <Text style={styles.cardBubbleAuthor}>Por: {card.colocadoPor}</Text>
                  )}
                </View>
              </View>

              {/* Slot after this card */}
              {currentCard && (
                <View style={styles.slotWrapper}>
                  <View style={styles.timelineConnector} />
                  <TouchableOpacity
                    style={[styles.insertButton, !isLeader && styles.disabledButton]}
                    disabled={!isLeader}
                    onPress={() => onPlaceCard(index + 1)}
                  >
                    <Text style={styles.insertButtonPlus}>+</Text>
                    <Text style={styles.insertButtonText}>Inserir Aqui</Text>
                  </TouchableOpacity>
                  <View style={styles.timelineConnector} />
                </View>
              )}
            </React.Fragment>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  pedagogyBanner: {
    flexDirection: 'row',
    backgroundColor: '#1E1B4B',
    padding: 10,
    marginHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4338CA',
    marginBottom: 10,
    alignItems: 'center',
  },
  pedagogyIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  pedagogyText: {
    flex: 1,
    color: '#E0E7FF',
    fontSize: 11,
    lineHeight: 16,
  },
  pedagogyBold: {
    fontWeight: 'bold',
    color: '#A5B4FC',
  },
  currentCardContainer: {
    marginHorizontal: 12,
    backgroundColor: Colors.surfaceLight,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.secondary,
    marginBottom: 10,
  },
  currentCardBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  currentCardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentCardYear: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary,
    backgroundColor: Colors.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondaryDark,
  },
  currentCardThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  currentCardInfo: {
    flex: 1,
  },
  currentCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  currentCardBinary: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.primary,
    marginTop: 2,
  },
  instructionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  instructionTextMuted: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
  insertBtnHighlight: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  errorBanner: {
    marginHorizontal: 12,
    backgroundColor: Colors.dangerBg,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
    marginBottom: 8,
  },
  errorText: {
    color: '#FECACA',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hintsSection: {
    marginHorizontal: 12,
    marginBottom: 8,
    gap: 6,
  },
  hintsHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  hintCard: {
    backgroundColor: Colors.surfaceLight,
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  hintTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 2,
  },
  hintContent: {
    fontSize: 11,
    color: Colors.text,
    lineHeight: 15,
  },
  scrollWrapper: {
    minHeight: 160,
  },
  timelineScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 10,
  },
  slotWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineConnector: {
    width: 14,
    height: 3,
    backgroundColor: Colors.primaryDark,
  },
  insertButton: {
    backgroundColor: '#075985',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    minWidth: 80,
  },
  disabledButton: {
    opacity: 0.4,
    borderColor: Colors.surfaceBorder,
  },
  insertButtonPlus: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  insertButtonText: {
    color: '#E0F2FE',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardNode: {
    alignItems: 'center',
    width: 140,
  },
  yearPill: {
    backgroundColor: Colors.secondaryDark,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  yearPillHidden: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#64748B',
  },
  hiddenCentralArea: {
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  hiddenCentralNotice: {
    fontSize: 9,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  revealCentralBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 2,
  },
  revealCentralBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  yearPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nodeCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 6,
  },
  cardBubble: {
    backgroundColor: Colors.surfaceLight,
    padding: 8,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  cardBubbleThumb: {
    width: '100%',
    height: 60,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardBubbleTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardBubbleBinary: {
    color: Colors.primary,
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  cardBubbleAuthor: {
    color: Colors.textMuted,
    fontSize: 8,
    marginTop: 2,
  },
});
