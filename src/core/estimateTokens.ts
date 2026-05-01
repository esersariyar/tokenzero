export function estimateTokens(input: string): number {
  if (!input) return 0;
  return Math.ceil(input.length / 4);
}
