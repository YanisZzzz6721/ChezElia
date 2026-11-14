"use client";

import { FAQ_ANSWER_MAX_LENGTH, FAQ_QUESTION_MAX_LENGTH } from "@/content/faq";
import { createFaqAction, updateFaqAction } from "@/app/admin/_actions/faq";
import { ActionForm } from "./ActionForm";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

/** Formulaire d'ajout d'une question fréquente. */
export function CreateFaqForm() {
  return (
    <ActionForm action={createFaqAction} className="adm-card adm-form">
      <label className="adm-label" htmlFor="new-faq-question">Nouvelle question</label>
      <input className="adm-input" id="new-faq-question" name="question" maxLength={FAQ_QUESTION_MAX_LENGTH} required placeholder="Ex. Êtes-vous ouverts le dimanche ?" />
      <label className="adm-label" htmlFor="new-faq-answer">Réponse</label>
      <textarea className="adm-input" id="new-faq-answer" name="answer" maxLength={FAQ_ANSWER_MAX_LENGTH} rows={4} required />
      <p className="adm-hint">Réponse de {FAQ_ANSWER_MAX_LENGTH} caractères maximum. Les retours à la ligne sont conservés.</p>
      <div className="adm-inline"><SubmitButton pendingLabel="Ajout…">Ajouter la question</SubmitButton></div>
      <FormMessage />
    </ActionForm>
  );
}

/** Formulaire de modification d'une question existante (question + réponse). */
export function EditFaqForm({ id, question, answer }: { id: string; question: string; answer: string }) {
  return (
    <ActionForm action={updateFaqAction} className="adm-form adm-faq-edit">
      <input type="hidden" name="id" value={id} />
      <label className="adm-label" htmlFor={`faq-q-${id}`}>Question</label>
      <input className="adm-input" id={`faq-q-${id}`} name="question" defaultValue={question} maxLength={FAQ_QUESTION_MAX_LENGTH} required />
      <label className="adm-label" htmlFor={`faq-a-${id}`}>Réponse</label>
      <textarea className="adm-input" id={`faq-a-${id}`} name="answer" defaultValue={answer} maxLength={FAQ_ANSWER_MAX_LENGTH} rows={4} required />
      <div className="adm-inline"><SubmitButton variant="ghost" pendingLabel="Enregistrement…">Enregistrer</SubmitButton></div>
      <FormMessage />
    </ActionForm>
  );
}
