export function laudoGreeting(vetName: string): string {
  const name = vetName.trim() ? `Dr(a). ${vetName.trim()}` : "doutor(a)";
  return `Olá ${name}! Posso tirar dúvidas clínicas, comentar imagens de exame ou gerar um laudo de ultrassom abdominal. Como posso ajudar?`;
}
