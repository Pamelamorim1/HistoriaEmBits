# História em Bits (Mobile Multiplayer Local) 🎮📜

> **Jogo Cooperativo Digital de História e Lógica Binária para o Ensino Médio**  
> Desenvolvido com **Expo Go SDK 58** (Android) em **JavaScript (React Native + Node.js Socket.io)**.  
> Alinhado às habilidades da BNCC: **`EM13CHS103`** (Hipóteses, evidências e cronologia histórica) e **`EM13CO13`** (Representação de dados em lógica binária).

---

## 👥 Autoras do Design Pedagógico
- **Andresa Fernandes**
- **Fernanda Abreu**
- **Pâmela Amorim**

---

## 🚀 Como Executar o Projeto

### 1. Iniciar o Servidor Multiplayer Local (Wi-Fi)
Em um terminal na raiz do projeto:
```bash
npm run server
```
O servidor inicializará na porta `3000` (ex: `http://192.168.1.X:3000`), exibindo:
- Porta local ativa
- Limite máximo de **5 salas simultâneas**
- Senha de acesso docente padrão: `PROF2026`

### 2. Iniciar o Aplicativo Móvel (Expo Go SDK 58)
Em outro terminal:
```bash
npm start
```
- Abra o aplicativo **Expo Go** no seu celular Android (conectado à mesma rede Wi-Fi).
- Aponte a câmera para o QR Code gerado pelo Metro Bundler no terminal.
- Se estiver usando o emulador Android do Android Studio, pressione `a` no terminal.

---

## 🎯 Mecânicas e Regras Implementadas (Conforme PRD & GDD)

1. **Arquitetura de Rede Wi-Fi & Limites:**
   - **Teto de 5 salas simultâneas** (`SALA-01` a `SALA-05`). Caso tente criar uma 6ª sala, o sistema bloqueia exibindo aviso pedagógico.
   - **Capacidade de 2 a 5 participantes por sala**, travando automaticamente ao atingir 5 alunos.
2. **Rotação Automática de Liderança a Cada Rodada:**
   - **Líder da Rodada:** Possui os botões ativos para selecionar e trocar entre os 3 códigos binários, digitar o ano em decimal, confirmar palpite e posicionar a carta na linha do tempo.
   - **Integrantes da Equipe:** Modo colaborativo em tempo real — visualizam as escolhas do líder imediatamente, calculando em conjunto com a equipe.
3. **Botão Global "Guia 2ⁿ & Como Calcular":**
   - Presente no cabeçalho em todas as telas sem perder o progresso.
   - Contém a **Tabela de Potências de $2^{10}$ (1024) a $2^0$ (1)**, **Exemplo Passo a Passo** (Queda da Bastilha - 1789) e **Simulador Interativo de Bits** para testar valores.
4. **Sistema de 3 Dicas Progressivas & Decisão do 3º Erro:**
   - **1º Erro (-50 pts):** Desbloqueia *Dica 1 (Contexto Histórico / Século)*.
   - **2º Erro (-50 pts):** Desbloqueia *Dica 2 (Pista Matemática / Eliminação)*.
   - **3º Erro (-50 pts):** Desbloqueia *Dica 3 (Pista Específica Final)* e aciona o **Modal de Escolha Crítica**:
     - *Opção A (Continuar Tentando):* Novas tentativas descontam -25 pts.
     - *Opção B (Revelar Resposta):* Desconta -150 pts, registra "Revelação Assistida" e avança para a linha do tempo.
5. **Linha do Tempo Coletiva (Ordenação Cronológica):**
   - Slots de inserção `[ + Inserir Aqui ]` interativos.
   - Se errar a posição cronológica: alerta pedagógico sonoro/visual, desconto de -30 pts e exigência de correção coletiva.
6. **Área do Professor (Protegida por Senha):**
   - Senha padrão: `PROF2026`.
   - Gera automaticamente relatório com diagnósticos das habilidades `EM13CHS103` e `EM13CO13`, precisão percentual, taxa de acertos de 1ª tentativa e registro algorítmico rodada a rodada.
   - Inclui gerenciador de salas ativas com controle para encerrar turmas e liberar vagas.
7. **Modo Mesa Única / Local Standalone:**
   - Permite jogar e testar instantaneamente em um único celular Android compartilhado (passa ou joga) mesmo sem servidor externo configurado.

---

## 📂 Estrutura de Arquivos

```
HistoriaEmBits/
├── App.js                         # Ponto de entrada React Native & State Machine
├── app.json                       # Configuração Expo SDK 58 (Android package)
├── package.json                   # Dependências Expo 58, React 19, Socket.io
├── server/
│   └── index.js                   # Servidor Node.js + Socket.io + REST API
├── src/
│   ├── data/
│   │   └── cards.json             # Baralho modular (Era das Revoluções - 10 cartas)
│   ├── theme/
│   │   └── colors.js              # Paleta de cores Cyber-Vintage Dark
│   ├── components/
│   │   ├── Header.js              # Cabeçalho com pontuação, rodada e papel do líder
│   │   ├── BinaryGuideModal.js    # Modal pedagógico com tabela 2ⁿ e calculadora de bits
│   │   ├── TimelineView.js        # Linha do tempo horizontal com slots interativos
│   │   └── ThirdAttemptModal.js   # Modal de decisão da 3ª tentativa
│   ├── screens/
│   │   ├── HomeScreen.js          # Menu inicial (Wi-Fi, Local, Professor, Guia)
│   │   ├── LobbyScreen.js         # Sala de espera multiplayer (2 a 5 alunos)
│   │   ├── GameScreen.js          # Tela principal (Decodificação e Posicionamento)
│   │   ├── VictoryScreen.js       # Tela de Vitória Cooperativa e estatísticas
│   │   └── TeacherScreen.js       # Painel do Professor protegido por senha
│   └── services/
│       ├── socketService.js       # Comunicação WebSocket com o servidor local
│       └── localGameService.js    # Motor de jogo autônomo offline
└── especifica_o_t_cnica_e_gdd_hist_ria_em_bits.md
```
