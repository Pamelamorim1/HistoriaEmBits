import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';

export default function LeaderTransitionModal({
  visible,
  isLeader,
  leaderName,
  onClose,
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, isLeader ? styles.leaderContainer : styles.memberContainer]}>
          <View style={[styles.iconContainer, isLeader ? styles.leaderIconContainer : styles.memberIconContainer]}>
            <Text style={styles.iconText}>{isLeader ? '👑' : '👥'}</Text>
          </View>

          <Text style={styles.title}>
            {isLeader ? 'Você é o Novo Líder!' : 'Nova Liderança da Rodada'}
          </Text>

          <Text style={styles.subtitle}>
            Posicionamento Concluído na Linha do Tempo
          </Text>

          <View style={[styles.badge, isLeader ? styles.leaderBadge : styles.memberBadge]}>
            <Text style={[styles.badgeText, isLeader ? styles.leaderBadgeText : styles.memberBadgeText]}>
              {isLeader
                ? '🎯 VOCÊ ESCOLHE A RESPOSTA ATUAL'
                : `👑 LÍDER DA RODADA: ${leaderName || 'Colega'}`}
            </Text>
          </View>

          <Text style={styles.body}>
            {isLeader
              ? `A carta anterior foi posicionada com sucesso na Linha do Tempo e a liderança passou para você!\n\nAgora é VOCÊ quem deve selecionar uma das 3 opções de código binário e submeter o ano decimal da nova carta histórica.\n\nDebata os cálculos e as datas com a equipe antes de confirmar a resposta!`
              : `A carta anterior foi posicionada com sucesso na Linha do Tempo e a liderança da rodada passou para ${leaderName || 'seu colega'}.\n\nÉ o Líder quem tem a permissão de selecionar a opção de código binário e confirmar a resposta atual na tela dele.\n\nUsem a Tabela 2ⁿ, realizem os cálculos e orientem o líder verbalmente!`}
          </Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, isLeader ? styles.leaderBtn : styles.memberBtn]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.btnTitle}>
                {isLeader ? '👑 Entendido, Vou Escolher a Resposta' : '👥 Entendido, Ajudar nos Cálculos'}
              </Text>
              <Text style={styles.btnDesc}>
                {isLeader
                  ? 'Assumir os controles da rodada e debater com o grupo'
                  : 'Debater em grupo e orientar o líder na resposta'}
              </Text>
            </TouchableOpacity>
          </View>
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
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
  },
  leaderContainer: {
    borderColor: '#818CF8',
  },
  memberContainer: {
    borderColor: '#38BDF8',
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
  },
  leaderIconContainer: {
    backgroundColor: '#312E81',
    borderColor: '#818CF8',
  },
  memberIconContainer: {
    backgroundColor: '#0C4A6E',
    borderColor: '#38BDF8',
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 21,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 3,
    marginBottom: 12,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  leaderBadge: {
    backgroundColor: '#312E81',
    borderColor: '#818CF8',
  },
  memberBadge: {
    backgroundColor: '#0F172A',
    borderColor: '#38BDF8',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  leaderBadgeText: {
    color: '#E0E7FF',
  },
  memberBadgeText: {
    color: '#38BDF8',
  },
  body: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  buttonsContainer: {
    width: '100%',
  },
  actionBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  leaderBtn: {
    backgroundColor: '#3730A3',
    borderColor: '#818CF8',
  },
  memberBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#38BDF8',
  },
  btnTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 3,
    textAlign: 'center',
  },
  btnDesc: {
    fontSize: 11,
    color: '#CBD5E1',
    textAlign: 'center',
  },
});
