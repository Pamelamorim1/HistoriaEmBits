import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Colors } from '../theme/colors';

export default function RescueChallengeModal({
  visible,
  binaryCode,
  isLeader,
  onSubmit,
}) {
  const [answer, setAnswer] = useState('');

  const handleConfirm = () => {
    if (!answer.trim()) return;
    onSubmit(answer.trim());
    setAnswer('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollOverlay}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.modalCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⚡ ENERGIA ZERADA • ÚLTIMA CHANCE</Text>
            </View>

            <Text style={styles.title}>Desafio de Resgate</Text>
            <Text style={styles.subtitle}>Reinicialização Binária de Emergência</Text>

            <Text style={styles.description}>
              A pontuação da equipe chegou a 0! Converta este código de 8 bits para decimal para recuperar{' '}
              <Text style={styles.highlight}>+150 pontos</Text>. Se errar, a equipe entra em{' '}
              <Text style={styles.dangerHighlight}>Reserva de Emergência</Text>!
            </Text>

            <View style={styles.binaryBox}>
              <Text style={styles.binaryLabel}>CÓDIGO BINÁRIO DE EMERGÊNCIA:</Text>
              <Text style={styles.binaryCode}>{binaryCode || '00000000'}</Text>
            </View>

            {isLeader ? (
              <View style={styles.inputArea}>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o valor decimal (ex: 42)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  value={answer}
                  onChangeText={setAnswer}
                />
                <TouchableOpacity
                  style={[styles.submitBtn, !answer.trim() && styles.submitBtnDisabled]}
                  disabled={!answer.trim()}
                  onPress={handleConfirm}
                >
                  <Text style={styles.submitBtnText}>⚡ Reiniciar Sistema</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.waitingBox}>
                <Text style={styles.waitingText}>
                  Aguardando o Líder enviar a conversão de emergência. Ajudem nos cálculos!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
  },
  scrollOverlay: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#451A03',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 10,
  },
  badgeText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: 'bold',
    marginTop: 2,
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  highlight: {
    color: '#34D399',
    fontWeight: 'bold',
  },
  dangerHighlight: {
    color: '#FCA5A5',
    fontWeight: 'bold',
  },
  binaryBox: {
    width: '100%',
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    alignItems: 'center',
    marginBottom: 16,
  },
  binaryLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  binaryCode: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: Colors.primary,
    letterSpacing: 3,
  },
  inputArea: {
    width: '100%',
    gap: 10,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  waitingBox: {
    width: '100%',
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 10,
  },
  waitingText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
