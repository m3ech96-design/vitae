import { VitaecomAccount, VitaecomPost } from "./vitaecom-social-types";

/**
 * Non esiste ancora un backend: questi sono gli unici "altri account" che vedrai in
 * Vitaeworld, solo per farti vedere come si presenta il tutto una volta popolato — vedi
 * `isDemo` su ciascuno. Il giorno di un vero database, questo file smette semplicemente
 * di essere importato: nessun'altra parte del codice dipende da questi dati per esistere.
 */
export const DEMO_ACCOUNTS: VitaecomAccount[] = [
  { id: "demo-nina", nickname: "nina.tra.le.nuvole", isDemo: true },
  { id: "demo-leo", nickname: "leo_84", isDemo: true },
  { id: "demo-sara", nickname: "sarasa.wandering", isDemo: true },
];

const HOUR = 3_600_000;

export function buildDemoPosts(): VitaecomPost[] {
  const now = Date.now();
  return [
    {
      id: "demo-post-1",
      authorId: "demo-nina",
      createdAt: new Date(now - 3 * HOUR).toISOString(),
      moodId: "sereno",
      caption: "Un caffè lungo, la finestra aperta, e nessuna fretta di andare da nessuna parte.",
      tags: [],
      likedByUser: false,
      likeCount: 4,
      comments: [
        {
          id: "demo-c1",
          authorId: "demo-leo",
          text: "Il migliore modo di iniziare la giornata.",
          createdAt: new Date(now - 2.5 * HOUR).toISOString(),
          likedByUser: false,
          likeCount: 1,
          replies: [],
        },
      ],
      isDemo: true,
    },
    {
      id: "demo-post-2",
      authorId: "demo-leo",
      createdAt: new Date(now - 26 * HOUR).toISOString(),
      moodId: "energico",
      caption: "Prima corsa della settimana fatta. Le gambe si lamentano, la testa ringrazia.",
      tags: [],
      likedByUser: true,
      likeCount: 11,
      comments: [],
      isDemo: true,
    },
    {
      id: "demo-post-3",
      authorId: "demo-sara",
      createdAt: new Date(now - 50 * HOUR).toISOString(),
      moodId: "nostalgico",
      caption: "Ho ritrovato una foto di dieci anni fa oggi. Certe cose non invecchiano davvero.",
      tags: [],
      likedByUser: false,
      likeCount: 7,
      comments: [
        {
          id: "demo-c2",
          authorId: "demo-nina",
          text: "Quale foto?! Devi mandarmela",
          createdAt: new Date(now - 49 * HOUR).toISOString(),
          likedByUser: false,
          likeCount: 0,
          replies: [
            {
              id: "demo-c2-r1",
              authorId: "demo-sara",
              text: "Te la mando in chat 🙂",
              createdAt: new Date(now - 48 * HOUR).toISOString(),
              likedByUser: false,
              likeCount: 0,
              replies: [],
            },
          ],
        },
      ],
      isDemo: true,
    },
  ];
}
