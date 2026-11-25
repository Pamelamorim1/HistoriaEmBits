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

export default function VictoryScreen({ report, onRestart, onOpenTeacherArea }) {
  const participants = report?.participantes || ['Equipe'];
  const score = report?.pontuacaoFinal ?? 0;
  const isGameOver = !!report?.gameOver;
  const timeline = report?.linhaDoTempoFinal || [];
  const duration = report?.duracaoMinutos || 15;
  const bncc = report?.habilidadesBNCC || {};

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Victory / Game Over Header */}
        <View style={styles.headerBox}>
          <Text style={styles.trophy}>{isGameOver ? '⚡' : '🏆'}</Text>
          <Text style={styles.victoryTitle}>
            {isGameOver ? 'Pane no Sistema Histórico!' : 'Vitória Cooperativa!'}
          </Text>
          <Text style={styles.victorySubtitle}>
            {isGameOver
              ? 'A equipe esgotou a Reserva de Emergência (0 pts), mas o progresso pedagógico foi registrado.'
              : 'A equipe construiu a Linha do Tempo da Era das Revoluções com sucesso!'}
          </Text>

          <View style={styles.scoreBadge}>
            <Text style={styles.scoreLabel}>Pontuação Final da Equipe</Text>
            <Text style={styles.scoreValue}>{score} pts</Text>
          </View>
        </View>

        {/* Team Members */}
        <View style={styles.teamCard}>
          <Text style={styles.sectionHeading}>Equipe Histórica:</Text>
          <View style={styles.membersRow}>
            {participants.map((name, i) => (
              <View key={i} style={styles.memberTag}>
                <Text style={styles.memberName}>👤 {name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pedagogical Performance BNCC */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionHeading}>Evidências de Aprendizagem (BNCC):</Text>
          
          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Text style={styles.statIcon}>⏳</Text>
            </View>
            <View style={styles.statDetails}>
              <Text style={styles.statName}>EM13CHS103 • Cronologia Histórica</Text>
              <Text style={styles.statMetric}>
                Precisão: {bncc.EM13CHS103?.precisaoCronologica || '100%'} • Erros de Ordem: {bncc.EM13CHS103?.errosOrdenacao || 0}
              </Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Text style={styles.statIcon}>🔢</Text>
            </View>
            <View style={styles.statDetails}>
              <Text style={styles.statName}>EM13CO13 • Decodificação Binária</Text>
              <Text style={styles.statMetric}>
                Precisão: {bncc.EM13CO13?.precisaoDecodificacao || '100%'} • Dicas Usadas: {bncc.EM13CO13?.dicasUtilizadas || 0}
              </Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <Text style={styles.statIcon}>⏱️</Text>
            </View>
            <View style={styles.statDetails}>
              <Text style={styles.statName}>Duração Total da Sessão</Text>
              <Text style={styles.statMetric}>{duration} minutos de aula</Text>
            </View>
          </View>
        </View>

        {/* Complete Timeline Review */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionHeading}>Linha do Tempo Completa Construída:</Text>
          <View style={styles.timelineList}>
            {timeline.map((card, index) => (
              <View key={index} style={styles.timelineCard}>
                <View style={styles.timelineYearBadge}>
                  <Text style={styles.timelineYearText}>{card.ano}</Text>
                </View>
                {(getCardImage(card.id) || card.imagem_url) && (
                  <Image
                    source={getCardImage(card.id) || { uri: card.imagem_url }}
                    style={styles.victoryCardThumb}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.timelineCardInfo}>
                  <Text style={styles.timelineCardTitle}>{card.titulo}</Text>
                  <Text style={styles.timelineCardBinary}>Binário: {card.binario}</Text>
                  {card.colocadoPor && (
                    <Text style={styles.timelineCardAuthor}>Posicionado por: {card.colocadoPor}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.restartBtn} onPress={onRestart}>
            <Text style={styles.restartBtnText}>Jogar Novamente</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.teacherBtn} onPress={onOpenTeacherArea}>
            <Text style={styles.teacherBtnText}>🔒 Visualizar Relatório do Professor</Text>
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
    paddingBottom: 30,
  },
  headerBox: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.secondary,
    marginBottom: 16,
  },
  trophy: {
    fontSize: 50,
    marginBottom: 8,
  },
  victoryTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.secondary,
    textAlign: 'center',
  },
  victorySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
  },
  scoreBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondaryDark,
    alignItems: 'center',
  },
  scoreLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  scoreValue: {
    color: Colors.secondary,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 2,
  },
  teamCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberTag: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  memberName: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statIcon: {
    fontSize: 18,
  },
  statDetails: {
    flex: 1,
  },
  statName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statMetric: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  timelineSection: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 20,
  },
  timelineList: {
    gap: 8,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  timelineYearBadge: {
    backgroundColor: Colors.background,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.secondaryDark,
    marginRight: 10,
  },
  victoryCardThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  timelineYearText: {
    color: Colors.secondary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  timelineCardInfo: {
    flex: 1,
  },
  timelineCardTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  timelineCardBinary: {
    color: Colors.primary,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  timelineCardAuthor: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 1,
  },
  actions: {
    gap: 10,
  },
  restartBtn: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  restartBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  teacherBtn: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.secondaryDark,
  },
  teacherBtnText: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
