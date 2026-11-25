import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Share,
} from 'react-native';
import { Colors } from '../theme/colors';
import BinaryRain from '../components/BinaryRain';

export default function HomeScreen({
  onStartLocalGame,
  onCreateWifiRoom,
  onJoinWifiRoom,
  onOpenTeacherArea,
  onOpenGuide,
  serverUrl,
  onUpdateServerUrl,
  onAutoDiscoverServer,
}) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('menu'); // 'menu' | 'join' | 'create' | 'config'
  const [tempIp, setTempIp] = useState(serverUrl || '192.168.1.100:3000');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  useEffect(() => {
    if (serverUrl) {
      setTempIp(serverUrl);
    }
  }, [serverUrl]);

  const handleCopyOrShareHost = async () => {
    const hostToShare = serverUrl || tempIp;
    if (Platform.OS === 'web' && navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(hostToShare);
        Alert.alert('Host Copiado!', `Endereço copiado:\n${hostToShare}`);
        return;
      } catch (e) {}
    }
    try {
      await Share.share({
        message: `Conecte no servidor do História em Bits usando este Host:\n${hostToShare}`,
      });
    } catch (e) {
      Alert.alert('Host do Servidor', `Copie e informe aos colegas:\n${hostToShare}`);
    }
  };

  const handleAutoDiscover = async () => {
    if (!onAutoDiscoverServer || isScanning) return;
    setIsScanning(true);
    setScanStatus('Iniciando varredura da rede...');
    try {
      const res = await onAutoDiscoverServer((msg) => setScanStatus(msg));
      if (res?.found) {
        setTempIp(res.url);
        setScanStatus('');
        Alert.alert('Servidor Encontrado!', `Conectado automaticamente em:\n${res.url}`);
      } else {
        setScanStatus('');
        Alert.alert(
          'Servidor Não Encontrado',
          'Não foi possível detectar o servidor automaticamente.\n\n1. Verifique se "npm run server" está rodando no PC.\n2. O PC e o celular devem estar na mesma rede Wi-Fi ou no Roteador do celular.\n3. Digite o IP manualmente (veja o IP listado no console do servidor).'
        );
      }
    } finally {
      setIsScanning(false);
      setScanStatus('');
    }
  };

  const handleCreate = () => {
    if (!playerName.trim()) {
      Alert.alert('Atenção', 'Digite o seu nome antes de criar a sala.');
      return;
    }
    onCreateWifiRoom(playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      Alert.alert('Atenção', 'Digite o seu nome.');
      return;
    }
    if (!roomCode.trim()) {
      Alert.alert('Atenção', 'Digite o código da sala (ex: SALA-01).');
      return;
    }
    onJoinWifiRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  const handleLocalStart = () => {
    onStartLocalGame(playerName.trim() || 'Equipe 1');
  };

  const handleSaveIp = () => {
    onUpdateServerUrl(tempIp.trim());
    setMode('menu');
    Alert.alert('Servidor Atualizado', `Endereço salvo: ${tempIp.trim()}`);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <BinaryRain />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo and Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.badgeTheme}>
            <Text style={styles.badgeThemeText}>BNCC EM13CHS103 • EM13CO13</Text>
          </View>
          <Text style={styles.titlePrimary}>História em Bits</Text>
          <Text style={styles.tagline}>
            Era das Revoluções • Cooperativo Multiplayer Local
          </Text>
          <View style={styles.authorsRow}>
            <Text style={styles.authorsText}>
              Design Pedagógico: Andresa F. • Fernanda A. • Pâmela A.
            </Text>
          </View>
        </View>

        {/* Input Player Name */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>SEU NOME / APELIDO:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: Carlos, Ana, Aluno 1..."
            placeholderTextColor={Colors.textMuted}
            value={playerName}
            onChangeText={setPlayerName}
            maxLength={20}
          />
        </View>

        {/* Action Menus */}
        {mode === 'menu' && (
          <View style={styles.menuButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, styles.wifiButton]}
              onPress={() => setMode('create')}
            >
              <Text style={styles.buttonIcon}>📡</Text>
              <View style={styles.buttonTextGroup}>
                <Text style={styles.buttonMainText}>Criar Sala Wi-Fi (Host)</Text>
                <Text style={styles.buttonSubText}>Cria uma sala na rede local (até 5 jogadores)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, styles.joinButton]}
              onPress={() => setMode('join')}
            >
              <Text style={styles.buttonIcon}>🔑</Text>
              <View style={styles.buttonTextGroup}>
                <Text style={styles.buttonMainText}>Entrar em Sala Wi-Fi</Text>
                <Text style={styles.buttonSubText}>Insira o código gerado pelo colega (SALA-01 a 05)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, styles.localButton]}
              onPress={handleLocalStart}
            >
              <Text style={styles.buttonIcon}>📱</Text>
              <View style={styles.buttonTextGroup}>
                <Text style={styles.buttonMainText}>Partida Local (Mesa Única)</Text>
                <Text style={styles.buttonSubText}>Passa ou joga em um único aparelho ou modo autônomo</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.outlineButton} onPress={onOpenGuide}>
                <Text style={styles.outlineButtonText}>📘 Guia Binário & Potências 2ⁿ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outlineButton, styles.teacherButton]}
                onPress={onOpenTeacherArea}
              >
                <Text style={styles.teacherButtonText}>🔒 Painel do Professor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.serverConfigLink}
                onPress={() => setMode('config')}
              >
                <Text style={styles.serverConfigText}>
                  Configurar IP do Servidor ({serverUrl})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Form: Create Room */}
        {mode === 'create' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Criar Sala Multiplayer</Text>
            <Text style={styles.formDesc}>
              Ideal para a sala de aula! O Líder abre a sala e os colegas entram na mesma rede Wi-Fi local.
            </Text>

            <View style={styles.hotspotTipCard}>
              <Text style={styles.hotspotTipTitle}>💡 Dica para a Escola (Sem Trava de Wi-Fi):</Text>
              <Text style={styles.hotspotTipText}>
                Se o Wi-Fi da escola bloquear conexões entre alunos, ative o <Text style={styles.boldText}>"Ponto de Acesso / Roteador Wi-Fi"</Text> do seu celular (com 4G desligado). Seus colegas se conectam no seu Wi-Fi sem gastar internet de ninguém!
              </Text>
            </View>

            <View style={styles.serverInfoBox}>
              <Text style={styles.serverInfoLabel}>Endereço do Servidor de Conexão:</Text>
              <Text style={styles.serverInfoUrl} selectable>{serverUrl}</Text>
              <TouchableOpacity onPress={handleCopyOrShareHost}>
                <Text style={styles.changeIpText}>📋 Copiar / Compartilhar Host com Colegas</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAutoDiscover} disabled={isScanning}>
                <Text style={styles.changeIpText}>
                  {isScanning ? '⏳ Buscando servidor na rede...' : '🔍 Detectar Servidor Automaticamente'}
                </Text>
              </TouchableOpacity>
              {isScanning && scanStatus ? (
                <Text style={styles.scanStatusText}>{scanStatus}</Text>
              ) : null}
              <TouchableOpacity onPress={() => setMode('config')}>
                <Text style={styles.changeIpText}>[ Alterar IP Manualmente ]</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleCreate}>
              <Text style={styles.confirmBtnText}>Gerar Sala e Abrir Lobby</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('menu')}>
              <Text style={styles.cancelBtnText}>Voltar ao Menu</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Form: Join Room */}
        {mode === 'join' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Entrar em Sala de Colega</Text>
            <Text style={styles.formDesc}>
              Peça o código da sala ao líder que criou a turma (ex: SALA-01, SALA-02).
            </Text>

            {/* Quick 1-touch button for Auto-Discovery */}
            <TouchableOpacity
              style={styles.hotspotQuickBtn}
              disabled={isScanning}
              onPress={handleAutoDiscover}
            >
              <Text style={styles.hotspotQuickBtnText}>
                {isScanning
                  ? '⏳ Buscando servidor na rede...'
                  : '🔍 Detectar Servidor na Rede (Wi-Fi / Roteador)'}
              </Text>
            </TouchableOpacity>
            {isScanning && scanStatus ? (
              <Text style={styles.scanStatusText}>{scanStatus}</Text>
            ) : null}

            <Text style={styles.inputLabel}>CÓDIGO DA SALA:</Text>
            <TextInput
              style={[styles.textInput, styles.codeFormatInput]}
              placeholder="Ex: SALA-01"
              placeholderTextColor={Colors.textMuted}
              value={roomCode}
              onChangeText={setRoomCode}
              autoCapitalize="characters"
              maxLength={10}
            />

            <TouchableOpacity style={styles.confirmBtn} onPress={handleJoin}>
              <Text style={styles.confirmBtnText}>Entrar na Sala</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('menu')}>
              <Text style={styles.cancelBtnText}>Voltar ao Menu</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Form: Server IP Config */}
        {mode === 'config' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Configurar Servidor Local (Wi-Fi)</Text>
            <Text style={styles.formDesc}>
              Insira o IP do computador ou dispositivo que está rodando o servidor Node.js (ex: 192.168.1.105:3000 ou localhost:3000).
            </Text>

            <View style={styles.serverInfoBox}>
              <Text style={styles.serverInfoLabel}>
                HOST ATUAL (CONFIGURE ESTE ENDEREÇO NAS OUTRAS CONTAS):
              </Text>
              <Text style={styles.serverInfoUrl} selectable>
                {serverUrl}
              </Text>
              <TouchableOpacity
                style={[styles.hotspotQuickBtn, { marginTop: 8, marginBottom: 0, width: '100%' }]}
                onPress={handleCopyOrShareHost}
              >
                <Text style={styles.hotspotQuickBtnText}>📋 Copiar / Compartilhar Host</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>ENDEREÇO DO SERVIDOR (IP:PORTA):</Text>
            <TextInput
              style={styles.textInput}
              placeholder="192.168.1.100:3000"
              placeholderTextColor={Colors.textMuted}
              value={tempIp}
              onChangeText={setTempIp}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.hotspotQuickBtn, { marginBottom: 10 }]}
              disabled={isScanning}
              onPress={handleAutoDiscover}
            >
              <Text style={styles.hotspotQuickBtnText}>
                {isScanning ? '⏳ Buscando servidor na rede...' : '🔍 Detectar IP Automaticamente'}
              </Text>
            </TouchableOpacity>
            {isScanning && scanStatus ? (
              <Text style={styles.scanStatusText}>{scanStatus}</Text>
            ) : null}

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveIp}>
              <Text style={styles.confirmBtnText}>Salvar Endereço</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('menu')}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandLogo: {
    width: 84,
    height: 84,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  badgeTheme: {
    backgroundColor: '#1E1B4B',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4338CA',
    marginBottom: 8,
  },
  badgeThemeText: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: 'bold',
  },
  titlePrimary: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  authorsRow: {
    marginTop: 8,
  },
  authorsText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  inputCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  codeFormatInput: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
    color: Colors.primary,
    marginBottom: 14,
  },
  menuButtons: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  wifiButton: {
    backgroundColor: '#0C4A6E',
    borderColor: Colors.primary,
  },
  joinButton: {
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1',
  },
  localButton: {
    backgroundColor: '#064E3B',
    borderColor: Colors.success,
  },
  buttonIcon: {
    fontSize: 26,
    marginRight: 14,
  },
  buttonTextGroup: {
    flex: 1,
  },
  buttonMainText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonSubText: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
  },
  secondaryActions: {
    marginTop: 10,
    gap: 8,
  },
  outlineButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  outlineButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  teacherButton: {
    borderColor: Colors.secondaryDark,
  },
  teacherButtonText: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  serverConfigLink: {
    alignItems: 'center',
    marginTop: 6,
  },
  serverConfigText: {
    color: Colors.textMuted,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  formCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  formDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 16,
  },
  hotspotTipCard: {
    backgroundColor: '#1E1B4B',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4338CA',
    marginBottom: 12,
  },
  hotspotTipTitle: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  hotspotTipText: {
    color: '#E0E7FF',
    fontSize: 10,
    lineHeight: 15,
  },
  hotspotQuickBtn: {
    backgroundColor: '#0C4A6E',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 12,
    alignItems: 'center',
  },
  hotspotQuickBtnText: {
    color: '#E0F2FE',
    fontSize: 11,
    fontWeight: 'bold',
  },
  serverInfoBox: {
    backgroundColor: Colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 14,
    alignItems: 'center',
  },
  serverInfoLabel: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  serverInfoUrl: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginVertical: 2,
  },
  changeIpText: {
    color: Colors.secondary,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  boldText: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  confirmBtn: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  scanStatusText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});
