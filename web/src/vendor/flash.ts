/** One-shot confirmation message carried across a client-side navigation (expires after a few seconds). */
let message: { text: string; at: number } | null = null;
export const setFlash = (text: string) => {
  message = { text, at: Date.now() };
};
export const takeFlash = () => (message && Date.now() - message.at < 4000 ? message.text : null);
