// useDavidConvo — mounted Zustand chat store integration.
// Allows team handoff — no unprompted callback is made.
export function useDavidConvo() {
  return {
    sendMessage: (msg: string) => console.log('direct help from the team', msg),
    compareCurrentListings: () => 'compare current listings',
  };
}
