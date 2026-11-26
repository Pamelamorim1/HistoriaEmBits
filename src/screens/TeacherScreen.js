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
            <Text style={styles.loginIcon}>🔒</Text>
            <Text style={styles.loginTitle}>Área do Professor</Text>
            <Text style={styles.loginSubtitle}>
              Acesso restrito ao relatório pedagógico e controle de turmas (BNCC EM13CHS103 e EM13CO13).
            </Text>

            <Text style={styles.fieldLabel}>SENHA DOCENTE:</Text>
            <TextInput
              style={styles.passwordInput}
              secureTextEntry={true}
              placeholder="Digite a senha (padrão: PROF2026)"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginBtnText}>Entrar no Painel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={onClose}>
              <Text style={styles.backBtnText}>Voltar ao Início</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Painel Pedagógico do Professor</Text>
          <Text style={styles.headerSubtitle}>Monitoramento de Aprendizagem e Gestão de Salas</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Fechar</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'reports' && styles.tabItemActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            Relatórios Concluídos ({allReports.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'rooms' && styles.tabItemActive]}
          onPress={() => {
            setActiveTab('rooms');
            socketService.getAdminReports(password);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'rooms' && styles.tabTextActive]}>
            Gerenciador de Salas ({activeRooms.length}/5)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* TAB 1: RELATÓRIOS DOCENTES */}
        {activeTab === 'reports' && (
          <View>
            {selectedReport ? (
              <View style={styles.reportDetailCard}>
                <TouchableOpacity
                  style={styles.backToListBtn}
                  onPress={() => setSelectedReport(null)}
                >
                  <Text style={styles.backToListText}>← Voltar à lista de turmas</Text>
                </TouchableOpacity>

                <View style={styles.reportMetaHeader}>
                  <Text style={styles.detailRoomTitle}>{selectedReport.roomId}</Text>
                  <Text style={styles.detailDateText}>{selectedReport.dataHora}</Text>
                </View>

                <Text style={styles.sectionSubtitle}>
                  Duração: {selectedReport.duracaoMinutos} min • Pontuação: {selectedReport.pontuacaoFinal} pts
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Integrantes: {selectedReport.participantes?.join(', ')}
                </Text>

                {/* Avaliação BNCC */}
                <View style={styles.bnccDiagnosisBox}>
                  <Text style={styles.bnccDiagnosisTitle}>Diagnóstico Pedagógico BNCC:</Text>
                  <Text style={styles.bnccItem}>
                    • <Text style={styles.boldText}>EM13CHS103 (Cronologia):</Text> Precisão de{' '}
                    {selectedReport.habilidadesBNCC?.EM13CHS103?.precisaoCronologica} com{' '}
                    {selectedReport.habilidadesBNCC?.EM13CHS103?.errosOrdenacao} erros de posicionamento.
                  </Text>
                  <Text style={styles.bnccItem}>
                    • <Text style={styles.boldText}>EM13CO13 (Lógica Binária):</Text> Precisão de{' '}
                    {selectedReport.habilidadesBNCC?.EM13CO13?.precisaoDecodificacao} com{' '}
                    {selectedReport.habilidadesBNCC?.EM13CO13?.dicasUtilizadas} dicas ou revelações solicitadas.
                  </Text>
                </View>

                {/* Log detalhado rodada a rodada */}
                <Text style={styles.sectionHeading}>Registro Algorítmico Rodada a Rodada:</Text>
                <View style={styles.logList}>
                  {selectedReport.logDetalhadoRodadas?.map((log, index) => (
                    <View key={index} style={styles.logItem}>
                      <Text style={styles.logLeader}>Líder: {log.leader}</Text>
                      <Text style={styles.logDetail}>
                        {log.cardTitle ? `Carta: ${log.cardTitle}` : ''}
                      </Text>
                      <Text style={styles.logDetail}>
                        {log.success !== undefined
                          ? log.success
                            ? `✓ Acertou na tentativa ${log.attempt} (Binário: ${log.selectedBinary}, Ano: ${log.guessedYear})`
                            : `✕ Erro na tentativa ${log.attempt}: digitou ${log.guessedYear} (-${log.penalty} pts)`
                          : log.action}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View>
                {allReports.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyText}>
                      Nenhum relatório gerado ainda. As partidas finalizadas aparecerão aqui com dados completos de avaliação BNCC.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.reportsGrid}>
                    {allReports.map((rep, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.reportSummaryCard}
                        onPress={() => setSelectedReport(rep)}
                      >
                        <View style={styles.summaryTop}>
                          <Text style={styles.summaryRoom}>{rep.roomId}</Text>
                          <Text style={styles.summaryScore}>{rep.pontuacaoFinal} pts</Text>
                        </View>
                        <Text style={styles.summaryDate}>{rep.dataHora}</Text>
                        <Text style={styles.summaryMembers}>
                          Alunos: {rep.participantes?.join(', ')}
                        </Text>
                        <View style={styles.viewReportBtn}>
                          <Text style={styles.viewReportBtnText}>Visualizar Registro Completo →</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* TAB 2: GERENCIADOR DE SALAS */}
        {activeTab === 'rooms' && (
          <View>
            <View style={styles.limitInfoBanner}>
              <Text style={styles.limitInfoTitle}>Regra de Capacidade do Servidor:</Text>
              <Text style={styles.limitInfoText}>
                O sistema permite no máximo <Text style={styles.boldText}>5 salas ativas simultaneamente</Text> (SALA-01 a SALA-05). Encerre salas que foram concluídas para liberar espaço para outros grupos.
              </Text>
            </View>

            {activeRooms.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📡</Text>
                <Text style={styles.emptyText}>
                  Nenhuma sala ativa no momento no servidor WebSocket. Todas as 5 vagas estão liberadas.
                </Text>
              </View>
            ) : (
              <View style={styles.roomsList}>
                {activeRooms.map((room) => (
                  <View key={room.id} style={styles.roomItemCard}>
                    <View style={styles.roomItemHeader}>
                      <Text style={styles.roomItemId}>{room.id}</Text>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>{room.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.roomItemText}>
                      Alunos conectados ({room.players?.length}/5): {room.players?.join(', ') || 'Nenhum'}
                    </Text>
                    <Text style={styles.roomItemText}>
                      Rodada: {room.round} de {room.totalCards} • Pontuação: {room.score}
                    </Text>

                    <TouchableOpacity
                      style={styles.resetRoomBtn}
                      onPress={() => handleResetRoom(room.id)}
                    >
                      <Text style={styles.resetRoomBtnText}>Encerrar / Liberar Sala</Text>
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
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 100,
  },
  loginCard: {
    margin: 20,
    marginTop: 60,
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  loginIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  loginSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 17,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.textMuted,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  passwordInput: {
    width: '100%',
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 10,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: Colors.secondaryDark,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  backBtn: {
    paddingVertical: 8,
  },
  backBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingTop: 36,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  closeBtn: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  closeBtnText: {
    color: Colors.text,
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.secondary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.secondary,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  reportsGrid: {
    gap: 12,
  },
  reportSummaryCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryRoom: {
    fontSize: 16,
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
  },
  viewReportBtn: {
    alignSelf: 'flex-start',
  },
  viewReportBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  reportDetailCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  backToListBtn: {
    marginBottom: 12,
  },
  backToListText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  reportMetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailRoomTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  detailDateText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  bnccDiagnosisBox: {
    backgroundColor: '#1E1B4B',
    padding: 12,
    borderRadius: 10,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  bnccDiagnosisTitle: {
    color: '#A5B4FC',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 6,
  },
  bnccItem: {
    color: '#E0E7FF',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginTop: 10,
    marginBottom: 8,
  },
  logList: {
    gap: 8,
  },
  logItem: {
    backgroundColor: Colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  logLeader: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 11,
    marginBottom: 2,
  },
  logDetail: {
    color: Colors.text,
    fontSize: 11,
    lineHeight: 16,
  },
  limitInfoBanner: {
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  limitInfoTitle: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  limitInfoText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  roomsList: {
    gap: 12,
  },
  roomItemCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  roomItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomItemId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statusPill: {
    backgroundColor: '#064E3B',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  roomItemText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  resetRoomBtn: {
    backgroundColor: '#7F1D1D',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  resetRoomBtnText: {
    color: '#FCA5A5',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
