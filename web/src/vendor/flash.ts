// one-time message after saving a form
let message: { text: string; at: number } | null = null;
export const setFlash = (text: string) => {
  message = { text, at: Date.now() };
};
export const takeFlash = () => (message && Date.now() - message.at < 4000 ? message.text : null);
