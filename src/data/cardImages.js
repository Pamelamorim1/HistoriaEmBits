// Mapeamento de IDs de carta para imagens locais em assets/cards/
// require() precisa ser estático no React Native, por isso o mapeamento manual.

const cardImages = {
  card_00: require('../../assets/cards/card_00_independencia_brasil.png'),
  card_01: require('../../assets/cards/card_01_queda_bastilha.png'),
  card_02: require('../../assets/cards/card_02_independencia_eua.png'),
  card_03: require('../../assets/cards/card_03_maquina_vapor.png'),
  card_04: require('../../assets/cards/card_04_revolucao_haitiana.png'),
  card_05: require('../../assets/cards/card_05_familia_real.png'),
  card_06: require('../../assets/cards/card_06_congresso_viena.png'),
  card_07: require('../../assets/cards/card_07_waterloo.png'),
  card_08: require('../../assets/cards/card_08_confederacao_equador.png'),
  card_09: require('../../assets/cards/card_09_manifesto_comunista.png'),
  card_10: require('../../assets/cards/card_10_proclamacao_republica.png'),
};

/**
 * Retorna a source da imagem local para um card_id.
 * Se não encontrar, retorna null.
 */
export function getCardImage(cardId) {
  return cardImages[cardId] || null;
}

export default cardImages;
