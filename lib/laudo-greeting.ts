export function laudoGreeting(vetName: string): string {
  const name = vetName.trim() ? `Dr(a). ${vetName.trim()}` : "doutor(a)";
  return `Olá ${name}, vou te auxiliar a gerar um laudo de ultrassom abdominal. Para qual cliente é esse laudo?`;
}
