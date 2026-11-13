import { router } from 'expo-router';

/**
 * Écrans de chat :
 *  - celui affiché au premier plan : ses notifications ne s'affichent pas en bannière (on voit
 *    déjà le message arriver), comme sur WhatsApp ;
 *  - ceux encore ouverts dans la pile de navigation : on y revient au lieu d'en empiler un autre.
 */
let focusedChatSessionId: string | null = null;
const mountedChats = new Map<string, number>(); // session -> nombre d'écrans ouverts

export const activeChat = {
  focus: (sessionId: string) => {
    focusedChatSessionId = sessionId;
  },
  /** Ne s'efface que si c'est encore ce chat : le chat qui prend le relais a pu déjà s'enregistrer */
  blur: (sessionId: string) => {
    if (focusedChatSessionId === sessionId) focusedChatSessionId = null;
  },
  is: (sessionId: string | undefined | null) => !!sessionId && sessionId === focusedChatSessionId,

  mount: (sessionId: string) => {
    mountedChats.set(sessionId, (mountedChats.get(sessionId) ?? 0) + 1);
    return () => {
      const count = (mountedChats.get(sessionId) ?? 1) - 1;
      if (count <= 0) mountedChats.delete(sessionId);
      else mountedChats.set(sessionId, count);
    };
  },
  isMounted: (sessionId: string) => mountedChats.has(sessionId),
};

/**
 * Ouvre le chat d'une session (notification, bouton de la fiche session) sans empiler de doublon :
 * déjà ouvert quelque part dans la pile → on y revient ; sinon → nouvel écran.
 * (Le chat est identifié par sa session dans le Stack, cf. getId dans app/_layout.tsx.)
 */
export function openChat(sessionId: string): void {
  if (activeChat.isMounted(sessionId)) {
    router.dismissTo(`/chat/${sessionId}`);
  } else {
    router.navigate(`/chat/${sessionId}`);
  }
}
