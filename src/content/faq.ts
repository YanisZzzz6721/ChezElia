/** Une question fréquente telle qu'affichée sur le site. */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/** Limites de longueur (en caractères) ; la base de données applique les mêmes (migration 20261114000000_faq.sql). */
export const FAQ_QUESTION_MAX_LENGTH = 200;
export const FAQ_ANSWER_MAX_LENGTH = 1000;
