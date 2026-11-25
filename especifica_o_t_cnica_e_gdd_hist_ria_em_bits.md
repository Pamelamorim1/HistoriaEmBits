# Documento de Especificação de Produto e Design de Jogo (PRD & GDD)
## Projeto: **História em Bits** (Versão Mobile Multiplayer Local)

* **Público-Alvo:** Estudantes do 1º ano do Ensino Médio (15 a 16 anos).
* **Componentes Curriculares:** História e Computação / Lógica Binária.
* **Habilidades BNCC:** `EM13CHS103` (Hipóteses, evidências e argumentação histórica) e `EM13CO13` (Representação e consulta de dados em formato digital).
* **Tema Base:** Era das Revoluções (Séculos XVIII e XIX) — *Arquitetura modular para troca de baralhos pelo docente*.
* **Autoras do Design Pedagógico:** Andresa Fernandes, Fernanda Abreu, Pâmela Amorim.

---

## 1. Visão Geral e Arquitetura de Rede (Wi-Fi Local)

O **História em Bits** é um jogo cooperativo digital multiplayer projetado para rodar em dispositivos móveis (via navegador mobile responsivo / PWA ou empacotado via Capacitor/React Native) conectados à **mesma rede Wi-Fi local**.

### 1.1. Stack Tecnológica Recomendada (JavaScript Full-Stack)
* **Frontend:** HTML5, CSS3 (Tailwind CSS), JavaScript (React ou Vue.js) com suporte a *Drag-and-Drop* touch-friendly e layout *Mobile-First* (orientação retrato).
* **Backend / Servidor Local:** Node.js + Express + **Socket.io** (comunicação bidirecional em tempo real de baixa latência).
* **Persistência em Memória / Leve:** Estado das salas mantido em memória RAM no servidor Node.js e histórico das partidas salvas em arquivo JSON local ou SQLite para consulta posterior do docente.

### 1.2. Restrições de Capacidade e Salas
* **Limite de Salas Simultâneas:** Máximo de **5 salas ativas** no servidor simultaneamente (ex.: `SALA-01` a `SALA-05`, ou códigos gerados até o teto de 5 instâncias). Caso um 6º grupo tente criar uma sala, o sistema exibe: *"Limite máximo de 5 salas atingido. Aguarde uma turma finalizar ou entre em uma sala existente."*
* **Limite de Jogadores por Sala:** Mínimo de 2 e **máximo de 5 jogadores** por sala (conforme especificação do Canvas). Ao atingir 5 participantes, a sala é travada para novas entradas.
* **Tamanho do Baralho por Partida:** 8 a 10 cartas históricas por sessão (otimizado para o tempo de uma aula de 45–50 minutos).

---

## 2. Papéis e Sincronização de Interface (UX/UI)

Para evitar que apenas um aluno monopolize o jogo e incentivar o debate em grupo (conforme previsto no Canvas), o sistema adota **rotação automática de liderança a cada rodada**:

### 2.1. Estados de Visualização na Mesma Sala
Todos os até 5 celulares conectados à sala compartilham o estado da mesa em tempo real, mas com permissões distintas na rodada atual:

1. **Líder da Rodada (1 jogador por turno — rotativo em ordem de entrada):**
   * Visualiza a carta histórica atual (imagem + título, sem o ano).
   * Visualiza as **3 opções de códigos binários** disponíveis.
   * Possui os controles ativos para: **selecionar/trocar** o código binário escolhido, **digitar** o ano convertido na caixa de texto, **confirmar** o palpite e **arrastar/posicionar** a carta na linha do tempo.
   * *Banner superior:* `"VOCÊ É O LÍDER DA RODADA — Debata com o grupo antes de confirmar!"`

2. **Integrantes da Equipe (demais jogadores da sala):**
   * Visualizam exatamente a mesma carta histórica, as 3 opções binárias, a opção que o Líder selecionou no momento (destacada em tempo real) e a linha do tempo atual.
   * Os botões de envio ficam desabilitados (*modo espectador ativo/colaborativo*), incentivando-os a fazer os cálculos em conjunto e argumentar verbalmente com o Líder.
   * *Banner superior:* `"LÍDER ATUAL: [Nome do Aluno] — Ajude na conversão e na justificativa histórica!"`

### 2.2. Botão Global de Apoio Pedagógico ("Guia Binário")
Presente no cabeçalho de **todas as telas de jogo** para todos os jogadores:
* **Ícone/Botão:** `[ ? Tabela $2^n$ & Como Calcular ]`
* **Ação:** Abre um *Modal* (sobreposição sem sair da partida) contendo:
  1. **Tabela de Potências de 2** (de $2^{10} = 1024$ até $2^0 = 1$).
  2. **Exemplo Prático Passo a Passo:** Demonstração visual de como somar apenas as posições com bit `1` (ex.: `11011111101` $\rightarrow$ $1024 + 512 + 0 + 128 + 64 + 32 + 16 + 8 + 4 + 0 + 1 = 1789$).

---

## 3. Fluxo Completo da Partida e Mecânicas

### Etapa 1: Lobby e Configuração
* **Tela Inicial:** Opções `Entrar em Sala` (Aluno) e `Painel do Professor` (Protegido por senha).
* **Lobby da Sala:** Exibe lista de jogadores conectados ($X/5$), status de pronto e botão `Iniciar Partida` (disponível quando houver $\ge 2$ jogadores).
* **Setup Inicial:** O sistema sorteia **1 Carta Central de Referência** já posicionada no centro da Linha do Tempo com seu ano decimal e binário revelados (ex.: *Independência do Brasil — 1822 / `11100011110`*) e exibe a pontuação inicial da equipe (ex.: **1000 pontos**).

### Etapa 2: Fase de Decodificação Binária (Ação do Líder)
A cada rodada, uma nova **Carta de Acontecimento Histórico** é revelada (ex.: *Queda da Bastilha*, com imagem ilustrativa e título, sem data) junto com **3 cartões de códigos binários** (1 correto + 2 distratores plausíveis de outros eventos).

1. **Seleção do Código Binário:**
   * O Líder toca em um dos 3 códigos binários que o grupo acredita pertencer à imagem/evento.
   * *Flexibilidade:* O Líder pode trocar a seleção entre os 3 códigos livremente antes de confirmar a resposta.
2. **Conversão para Decimal:**
   * Ao selecionar um código, habilita-se a **Caixa de Texto Numérica** (`Digite o ano em decimal`).
   * O grupo converte o binário selecionado (consultando a Tabela $2^n$ se necessário) e o Líder digita o ano (ex.: `1789`).
3. **Validação:**
   * O Líder toca em `Verificar Ano`.
   * **Se Acertar (Código binário correto E conversão decimal exata):**
     * Feedback visual verde + som de sucesso.
     * A equipe mantém os pontos (ou ganha bônus por acerto de primeira) e avança para a **Etapa 3 (Linha do Tempo)**.
   * **Se Errar (Código errado ou cálculo incorreto):**
     * Desconta-se uma penalidade da pontuação da equipe (ex.: `-50 pontos`).
     * Aciona-se o **Sistema de Dicas Progressivas**.

### Etapa 3: Sistema de Dicas Progressivas e 3ª Tentativa
Cada erro na decodificação de uma carta incrementa o contador de tentativas daquela rodada e exibe uma dica contextual específica cadastrada na carta:

* **Erro 1 (Tentativa 1 falhou):**
  * Penalidade: `-50 pts`.
  * Exibe **Dica 1 (Contexto Histórico / Século):** Pista sobre o período, século ou relação de causa/consequência (ex.: *"Este evento marcou o início da Revolução Francesa no final do século XVIII."*).
* **Erro 2 (Tentativa 2 falhou):**
  * Penalidade: `-50 pts`.
  * Exibe **Dica 2 (Pista Matemática / Eliminação):** Elimina 1 dos códigos binários incorretos da tela OU revela os dois primeiros dígitos do ano (ex.: *"O código `11101001100` não pertence a este evento. O ano começa com 17..."*).
* **Erro 3 (Tentativa 3 falhou — Escolha Crítica):**
  * Penalidade: `-50 pts`.
  * Exibe **Dica 3 (Pista Específica Final)** e abre um **Modal de Decisão para o Grupo**:
    > *"Vocês já tentaram 3 vezes! Como desejam prosseguir?"*
    * **Opção A — Continuar Tentando:** Fecha o modal e permite novas tentativas usando as 3 dicas já reveladas (cada novo erro continua descontando `-25 pts`).
    * **Opção B — Revelar Resposta:** Desconta uma penalidade maior (ex.: `-150 pts`), revela o código binário correto e o ano decimal, registra no log do professor que houve *"Revelação Assistida"* e avança obrigatoriamente para a **Etapa 4 (Posicionamento na Linha do Tempo)**.

### Etapa 4: Posicionamento na Linha do Tempo (Consenso Histórico)
Com o ano decodificado em mãos, a carta exibe seu ano decimal e binário. Agora o grupo precisa inseri-la na **Linha do Tempo Coletiva** (que cresce horizontalmente com rolagem).

1. **Debate de Critério:** A tela exibe um lembrete pedagógico: *"Antes de posicionar, declarem em voz alta para o grupo: este evento vem ANTES ou DEPOIS das cartas na mesa e por quê?"*
2. **Posicionamento:** O Líder seleciona o slot (`[ + Inserir Aqui ]`) entre as cartas já existentes na linha do tempo.
3. **Verificação Cronológica:**
   * **Posição Correta:** A carta é fixada permanentemente na linha do tempo. O turno encerra, a liderança rotaciona para o próximo jogador da sala e uma nova carta é comprada.
   * **Posição Incorreta:** A carta vibra em vermelho, desconta `-30 pontos` da equipe, exibe um alerta (*"Atenção à ordem cronológica! Compare o ano [X] com as cartas vizinhas"*) e exige que o Líder escolha a posição correta antes de passar a vez.

### Etapa 5: Encerramento da Partida
* Quando todas as 8 a 10 cartas do baralho forem posicionadas na linha do tempo, a partida é concluída.
* Exibe a **Tela de Vitória Cooperativa** com:
  * Pontuação final da equipe.
  * Linha do tempo completa construída pelo grupo.
  * Resumo estatístico (total de acertos de primeira, dicas usadas, tempo total).

---

## 4. Área do Professor (Relatório Protegido por Senha)

Para atender às evidências de aprendizagem (`EM13CHS103` e `EM13CO13`) e substituir/complementar a ficha de registro em papel do Canvas, o aplicativo gera automaticamente um **Relatório Pedagógico da Partida**.

### 4.1. Acesso Restrito
* Acessível pelo botão `Área do Professor` na tela inicial ou no ícone de cadeado ao final da partida.
* Exige uma **Senha Docente** configurada no servidor (ex.: via variável de ambiente `.env`, padrão configurável como `PROF2026`).
* Alunos não conseguem visualizar os dados detalhados de diagnóstico sem a senha.

### 4.2. Conteúdo do Relatório Gerado Automaticamente
Para cada sala finalizada, o professor visualiza na tela e pode exportar em `.JSON` ou `.CSV` / Imprimir:
1. **Identificação:** Número da Sala (`SALA-01` a `SALA-05`), Data/Hora, Duração da partida e Nomes dos integrantes (até 5 alunos).
2. **Desempenho Geral:** Pontuação final, taxa de precisão binária (%) e taxa de precisão cronológica (%).
3. **Log Detalhado Rodada a Rodada (Registro Algorítmico):**
   * Qual aluno foi o **Líder** da rodada.
   * Qual carta foi jogada.
   * Histórico de palpites (ex.: *"Tentativa 1: selecionou binário errado e digitou 1804 $\rightarrow$ Tentativa 2: acertou binário e digitou 1789"*).
   * Quantas dicas foram utilizadas ou se pediu *"Revelar Resposta"*.
   * Se houve erro ao posicionar na linha do tempo (indicando dificuldade de comparação numérica/cronológica).
4. **Gerenciador de Salas (Controle Docente):** Botão para encerrar/resetar salas travadas e liberar vagas entre as 5 salas disponíveis.

---

## 5. Estrutura de Dados (Modelagem JSON das Cartas)

Para permitir que o professor altere o tema histórico futuramente sem mexer no código, o baralho deve ser alimentado por um arquivo `cards.json` seguindo esta estrutura:

```json
{
  "deck_id": "era_das_revolucoes_v1",
  "titulo_baralho": "Era das Revoluções (Séculos XVIII e XIX)",
  "carta_central_inicial": {
    "id": "card_00",
    "titulo": "Independência do Brasil",
    "ano_decimal": 1822,
    "ano_binario": "11100011110",
    "imagem_url": "/assets/cards/independencia_brasil.jpg",
    "resumo_historico": "Proclamação da ruptura política entre Brasil e Portugal às margens do riacho Ipiranga."
  },
  "cartas": [
    {
      "id": "card_01",
      "titulo": "Queda da Bastilha (Revolução Francesa)",
      "ano_decimal": 1789,
      "ano_binario": "11011111101",
      "distratores_binarios": [
        "11011100110",
        "11100001100"
      ],
      "imagem_url": "/assets/cards/queda_bastilha.jpg",
      "dicas": {
        "dica_1_contexto": "Este acontecimento simbolizou o início da Revolução Francesa e a queda do Absolutismo no final do século XVIII.",
        "dica_2_matematica": "O bit mais significativo (2^10) vale 1024, e o ano ocorre na década de 1780.",
        "dica_3_especifica": "O último dígito do código binário correto é 1 (portanto, o ano é um número ímpar entre 1785 e 1791)."
      }
    },
    {
      "id": "card_02",
      "titulo": "Declaração de Independência dos EUA",
      "ano_decimal": 1776,
      "ano_binario": "11011110000",
      "distratores_binarios": [
        "11011111101",
        "11100000111"
      ],
      "imagem_url": "/assets/cards/independencia_eua.jpg",
      "dicas": {
        "dica_1_contexto": "As Treze Colônias declararam ruptura com o Império Britânico antes da Revolução Francesa.",
        "dica_2_matematica": "Repare que os últimos quatro dígitos do binário correto são '0000', o que torna o ano divisível por 16.",
        "dica_3_especifica": "O evento ocorreu na década de 1770, exatamente 13 anos antes da Queda da Bastilha."
      }
    }
  ]
}
```

---

## 6. Eventos WebSocket (Socket.io) — Especificação de API em Tempo Real

Para guiar a implementação do backend em Node.js e do frontend em JavaScript:

| Evento (Client $\rightarrow$ Server) | Payload | Descrição / Validação no Servidor |
| :--- | :--- | :--- |
| `create_room` | `{ playerName }` | Verifica se `activeRooms.size < 5`. Cria sala e define jogador 1. |
| `join_room` | `{ roomId, playerName }` | Verifica se sala existe e `players.length < 5`. Adiciona jogador. |
| `start_game` | `{ roomId }` | Sorteia carta central + 8 a 10 cartas do baralho e define `leaderIndex = 0`. |
| `select_binary` | `{ roomId, binaryString }` | **Apenas Líder.** Atualiza em tempo real qual dos 3 binários está selecionado na tela de todos. |
| `submit_year` | `{ roomId, binaryString, guessedYear }` | **Apenas Líder.** Valida binário + ano. Se errar, desconta pontos e retorna Dica 1, 2 ou trigger da 3ª tentativa. |
| `resolve_third_attempt` | `{ roomId, action: 'continue' \| 'reveal' }` | **Apenas Líder.** Se `'reveal'`, desconta 150 pts, libera resposta e vai para fase de linha do tempo. |
| `place_card_timeline` | `{ roomId, insertIndex }` | **Apenas Líder.** Verifica se `guessedYear` está ordenado corretamente entre `timeline[insertIndex - 1]` e `timeline[insertIndex]`. |
| `admin_get_reports` | `{ password }` | Valida senha do professor e retorna histórico completo das salas e logs das partidas. |

---

## 7. Checklist de Critérios de Aceite (MVP)

- [ ] Servidor bloqueia criação além de **5 salas simultâneas**.
- [ ] Sala bloqueia entrada além de **5 jogadores simultâneos**.
- [ ] Rotação automática do **Líder da Rodada** a cada carta concluída.
- [ ] Líder consegue selecionar e **trocar** a opção binária antes de submeter o ano digitado.
- [ ] Botão **Tabela de Potências de 2** acessível a qualquer momento sem perder o estado da partida.
- [ ] Sistema de **3 dicas progressivas** funcional com prompt de *"Continuar ou Revelar Resposta"* no 3º erro e desconto de pontos.
- [ ] Validação cronológica na linha do tempo antes de passar o turno.
- [ ] **Relatório pedagógico** gerado automaticamente ao fim da partida, acessível exclusivamente via senha do docente.