import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';

export default function ThirdAttemptModal({
  visible,
  onContinue,
  onReveal,
  isLeader,
  mode = 'decoding', // 'decoding' | 'timeline'
  score = 1000,
}) {
  const isTimeline = mode === 'timeline';
  const canAffordReveal = score >= 150;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>

          <Text style={styles.title}>3ª Tentativa Incorreta</Text>
          <Text style={styles.subtitle}>
            {isTimeline ? 'Posição na Linha do Tempo' : 'Momento de Decisão do Grupo!'}
          </Text>

          <Text style={styles.body}>
            {isTimeline
              ? 'Vocês erraram o posicionamento na linha do tempo 3 vezes e já receberam as 2 dicas disponíveis.\n\nDebatam em equipe como desejam prosseguir:'
              : 'Vocês já tentaram decodificar este acontecimento 3 vezes e desbloquearam todas as dicas disponíveis.\n\nDebatam em equipe como desejam prosseguir na partida:'}
          </Text>

          {isLeader ? (
            <View style={styles.buttonsContainer}>
              {/* Opção A */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.continueBtn]}
                onPress={onContinue}
              >
                <Text style={styles.btnTitle}>Opção A: Continuar Tentando</Text>
                <Text style={styles.btnDesc}>
                  {isTimeline
                    ? 'Usem as 2 dicas já reveladas na tela. Novos erros de posição descontarão apenas -25 pts.'
                    : 'Usem as 3 dicas já reveladas na tela. Novos erros descontarão apenas -25 pts.'}
                </Text>
              </TouchableOpacity>

              {/* Opção B */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.revealBtn, !canAffordReveal && { opacity: 0.45 }]}
                disabled={!canAffordReveal}
                onPress={onReveal}
              >
                <Text style={[styles.btnTitle, styles.revealTitle]}>
                  {!canAffordReveal
                    ? 'Opção B: Indisponível (Saldo < 150 pts)'
                    : isTimeline
                    ? 'Opção B: Revelar Posição (-150 pts)'
                    : 'Opção B: Revelar Resposta (-150 pts)'}
                </Text>
                <Text style={styles.btnDesc}>
                  {!canAffordReveal
                    ? 'Reserva de Emergência ativa: acerte para recuperar pontos antes de usar revelação paga.'
                    : isTimeline
                    ? 'Insere a carta automaticamente no local correto da linha do tempo, registra "Posicionamento Assistido" e avança a rodada.'
                    : 'Revela o binário e o ano correto. Registra "Revelação Assistida" no relatório e avança para a Linha do Tempo.'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>
                Aguardando o Líder registrar o consenso da equipe...
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.warning,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.warningBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 12,
  },
  body: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  actionBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  continueBtn: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.surfaceBorder,
  },
  revealBtn: {
    backgroundColor: '#3B1313',
    borderColor: Colors.danger,
  },
  btnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  revealTitle: {
    color: '#FCA5A5',
  },
  btnDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  waitingContainer: {
    padding: 14,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    width: '100%',
  },
  waitingText: {
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
  },
});
