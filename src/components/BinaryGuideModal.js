import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Colors } from '../theme/colors';

const POWERS = [
  { exp: 10, val: 1024 },
  { exp: 9, val: 512 },
  { exp: 8, val: 256 },
  { exp: 7, val: 128 },
  { exp: 6, val: 64 },
  { exp: 5, val: 32 },
  { exp: 4, val: 16 },
  { exp: 3, val: 8 },
  { exp: 2, val: 4 },
  { exp: 1, val: 2 },
  { exp: 0, val: 1 },
];

export default function BinaryGuideModal({ visible, onClose }) {
  // Simulador interativo: array de 11 bits (padrão inicial 1789 = 11011111101)
  const [interactiveBits, setInteractiveBits] = useState([1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1]);

  const toggleBit = (index) => {
    const updated = [...interactiveBits];
    updated[index] = updated[index] === 1 ? 0 : 1;
    setInteractiveBits(updated);
  };

  const currentTotal = interactiveBits.reduce((acc, bit, idx) => {
    return acc + (bit === 1 ? POWERS[idx].val : 0);
  }, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Guia Binário Pedagógico</Text>
              <Text style={styles.modalSubtitle}>BNCC EM13CO13 • Lógica Binária para Anos Históricos</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Seção 1: Tabela de Potências */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeading}>1. Tabela de Potências de 2 (2¹⁰ a 2⁰)</Text>
              <Text style={styles.sectionDescription}>
                No sistema binário, cada posição da direita para a esquerda vale o dobro da anterior. Somamos apenas os valores onde o bit é 1.
              </Text>

              <View style={styles.tableGrid}>
                {POWERS.map((item) => (
                  <View key={item.exp} style={styles.tableCell}>
                    <Text style={styles.expText}>2^{item.exp}</Text>
                    <Text style={styles.valText}>{item.val}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Seção 2: Exemplo Passo a Passo */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeading}>2. Exemplo Prático Passo a Passo</Text>
              <Text style={styles.sectionDescription}>
                Veja a conversão do código binário da <Text style={styles.boldWhite}>Queda da Bastilha</Text>:
              </Text>

              <View style={styles.codeSnippet}>
                <Text style={styles.codeText}>Código Binário: 11011111101</Text>
              </View>

              <View style={styles.stepByStepContainer}>
                <Text style={styles.stepMath}>
                  (1×1024) + (1×512) + (0×256) + (1×128) + (1×64) + (1×32) + (1×16) + (1×8) + (1×4) + (0×2) + (1×1)
                </Text>
                <View style={styles.divider} />
                <Text style={styles.sumMath}>
                  = 1024 + 512 + 0 + 128 + 64 + 32 + 16 + 8 + 4 + 0 + 1
                </Text>
                <View style={styles.resultBadge}>
                  <Text style={styles.resultBadgeText}>= Ano 1789 (Revolução Francesa)</Text>
                </View>
              </View>
            </View>

            {/* Seção 3: Simulador Interativo */}
            <View style={[styles.cardSection, styles.interactiveSection]}>
              <View style={styles.interactiveHeader}>
                <Text style={styles.sectionHeading}>3. Simulador / Calculadora de Bits</Text>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => setInteractiveBits([1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1])}
                >
                  <Text style={styles.resetBtnText}>Redefinir Exemplo</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionDescription}>
                Toque nos bits abaixo para ligar (1) ou desligar (0) e veja o cálculo em tempo real:
              </Text>

              <View style={styles.bitsContainer}>
                {interactiveBits.map((bit, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => toggleBit(idx)}
                    style={[styles.bitBox, bit === 1 ? styles.bitBoxOn : styles.bitBoxOff]}
                  >
                    <Text style={styles.bitWeight}>{POWERS[idx].val}</Text>
                    <Text style={[styles.bitValue, bit === 1 ? styles.bitValueOn : styles.bitValueOff]}>
                      {bit}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.interactiveResult}>
                <Text style={styles.interactiveResultLabel}>Ano Decimal Resultante:</Text>
                <Text style={styles.interactiveResultValue}>{currentTotal}</Text>
              </View>
            </View>

            {/* Dica Pedagógica BNCC */}
            <View style={styles.bnccCard}>
              <Text style={styles.bnccTitle}>Dica Estratégica para o Grupo:</Text>
              <Text style={styles.bnccText}>
                • Se o ano termina com número ímpar, o último bit (2⁰ = 1) SEMPRE será 1.{'\n'}
                • Se o ano for posterior a 1800, verifique se a soma de 1024 + 512 + 256 = 1792 já foi atingida e somada a potências como 16 ou 32.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
            <Text style={styles.dismissBtnText}>Entendi, Voltar ao Jogo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: Colors.surfaceLight,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  closeButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollArea: {
    flexGrow: 0,
    marginBottom: 10,
  },
  cardSection: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 17,
  },
  boldWhite: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  tableCell: {
    backgroundColor: Colors.background,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '18%',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  expText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  valText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: 'bold',
    marginTop: 2,
  },
  codeSnippet: {
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginBottom: 8,
  },
  codeText: {
    fontFamily: 'monospace',
    color: Colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  stepByStepContainer: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 8,
  },
  stepMath: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: 6,
  },
  sumMath: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resultBadge: {
    backgroundColor: Colors.successBg,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  resultBadgeText: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  interactiveSection: {
    borderColor: Colors.primaryDark,
  },
  interactiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetBtn: {
    backgroundColor: Colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  resetBtnText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  bitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  bitBox: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 1,
    borderWidth: 1,
  },
  bitBoxOn: {
    backgroundColor: '#0369A1',
    borderColor: Colors.primary,
  },
  bitBoxOff: {
    backgroundColor: Colors.background,
    borderColor: Colors.surfaceBorder,
  },
  bitWeight: {
    fontSize: 8,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  bitValue: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  bitValueOn: {
    color: '#E0F2FE',
  },
  bitValueOff: {
    color: '#475569',
  },
  interactiveResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  interactiveResultLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  interactiveResultValue: {
    color: Colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  bnccCard: {
    backgroundColor: '#1E1B4B',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4338CA',
    marginBottom: 10,
  },
  bnccTitle: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bnccText: {
    color: '#E0E7FF',
    fontSize: 11,
    lineHeight: 16,
  },
  dismissBtn: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
