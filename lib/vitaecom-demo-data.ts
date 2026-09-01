import { VitaecomAccount, VitaecomPost } from "./vitaecom-social-types";

/**
 * Non esiste ancora un backend: questi sono gli unici "altri account" che vedrai in
 * Vitaeworld, solo per farti vedere come si presenta il tutto una volta popolato — vedi
 * `isDemo` su ciascuno. Il giorno di un vero database, questo file smette semplicemente
 * di essere importato: nessun'altra parte del codice dipende da questi dati per esistere.
 */
export const DEMO_ACCOUNTS: VitaecomAccount[] = [
  {
    id: "demo-nina",
    nickname: "nina.tra.le.nuvole",
    isDemo: true,
    showcaseItems: [
      "Occupazione: Illustratrice freelance",
      "Bevanda Del Mattino: Caffè lungo, sempre",
      "Posto Preferito In Città: Il tavolino vicino alla finestra del bar sotto casa",
    ],
    // Nuvoletta e frase azione dimostrative — stessa idea della vetrina qui sopra, non
    // generate da un profilo vero: mostrano come apparirebbero su un vero account altrui.
    dialogModeEnabled: true,
    recurringPhrases: [
      { id: "demo-nina-p1", text: "Oggi la luce era perfetta" },
      { id: "demo-nina-p2", text: "Un'altra tavola quasi finita" },
    ],
    liveModeEnabled: true,
    actionPhrase: { id: "demo-nina-a1", text: "disegnando con la luce del pomeriggio", mode: "casuale" },
  },
  {
    id: "demo-leo",
    nickname: "leo_84",
    isDemo: true,
    showcaseItems: [
      "Occupazione: Personal trainer",
      "Sport: Corsa, tre volte a settimana",
      "Obiettivo Di Quest'Anno: Finire la sua prima mezza maratona",
    ],
    liveModeEnabled: true,
    actionPhrase: { id: "demo-leo-a1", text: "correndo i suoi soliti otto chilometri", mode: "orario", startTime: "18:00", endTime: "19:30" },
  },
  {
    id: "demo-sara",
    nickname: "sarasa.wandering",
    isDemo: true,
    showcaseItems: [
      "Occupazione: Archivista",
      "Passione: Fotografie vecchie e storie di famiglia",
      "Città Del Cuore: Dove è cresciuta, non dove vive ora",
    ],
  },
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
      // Ti tagga in quella foto — anche i tag notificano l'utente taggato (vedi
      // vitaecom-social-context.tsx, seeding delle notifiche alla primissima apertura).
      tags: [{ accountId: "user" }],
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
    {
      id: "demo-story-1",
      authorId: "demo-nina",
      createdAt: new Date(now - 4 * HOUR).toISOString(),
      isStory: true,
      expiresAt: new Date(now + 20 * HOUR).toISOString(),
      moodId: "sereno",
      caption: "Domenica lenta, il tempo giusto per non fare niente.",
      tags: [],
      likedByUser: false,
      likeCount: 2,
      comments: [],
      isDemo: true,
    },
    {
      id: "demo-story-2",
      authorId: "demo-leo",
      createdAt: new Date(now - 2 * HOUR).toISOString(),
      isStory: true,
      expiresAt: new Date(now + 22 * HOUR).toISOString(),
      moodId: "energico",
      caption: "Prima corsa della giornata fatta, il resto viene da sé.",
      tags: [],
      likedByUser: false,
      likeCount: 5,
      comments: [],
      isDemo: true,
    },
  ];
}
