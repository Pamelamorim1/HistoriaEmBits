import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../theme/colors';
import socketService from '../services/socketService';

export default function TeacherScreen({ onClose, localReports = [] }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'rooms'
  const [serverReports, setServerReports] = useState([]);
  const [activeRooms, setActiveRooms] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const unsubReports = socketService.subscribe('admin_reports_data', (data) => {
      setServerReports(data.reports || []);
      setActiveRooms(data.activeRooms || []);
    });

    const unsubError = socketService.subscribe('admin_error', (msg) => {
      Alert.alert('Erro de Acesso', msg);
    });

    const unsubReset = socketService.subscribe('admin_room_reset_success', ({ roomId }) => {
      Alert.alert('Sucesso', `A sala ${roomId} foi resetada.`);
      socketService.getAdminReports(password);
    });

    return () => {
      unsubReports();
      unsubError();
      unsubReset();
    };
  }, [password]);

  const handleLogin = () => {
    if (password === 'PROF2026') {
      setIsAuthenticated(true);
      // Solicita dados ao servidor se conectado
      socketService.getAdminReports(password);
    } else {
      Alert.alert('Acesso Negado', 'Senha docente incorreta. A senha padrão do PRD é PROF2026.');
    }
  };

  const allReports = [...localReports, ...serverReports];

  const handleResetRoom = (roomId) => {
    Alert.alert(
      'Encerrar Sala',
      `Deseja realmente encerrar a sala ${roomId} e liberar a vaga para outra turma?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: () => socketService.resetRoom(password, roomId),
        },
      ]
    );
  };

  // TELA DE LOGIN DOCENTE
  if (!isAuthenticated) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.loginScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.loginCard}>
            <View style={styles.loginIconContainer}>
              <Text style={styles.loginIcon}>🔒</Text>
            </View>

            <View style={styles.loginBadge}>
              <Text style={styles.loginBadgeText}>PAINEL DOCENTE • BNCC</Text>
            </View>

            <Text style={styles.loginTitle}>Área do Professor</Text>
            <Text style={styles.loginSubtitle}>
              Acesso exclusivo para acompanhamento pedagógico, relatórios de habilidades (EM13CHS103 / EM13CO13) e gestão de salas ativas.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>SENHA DE ACESSO DOCENTE:</Text>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={true}
                placeholder="Digite a senha (padrão: PROF2026)"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={styles.quickFillBtn}
              onPress={() => setPassword('PROF2026')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickFillText}>💡 Usar senha padrão: PROF2026</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.loginBtnText}>Entrar no Painel Pedagógico</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>← Voltar ao Início</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // TELA PRINCIPAL AUTENTICADA
  return (
    <View style={styles.container}>
      {/* Top Header Seguro e Responsivo */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>DOCENTE • BNCC</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Painel Pedagógico
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Monitoramento de Aprendizagem & Gestão
          </Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>✕ Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs com Badges */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'reports' && styles.tabItemActive]}
          onPress={() => setActiveTab('reports')}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            Relatórios
          </Text>
          <View style={[styles.tabBadge, activeTab === 'reports' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'reports' && styles.tabBadgeTextActive]}>
              {allReports.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'rooms' && styles.tabItemActive]}
          onPress={() => {
            setActiveTab('rooms');
            socketService.getAdminReports(password);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>📡</Text>
          <Text style={[styles.tabText, activeTab === 'rooms' && styles.tabTextActive]}>
            Salas Wi-Fi
          </Text>
          <View style={[styles.tabBadge, activeTab === 'rooms' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'rooms' && styles.tabBadgeTextActive]}>
              {activeRooms.length}/5
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* ABA 1: RELATÓRIOS PEDAGÓGICOS                            */}
        {/* ========================================================= */}
        {activeTab === 'reports' && (
          <View>
            {selectedReport ? (
              /* DETALHES DE UM RELATÓRIO ESPECÍFICO */
              <View style={styles.reportDetailCard}>
                <TouchableOpacity
                  style={styles.backToListBtn}
                  onPress={() => setSelectedReport(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backToListText}>← Voltar à Lista de Partidas</Text>
                </TouchableOpacity>

                <View style={styles.detailTitleRow}>
                  <View>
                    <Text style={styles.detailRoomTitle}>{selectedReport.roomId || 'SALA'}</Text>
                    <Text style={styles.detailDateText}>📅 {selectedReport.dataHora || 'Data não registrada'}</Text>
                  </View>
                  <View style={styles.detailScorePill}>
                    <Text style={styles.detailScoreText}>{selectedReport.pontuacaoFinal ?? 0} pts</Text>
                  </View>
                </View>

                {/* Métricas Resumidas em Cards */}
                <View style={styles.metaCardsRow}>
                  <View style={styles.metaCard}>
                    <Text style={styles.metaCardIcon}>⏱️</Text>
                    <Text style={styles.metaCardLabel}>DURAÇÃO</Text>
                    <Text style={styles.metaCardValue}>{selectedReport.duracaoMinutos || 1} min</Text>
                  </View>
                  <View style={styles.metaCard}>
                    <Text style={styles.metaCardIcon}>🏆</Text>
                    <Text style={styles.metaCardLabel}>PONTOS</Text>
                    <Text style={styles.metaCardValue}>{selectedReport.pontuacaoFinal ?? 0}</Text>
                  </View>
                  <View style={styles.metaCard}>
                    <Text style={styles.metaCardIcon}>👥</Text>
                    <Text style={styles.metaCardLabel}>INTEGRANTES</Text>
                    <Text style={styles.metaCardValue}>{selectedReport.participantes?.length || 1}</Text>
                  </View>
                </View>

                {/* Lista de Alunos Participantes */}
                <View style={styles.participantsSection}>
                  <Text style={styles.sectionSmallLabel}>ALUNOS PARTICIPANTES:</Text>
                  <Text style={styles.participantsText}>
                    {selectedReport.participantes && selectedReport.participantes.length > 0
                      ? selectedReport.participantes.join(' • ')
                      : 'Nenhum jogador listado'}
                  </Text>
                </View>

                {/* Bloco BNCC 1: EM13CHS103 (História e Cronologia) */}
                <View style={styles.bnccCardHistorical}>
                  <View style={styles.bnccCardHeader}>
                    <Text style={styles.bnccCodeBadge}>BNCC EM13CHS103</Text>
                    <Text style={styles.bnccCompetenceTitle}>Cronologia & Contexto Histórico</Text>
                  </View>
                  <View style={styles.bnccStatRow}>
                    <View style={styles.bnccStatItem}>
                      <Text style={styles.bnccStatLabel}>Precisão na Linha do Tempo:</Text>
                      <Text style={styles.bnccStatValueHighlight}>
                        {selectedReport.habilidadesBNCC?.EM13CHS103?.precisaoCronologica || '100%'}
                      </Text>
                    </View>
                    <View style={styles.bnccStatItem}>
                      <Text style={styles.bnccStatLabel}>Erros de Ordenação:</Text>
                      <Text style={styles.bnccStatValue}>
                        {selectedReport.habilidadesBNCC?.EM13CHS103?.errosOrdenacao ?? 0}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.bnccNote}>
                    Mede a capacidade de correlacionar eventos da Era das Revoluções em ordem cronológica de causa e efeito.
                  </Text>
                </View>

                {/* Bloco BNCC 2: EM13CO13 (Pensamento Computacional) */}
                <View style={styles.bnccCardComputational}>
                  <View style={styles.bnccCardHeader}>
                    <Text style={styles.bnccCodeBadgeComp}>BNCC EM13CO13</Text>
                    <Text style={styles.bnccCompetenceTitleComp}>Lógica Binária & Dados</Text>
                  </View>
                  <View style={styles.bnccStatRow}>
                    <View style={styles.bnccStatItem}>
                      <Text style={styles.bnccStatLabel}>Precisão Decodificação:</Text>
                      <Text style={styles.bnccStatValueHighlightComp}>
                        {selectedReport.habilidadesBNCC?.EM13CO13?.precisaoDecodificacao || '100%'}
                      </Text>
                    </View>
                    <View style={styles.bnccStatItem}>
                      <Text style={styles.bnccStatLabel}>Dicas Solicitadas:</Text>
                      <Text style={styles.bnccStatValue}>
                        {selectedReport.habilidadesBNCC?.EM13CO13?.dicasUtilizadas ?? 0}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.bnccNoteComp}>
                    Mede a compreensão de codificação binária como representação numérica (conversão de potências de 2).
                  </Text>
                </View>

                {/* Registro Algorítmico Rodada a Rodada */}
                <Text style={styles.sectionHeading}>Registro Algorítmico Rodada a Rodada:</Text>
                {selectedReport.logDetalhadoRodadas && selectedReport.logDetalhadoRodadas.length > 0 ? (
                  <View style={styles.logList}>
                    {selectedReport.logDetalhadoRodadas.map((log, index) => {
                      const isSuccess = log.success === true;
                      const isError = log.success === false;

                      return (
                        <View
                          key={index}
                          style={[
                            styles.logItem,
                            isSuccess && styles.logItemSuccess,
                            isError && styles.logItemError,
                          ]}
                        >
                          <View style={styles.logItemTop}>
                            <Text style={styles.logLeader}>👤 Líder: {log.leader || 'Equipe'}</Text>
                            {log.attempt && (
                              <Text style={styles.logAttemptBadge}>Tentativa #{log.attempt}</Text>
                            )}
                          </View>
                          {log.cardTitle ? (
                            <Text style={styles.logCardTitle}>📜 {log.cardTitle}</Text>
                          ) : null}
                          <Text style={styles.logDetail}>
                            {log.success !== undefined
                              ? isSuccess
                                ? `✓ Acertou (Binário: ${log.selectedBinary || 'N/A'}, Ano: ${log.guessedYear || 'N/A'})`
                                : `✕ Erro: digitou ${log.guessedYear || 'N/A'} (-${log.penalty || 0} pts)`
                              : log.action || 'Ação registrada'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyLogBox}>
                    <Text style={styles.emptyLogText}>Nenhum registro detalhado nesta partida.</Text>
                  </View>
                )}
              </View>
            ) : (
              /* LISTA DE TODOS OS RELATÓRIOS */
              <View>
                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerIcon}>💡</Text>
                  <View style={styles.infoBannerContent}>
                    <Text style={styles.infoBannerTitle}>Avaliação Integrada BNCC</Text>
                    <Text style={styles.infoBannerText}>
                      Cada partida finalizada gera diagnósticos automáticos de Cronologia Histórica (EM13CHS103) e Raciocínio Computacional Binário (EM13CO13).
                    </Text>
                  </View>
                </View>

                {allReports.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyTitle}>Nenhum Relatório Gerado Ainda</Text>
                    <Text style={styles.emptyText}>
                      Quando os alunos finalizarem uma partida (Local ou Wi-Fi), o relatório com métricas pedagógicas aparecerá automaticamente aqui.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.reportsGrid}>
                    {allReports.map((rep, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.reportSummaryCard}
                        onPress={() => setSelectedReport(rep)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.summaryTop}>
                          <View style={styles.summaryRoomBadge}>
                            <Text style={styles.summaryRoom}>{rep.roomId || 'SALA'}</Text>
                          </View>
                          <Text style={styles.summaryScore}>{rep.pontuacaoFinal ?? 0} pts</Text>
                        </View>

                        <Text style={styles.summaryDate}>📅 {rep.dataHora || 'Recente'}</Text>

                        <Text style={styles.summaryMembers} numberOfLines={2}>
                          👥 Alunos: {rep.participantes && rep.participantes.length > 0
                            ? rep.participantes.join(', ')
                            : 'Nenhum integrante informado'}
                        </Text>

                        {/* Mini-Badges de Habilidades BNCC */}
                        <View style={styles.summaryBnccRow}>
                          <View style={styles.summaryBnccPill}>
                            <Text style={styles.summaryBnccLabel}>EM13CHS103:</Text>
                            <Text style={styles.summaryBnccVal}>
                              {rep.habilidadesBNCC?.EM13CHS103?.precisaoCronologica || '100%'}
                            </Text>
                          </View>
                          <View style={styles.summaryBnccPillComp}>
                            <Text style={styles.summaryBnccLabel}>EM13CO13:</Text>
                            <Text style={styles.summaryBnccValComp}>
                              {rep.habilidadesBNCC?.EM13CO13?.precisaoDecodificacao || '100%'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.viewReportBtn}>
                          <Text style={styles.viewReportBtnText}>Visualizar Diagnóstico Completo →</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* ABA 2: GERENCIADOR DE SALAS WI-FI                        */}
        {/* ========================================================= */}
        {activeTab === 'rooms' && (
          <View>
            <View style={styles.limitInfoBanner}>
              <View style={styles.limitInfoTop}>
                <Text style={styles.limitInfoTitle}>Regra de Capacidade do Servidor</Text>
                <TouchableOpacity
                  style={styles.refreshBtn}
                  onPress={() => socketService.getAdminReports(password)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.refreshBtnText}>🔄 Atualizar</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.limitInfoText}>
                O sistema permite no máximo <Text style={styles.boldText}>5 salas ativas simultaneamente</Text> (SALA-01 a SALA-05). Encerre salas finalizadas ou inativas para liberar vagas a novos grupos.
              </Text>
            </View>

            {activeRooms.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📡</Text>
                <Text style={styles.emptyTitle}>Todas as 5 Vagas Disponíveis</Text>
                <Text style={styles.emptyText}>
                  Nenhuma sala multiplayer Wi-Fi em andamento no servidor local no momento.
                </Text>
              </View>
            ) : (
              <View style={styles.roomsList}>
                {activeRooms.map((room) => (
                  <View key={room.id} style={styles.roomItemCard}>
                    <View style={styles.roomItemHeader}>
                      <View style={styles.roomItemIdRow}>
                        <Text style={styles.roomItemId}>{room.id}</Text>
                        <View style={styles.statusPill}>
                          <Text style={styles.statusPillText}>{room.status || 'Ativa'}</Text>
                        </View>
                      </View>
                      <Text style={styles.roomScoreBadge}>{room.score ?? 0} pts</Text>
                    </View>

                    <Text style={styles.roomItemText}>
                      👥 <Text style={styles.boldText}>Alunos conectados ({room.players?.length || 0}/5):</Text>{' '}
                      {room.players && room.players.length > 0 ? room.players.join(', ') : 'Nenhum'}
                    </Text>

                    <Text style={styles.roomItemText}>
                      🎯 <Text style={styles.boldText}>Progresso:</Text> Rodada {room.round || 1} de {room.totalCards || 10}
                    </Text>

                    <TouchableOpacity
                      style={styles.resetRoomBtn}
                      onPress={() => handleResetRoom(room.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resetRoomBtnText}>⚠️ Encerrar e Liberar Vaga da Sala</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // LOGIN SCREEN
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 24,
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
  },
  loginIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  loginIcon: {
    fontSize: 28,
  },
  loginBadge: {
    backgroundColor: '#1E1B4B',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4338CA',
    marginBottom: 8,
  },
  loginBadgeText: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  passwordInput: {
    width: '100%',
    backgroundColor: Colors.surfaceLight,
    padding: 14,
    borderRadius: 12,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
  },
  quickFillBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  quickFillText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  loginBtn: {
    width: '100%',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  backBtn: {
    paddingVertical: 8,
  },
  backBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
  },

  // TOP HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  headerBadge: {
    backgroundColor: '#1E1B4B',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  headerBadgeText: {
    color: '#A5B4FC',
    fontSize: 9,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  closeBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // TABS
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  tabIcon: {
    fontSize: 14,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  tabBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: Colors.primaryDark,
  },
  tabBadgeText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  // MAIN CONTENT CONTAINER
  content: {
    padding: 16,
    paddingBottom: 24,
  },

  // INFO BANNER
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  infoBannerIcon: {
    fontSize: 20,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  infoBannerText: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },

  // EMPTY STATES
  emptyState: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },

  // REPORTS LIST
  reportsGrid: {
    gap: 12,
  },
  reportSummaryCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryRoomBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  summaryRoom: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  summaryScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  summaryDate: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  summaryMembers: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  summaryBnccRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryBnccPill: {
    flexDirection: 'row',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  summaryBnccPillComp: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  summaryBnccLabel: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: 'bold',
  },
  summaryBnccVal: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: 'bold',
  },
  summaryBnccValComp: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewReportBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  viewReportBtnText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },

  // REPORT DETAIL CARD
  reportDetailCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  backToListBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 14,
  },
  backToListText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailRoomTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  detailDateText: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  detailScorePill: {
    backgroundColor: '#78350F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  detailScoreText: {
    color: '#FDE68A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metaCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metaCard: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  metaCardIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  metaCardLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  metaCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  participantsSection: {
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  sectionSmallLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  participantsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // BNCC CARDS
  bnccCardHistorical: {
    backgroundColor: '#1E1B4B',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  bnccCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  bnccCodeBadge: {
    backgroundColor: '#312E81',
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  bnccCompetenceTitle: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bnccStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  bnccStatItem: {
    flex: 1,
  },
  bnccStatLabel: {
    fontSize: 10,
    color: '#A5B4FC',
    marginBottom: 2,
  },
  bnccStatValueHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34D399',
  },
  bnccStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F87171',
  },
  bnccNote: {
    color: '#C7D2FE',
    fontSize: 11,
    lineHeight: 15,
  },

  bnccCardComputational: {
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  bnccCodeBadgeComp: {
    backgroundColor: '#0369A1',
    color: '#BAE6FD',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  bnccCompetenceTitleComp: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bnccStatValueHighlightComp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  bnccNoteComp: {
    color: '#93C5FD',
    fontSize: 11,
    lineHeight: 15,
  },

  // LOG SECTION
  sectionHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 10,
  },
  logList: {
    gap: 8,
  },
  logItem: {
    backgroundColor: Colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.surfaceBorder,
  },
  logItemSuccess: {
    borderLeftColor: Colors.success,
  },
  logItemError: {
    borderLeftColor: Colors.danger,
  },
  logItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  logLeader: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 11,
  },
  logAttemptBadge: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  logCardTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  logDetail: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  emptyLogBox: {
    backgroundColor: Colors.surfaceLight,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyLogText: {
    color: Colors.textMuted,
    fontSize: 11,
  },

  // ROOMS TAB
  limitInfoBanner: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  limitInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  limitInfoTitle: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  refreshBtn: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  refreshBtnText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  limitInfoText: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  roomsList: {
    gap: 12,
  },
  roomItemCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  roomItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomItemIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomItemId: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statusPill: {
    backgroundColor: '#064E3B',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  statusPillText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  roomScoreBadge: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  roomItemText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: 17,
  },
  resetRoomBtn: {
    backgroundColor: '#7F1D1D',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  resetRoomBtnText: {
    color: '#FEE2E2',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
