/**
 * Il catalogo delle fonti selezionabili per le News — punto 1 delle istruzioni: l'app non
 * deve scegliere lei le notizie da mostrare, ma offrire un elenco preciso di testate,
 * magazine e siti tra cui l'utente sceglie da solo, per categoria. Ogni voce è una
 * pubblicazione reale ed esistente (mai un nome inventato) con il suo feed RSS pubblico più
 * noto — alcuni feed possono cambiare indirizzo nel tempo: se una fonte smette di rispondere,
 * la sua categoria mostra semplicemente le altre fonti scelte, mai un errore bloccante (vedi
 * app/api/news/route.ts, già scritta per tollerare un singolo feed rotto).
 *
 * Formato compatto a tupla — [id, nome, categoria, url del feed RSS] — solo per tenere
 * leggibile un elenco di alcune centinaia di voci; convertito in oggetti da NEWS_SOURCES qui
 * sotto, che è quello che il resto dell'app importa davvero.
 */

export interface NewsCategoryDef {
  id: string;
  label: string;
}

export const NEWS_CATEGORIES: NewsCategoryDef[] = [
  { id: "attualita", label: "Attualità" },
  { id: "cronaca", label: "Cronaca" },
  { id: "politica", label: "Politica" },
  { id: "esteri", label: "Esteri" },
  { id: "economia", label: "Economia e Finanza" },
  { id: "sport", label: "Sport" },
  { id: "calcio", label: "Calcio" },
  { id: "tecnologia", label: "Tecnologia" },
  { id: "scienza", label: "Scienza" },
  { id: "salute", label: "Salute e Benessere" },
  { id: "cultura", label: "Cultura" },
  { id: "spettacolo", label: "Spettacolo e Gossip" },
  { id: "cinema-serie", label: "Cinema e Serie TV" },
  { id: "musica", label: "Musica" },
  { id: "libri", label: "Libri" },
  { id: "moda", label: "Moda" },
  { id: "motori", label: "Motori" },
  { id: "viaggi", label: "Viaggi" },
  { id: "cibo", label: "Cibo e Cucina" },
  { id: "ambiente", label: "Ambiente" },
  { id: "casa-design", label: "Casa e Design" },
  { id: "gaming", label: "Gaming" },
  { id: "locali", label: "Edizioni locali" },
];

type Tuple = [string, string, string, string];

const RAW: Tuple[] = [
  // --- Attualità ---------------------------------------------------------------------------
  ["ansa-attualita", "ANSA", "attualita", "https://www.ansa.it/sito/ansait_rss.xml"],
  ["corriere-home", "Corriere della Sera", "attualita", "https://xml2.corriere.it/rss/homepage.xml"],
  ["repubblica-home", "la Repubblica", "attualita", "https://www.repubblica.it/rss/homepage/rss2.0.xml"],
  ["stampa-home", "La Stampa", "attualita", "https://www.lastampa.it/rss.xml"],
  ["sole24ore-italia", "Il Sole 24 Ore", "attualita", "https://www.ilsole24ore.com/rss/italia.xml"],
  ["fattoquotidiano-home", "Il Fatto Quotidiano", "attualita", "https://www.ilfattoquotidiano.it/feed/"],
  ["ilpost-home", "Il Post", "attualita", "https://www.ilpost.it/feed/"],
  ["messaggero-home", "Il Messaggero", "attualita", "https://www.ilmessaggero.it/rss/home.xml"],
  ["giornale-home", "Il Giornale", "attualita", "https://www.ilgiornale.it/feed.xml"],
  ["mattino-home", "Il Mattino", "attualita", "https://www.ilmattino.it/rss/home.xml"],
  ["secoloxix-home", "Il Secolo XIX", "attualita", "https://www.ilsecoloxix.it/rss.xml"],
  ["restodelcarlino-home", "il Resto del Carlino", "attualita", "https://www.ilrestodelcarlino.it/rss/homepage.xml"],
  ["nazione-home", "La Nazione", "attualita", "https://www.lanazione.it/rss/homepage.xml"],
  ["avvenire-attualita", "Avvenire", "attualita", "https://www.avvenire.it/rss/attualita.xml"],
  ["domani-home", "Domani", "attualita", "https://www.editorialedomani.it/rss"],
  ["unionesarda-home", "L'Unione Sarda", "attualita", "https://www.unionesarda.it/rss"],
  ["open-home", "Open", "attualita", "https://www.open.online/feed"],
  ["fanpage-home", "Fanpage", "attualita", "https://www.fanpage.it/feed/"],
  ["today-home", "Today.it", "attualita", "https://www.today.it/rss"],
  ["tgcom24-home", "TGCOM24", "attualita", "https://www.tgcom24.mediaset.it/rss/tuttelenotizie.xml"],
  ["skytg24-home", "Sky TG24", "attualita", "https://tg24.sky.it/rss/tg24.xml"],
  ["rainews-home", "Rai News", "attualita", "https://www.rainews.it/rss/tuttenews"],
  ["euronewsit-home", "Euronews Italia", "attualita", "https://it.euronews.com/rss?level=theme&name=news"],
  ["bbc-world", "BBC News (World)", "attualita", "http://feeds.bbci.co.uk/news/world/rss.xml"],
  ["guardian-world", "The Guardian (World)", "attualita", "https://www.theguardian.com/world/rss"],
  ["aljazeera-all", "Al Jazeera", "attualita", "https://www.aljazeera.com/xml/rss/all.xml"],
  ["nyt-home", "The New York Times", "attualita", "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"],
  ["cnn-edition", "CNN", "attualita", "http://rss.cnn.com/rss/edition.rss"],
  ["huffpostit-home", "HuffPost Italia", "attualita", "https://www.huffingtonpost.it/feeds/index.xml"],
  ["tpi-home", "TPI", "attualita", "https://www.tpi.it/feed"],

  // --- Cronaca -------------------------------------------------------------------------------
  ["ansa-cronaca", "ANSA Cronaca", "cronaca", "https://www.ansa.it/sito/notizie/cronaca/cronaca_rss.xml"],
  ["corriere-cronache", "Corriere Cronache", "cronaca", "https://xml2.corriere.it/rss/cronache.xml"],
  ["repubblica-cronaca", "Repubblica Cronaca", "cronaca", "https://www.repubblica.it/rss/cronaca/rss2.0.xml"],
  ["fanpage-cronaca", "Fanpage Cronaca", "cronaca", "https://www.fanpage.it/attualita/feed/"],
  ["fattoquotidiano-cronaca", "Il Fatto Quotidiano Cronaca", "cronaca", "https://www.ilfattoquotidiano.it/cronaca/feed/"],
  ["stampa-cronaca", "La Stampa Cronaca", "cronaca", "https://www.lastampa.it/rss/cronaca.xml"],
  ["messaggero-cronaca", "Il Messaggero Cronaca", "cronaca", "https://www.ilmessaggero.it/rss/cronaca.xml"],
  ["leggo-home", "Leggo", "cronaca", "https://www.leggo.it/rss/home.xml"],
  ["ilgiorno-home", "Il Giorno", "cronaca", "https://www.ilgiorno.it/rss/homepage.xml"],
  ["quotidiano-net-home", "Quotidiano.net", "cronaca", "https://www.quotidiano.net/rss/homepage.xml"],
  ["virgilio-notizie", "Virgilio Notizie", "cronaca", "https://notizie.virgilio.it/rss/rss_tuttenotizie_homepage.xml"],

  // --- Politica --------------------------------------------------------------------------
  ["ansa-politica", "ANSA Politica", "politica", "https://www.ansa.it/sito/notizie/politica/politica_rss.xml"],
  ["repubblica-politica", "Repubblica Politica", "politica", "https://www.repubblica.it/rss/politica/rss2.0.xml"],
  ["corriere-politica", "Corriere Politica", "politica", "https://xml2.corriere.it/rss/politica.xml"],
  ["fattoquotidiano-politica", "Il Fatto Quotidiano Politica", "politica", "https://www.ilfattoquotidiano.it/politica/feed/"],
  ["stampa-politica", "La Stampa Politica", "politica", "https://www.lastampa.it/rss/politica.xml"],
  ["sole24ore-politica", "Il Sole 24 Ore Politica", "politica", "https://www.ilsole24ore.com/rss/politica.xml"],
  ["formiche-home", "Formiche.net", "politica", "https://formiche.net/feed/"],
  ["ilfoglio-home", "Il Foglio", "politica", "https://www.ilfoglio.it/rss.xml"],
  ["linkiesta-home", "Linkiesta", "politica", "https://www.linkiesta.it/feed/"],
  ["politicoeu-home", "Politico Europe", "politica", "https://www.politico.eu/feed/"],
  ["politicous-home", "Politico", "politica", "https://www.politico.com/rss/politicopicks.xml"],
  ["startmag-home", "Start Magazine", "politica", "https://www.startmag.it/feed/"],

  // --- Esteri ---------------------------------------------------------------------------------
  ["ansa-mondo", "ANSA Mondo", "esteri", "https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml"],
  ["repubblica-esteri", "Repubblica Esteri", "esteri", "https://www.repubblica.it/rss/esteri/rss2.0.xml"],
  ["corriere-esteri", "Corriere Esteri", "esteri", "https://xml2.corriere.it/rss/esteri.xml"],
  ["internazionale-home", "Internazionale", "esteri", "https://www.internazionale.it/rss/home"],
  ["limes-home", "Limes", "esteri", "https://www.limesonline.com/feed"],
  ["cnn-world", "CNN World", "esteri", "http://rss.cnn.com/rss/edition_world.rss"],
  ["guardian-world2", "The Guardian World", "esteri", "https://www.theguardian.com/world/rss"],
  ["lemonde-une", "Le Monde", "esteri", "https://www.lemonde.fr/rss/une.xml"],
  ["elpais-portada", "El País", "esteri", "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada"],
  ["spiegel-intl", "Der Spiegel International", "esteri", "https://www.spiegel.de/international/index.rss"],
  ["france24-en", "France 24", "esteri", "https://www.france24.com/en/rss"],
  ["euronews-home", "Euronews", "esteri", "https://www.euronews.com/rss"],
  ["bbc-europe", "BBC News (Europe)", "esteri", "http://feeds.bbci.co.uk/news/world/europe/rss.xml"],
  ["bbc-us-canada", "BBC News (US & Canada)", "esteri", "http://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml"],
  ["washingtonpost-world", "The Washington Post (World)", "esteri", "http://feeds.washingtonpost.com/rss/world"],
  ["scmp-home", "South China Morning Post", "esteri", "https://www.scmp.com/rss/91/feed"],
  ["japantimes-home", "The Japan Times", "esteri", "https://www.japantimes.co.jp/feed/"],

  // --- Economia e Finanza --------------------------------------------------------------------
  ["sole24ore-economia", "Il Sole 24 Ore Economia", "economia", "https://www.ilsole24ore.com/rss/economia.xml"],
  ["ansa-economia", "ANSA Economia", "economia", "https://www.ansa.it/sito/notizie/economia/economia_rss.xml"],
  ["repubblica-economia", "Repubblica Economia", "economia", "https://www.repubblica.it/rss/economia/rss2.0.xml"],
  ["corriere-economia", "Corriere Economia", "economia", "https://xml2.corriere.it/rss/economia.xml"],
  ["milanofinanza-home", "MilanoFinanza", "economia", "https://www.milanofinanza.it/rss"],
  ["investireoggi-home", "Investire Oggi", "economia", "https://www.investireoggi.it/feed/"],
  ["money-home", "Money.it", "economia", "https://www.money.it/rss"],
  ["forbesit-home", "Forbes Italia", "economia", "https://forbes.it/feed/"],
  ["wallstreetitalia-home", "Wall Street Italia", "economia", "https://www.wallstreetitalia.com/feed/"],
  ["bloomberg-markets", "Bloomberg Markets", "economia", "https://feeds.bloomberg.com/markets/news.rss"],
  ["economist-finance", "The Economist (Finance)", "economia", "https://www.economist.com/finance-and-economics/rss.xml"],
  ["cnbc-home", "CNBC", "economia", "https://www.cnbc.com/id/100003114/device/rss/rss.html"],
  ["ft-home", "Financial Times", "economia", "https://www.ft.com/rss/home"],
  ["wsj-markets", "The Wall Street Journal (Markets)", "economia", "https://feeds.a.dj.com/rss/RSSMarketsMain.xml"],

  // --- Sport -----------------------------------------------------------------------------------
  ["gazzetta-home", "La Gazzetta dello Sport", "sport", "https://www.gazzetta.it/rss/home.xml"],
  ["corrieredellosport-home", "Corriere dello Sport", "sport", "https://www.corrieredellosport.it/rss/home.xml"],
  ["tuttosport-home", "Tuttosport", "sport", "https://www.tuttosport.com/rss/home"],
  ["ansa-sport", "ANSA Sport", "sport", "https://www.ansa.it/sito/notizie/sport/sport_rss.xml"],
  ["skysport-home", "Sky Sport", "sport", "https://sport.sky.it/rss"],
  ["fanpage-sport", "Fanpage Sport", "sport", "https://www.fanpage.it/sport/feed/"],
  ["eurosportit-home", "Eurosport Italia", "sport", "https://www.eurosport.it/rss.xml"],
  ["espn-home", "ESPN", "sport", "https://www.espn.com/espn/rss/news"],
  ["skysportsuk-home", "Sky Sports (UK)", "sport", "https://www.skysports.com/rss/12040"],
  ["bbc-sport", "BBC Sport", "sport", "http://feeds.bbci.co.uk/sport/rss.xml"],
  ["oasport-home", "OA Sport", "sport", "https://www.oasport.it/feed/"],

  // --- Calcio ----------------------------------------------------------------------------------
  ["calciomercato-home", "Calciomercato.com", "calcio", "https://www.calciomercato.com/rss"],
  ["skysport-calcio", "Sky Sport Calcio", "calcio", "https://sport.sky.it/calcio/rss"],
  ["gazzetta-calcio", "La Gazzetta — Calcio", "calcio", "https://www.gazzetta.it/rss/calcio.xml"],
  ["tuttomercatoweb-home", "TuttoMercatoWeb", "calcio", "https://www.tuttomercatoweb.com/rss"],
  ["fcinter1908-home", "FcInter1908", "calcio", "https://www.fcinter1908.it/feed"],
  ["milannews-home", "Milan News", "calcio", "https://www.milannews.it/rss"],
  ["juventusnews24-home", "Juventus News 24", "calcio", "https://www.juventusnews24.com/feed/"],
  ["ilnapolista-home", "Il Napolista", "calcio", "https://www.ilnapolista.it/feed/"],
  ["tuttojuve-home", "TuttoJuve", "calcio", "https://www.tuttojuve.com/rss"],
  ["forzaroma-home", "Forza Roma", "calcio", "https://www.forzaroma.info/feed/"],

  // --- Tecnologia ------------------------------------------------------------------------------
  ["ansa-tecnologia", "ANSA Tecnologia", "tecnologia", "https://www.ansa.it/canale_tecnologia/notizie/tecnologia_rss.xml"],
  ["wiredit-home", "Wired Italia", "tecnologia", "https://www.wired.it/feed/rss"],
  ["dday-home", "DDay.it", "tecnologia", "https://www.dday.it/rss"],
  ["hdblog-home", "HDblog", "tecnologia", "https://www.hdblog.it/feed/"],
  ["puntoinformatico-home", "Punto Informatico", "tecnologia", "https://www.punto-informatico.it/feed/"],
  ["hwupgrade-home", "Hardware Upgrade", "tecnologia", "https://www.hwupgrade.it/rss.html"],
  ["tomshw-home", "Tom's Hardware Italia", "tecnologia", "https://www.tomshw.it/feed/"],
  ["melablog-home", "Melablog", "tecnologia", "https://www.melablog.it/feed"],
  ["macitynet-home", "Macitynet", "tecnologia", "https://www.macitynet.it/feed/"],
  ["techcrunch-home", "TechCrunch", "tecnologia", "https://techcrunch.com/feed/"],
  ["theverge-home", "The Verge", "tecnologia", "https://www.theverge.com/rss/index.xml"],
  ["engadget-home", "Engadget", "tecnologia", "https://www.engadget.com/rss.xml"],
  ["arstechnica-home", "Ars Technica", "tecnologia", "https://feeds.arstechnica.com/arstechnica/index"],
  ["wiredus-home", "Wired", "tecnologia", "https://www.wired.com/feed/rss"],
  ["ilpost-tecnologia", "Il Post — Tecnologia", "tecnologia", "https://www.ilpost.it/tecnologia/feed/"],
  ["webnews-home", "Webnews", "tecnologia", "https://www.webnews.it/feed/"],

  // --- Scienza ---------------------------------------------------------------------------------
  ["focus-home", "Focus.it", "scienza", "https://www.focus.it/rss"],
  ["lescienze-home", "Le Scienze", "scienza", "https://www.lescienze.it/rss"],
  ["oggiscienza-home", "OggiScienza", "scienza", "https://www.oggiscienza.it/feed/"],
  ["mediainaf-home", "Media INAF", "scienza", "https://www.media.inaf.it/feed/"],
  ["scientificamerican-home", "Scientific American", "scienza", "https://www.scientificamerican.com/platform/syndication/rss/"],
  ["newscientist-home", "New Scientist", "scienza", "https://www.newscientist.com/feed/home/"],
  ["nature-news", "Nature News", "scienza", "https://www.nature.com/nature.rss"],
  ["nasa-breaking", "NASA", "scienza", "https://www.nasa.gov/rss/dyn/breaking_news.rss"],
  ["natgeoit-home", "National Geographic Italia", "scienza", "https://www.nationalgeographic.it/rss.xml"],
  ["galileonet-home", "Galileo Giornale di Scienza", "scienza", "https://www.galileonet.it/feed/"],

  // --- Salute e Benessere ------------------------------------------------------------------
  ["fondazioneveronesi-home", "Fondazione Umberto Veronesi", "salute", "https://www.fondazioneveronesi.it/feed"],
  ["corriere-salute", "Corriere Salute", "salute", "https://xml2.corriere.it/rss/salute.xml"],
  ["repubblica-salute", "Repubblica Salute", "salute", "https://www.repubblica.it/rss/salute/rss2.0.xml"],
  ["ansa-salute", "ANSA Salute&Benessere", "salute", "https://www.ansa.it/canale_saluteebenessere/notizie/salute_rss.xml"],
  ["humanitas-salute", "Humanitas Salute", "salute", "https://www.humanitas.it/feed"],
  ["ilfattoalimentare-home", "Il Fatto Alimentare", "salute", "https://ilfattoalimentare.it/feed"],
  ["webmd-home", "WebMD", "salute", "https://www.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC"],
  ["healthline-home", "Healthline", "salute", "https://www.healthline.com/rss"],

  // --- Cultura ---------------------------------------------------------------------------------
  ["ansa-cultura", "ANSA Cultura", "cultura", "https://www.ansa.it/sito/notizie/cultura/cultura_rss.xml"],
  ["ilpost-cultura", "Il Post — Cultura", "cultura", "https://www.ilpost.it/cultura/feed/"],
  ["artribune-home", "Artribune", "cultura", "https://www.artribune.com/feed/"],
  ["doppiozero-home", "Doppiozero", "cultura", "https://www.doppiozero.com/rss.xml"],
  ["rivistastudio-home", "Rivista Studio", "cultura", "https://www.rivistastudio.com/feed/"],
  ["corriere-cultura", "Corriere Cultura", "cultura", "https://xml2.corriere.it/rss/cultura.xml"],
  ["repubblica-spettacolicultura", "Repubblica Spettacoli e Cultura", "cultura", "https://www.repubblica.it/rss/spettacoli_e_cultura/rss2.0.xml"],
  ["treccanimagazine-home", "Treccani Magazine", "cultura", "https://www.treccani.it/magazine/rss/"],

  // --- Spettacolo e Gossip -------------------------------------------------------------------
  ["fanpage-spettacolo", "Fanpage Spettacolo", "spettacolo", "https://www.fanpage.it/spettacolo/feed/"],
  ["tgcom24-spettacolo", "TGCOM24 Spettacolo", "spettacolo", "https://www.tgcom24.mediaset.it/rss/spettacolo.xml"],
  ["messaggero-spettacoli", "Il Messaggero Spettacoli", "spettacolo", "https://www.ilmessaggero.it/rss/spettacoli.xml"],
  ["novella2000-home", "Novella 2000", "spettacolo", "https://www.novella2000.it/feed/"],
  ["gossip-home", "Gossip.it", "spettacolo", "https://www.gossip.it/feed/"],
  ["vanityfairit-home", "Vanity Fair Italia", "spettacolo", "https://www.vanityfair.it/feed/rss"],
  ["ilfattoquotidiano-spettacolo", "Il Fatto Quotidiano Spettacolo", "spettacolo", "https://www.ilfattoquotidiano.it/spettacolo/feed/"],

  // --- Cinema e Serie TV -----------------------------------------------------------------------
  ["comingsoon-home", "ComingSoon.it", "cinema-serie", "https://www.comingsoon.it/rss/"],
  ["movieplayer-home", "Movieplayer", "cinema-serie", "https://movieplayer.it/rss/"],
  ["badtaste-home", "BadTaste.it", "cinema-serie", "https://www.badtaste.it/feed/"],
  ["variety-home", "Variety", "cinema-serie", "https://variety.com/feed/"],
  ["hollywoodreporter-home", "The Hollywood Reporter", "cinema-serie", "https://www.hollywoodreporter.com/feed/"],
  ["indiewire-home", "IndieWire", "cinema-serie", "https://www.indiewire.com/feed/"],
  ["cineforum-home", "Cineforum", "cinema-serie", "https://cineforum.cinit.it/feed"],

  // --- Musica ---------------------------------------------------------------------------------
  ["rollingstoneit-home", "Rolling Stone Italia", "musica", "https://www.rollingstone.it/feed/"],
  ["rockol-home", "Rockol", "musica", "https://www.rockol.it/xml/rss.xml"],
  ["allmusicitalia-home", "All Music Italia", "musica", "https://www.allmusicitalia.it/feed"],
  ["pitchfork-news", "Pitchfork", "musica", "https://pitchfork.com/rss/news/"],
  ["rollingstoneus-home", "Rolling Stone", "musica", "https://www.rollingstone.com/feed/"],
  ["billboard-home", "Billboard", "musica", "https://www.billboard.com/feed/"],

  // --- Libri -----------------------------------------------------------------------------------
  ["illibraio-home", "Il Libraio", "libri", "https://www.illibraio.it/feed/"],
  ["sulromanzo-home", "Sul Romanzo", "libri", "https://www.sulromanzo.it/feed"],
  ["mangialibri-home", "MangiaLibri", "libri", "https://www.mangialibri.com/rss.xml"],
  ["libreriamo-home", "Libreriamo", "libri", "https://www.libreriamo.it/feed"],

  // --- Moda ------------------------------------------------------------------------------------
  ["vogueit-home", "Vogue Italia", "moda", "https://www.vogue.it/feed"],
  ["gqit-home", "GQ Italia", "moda", "https://www.gqitalia.it/feed"],
  ["elleit-home", "Elle Italia", "moda", "https://www.elle.com/it/rss/"],
  ["graziait-home", "Grazia Italia", "moda", "https://www.grazia.it/feed"],
  ["vogueus-home", "Vogue", "moda", "https://www.vogue.com/feed/rss"],
  ["fashionmagazine-home", "Fashion Magazine", "moda", "https://www.fashionmagazine.it/feed"],

  // --- Motori ----------------------------------------------------------------------------------
  ["quattroruote-home", "Quattroruote", "motori", "https://www.quattroruote.it/rss.html"],
  ["auto-home", "Auto.it", "motori", "https://www.auto.it/feed"],
  ["moto-home", "Moto.it", "motori", "https://www.moto.it/rss"],
  ["motorsportit-home", "Motorsport.com Italia", "motori", "https://it.motorsport.com/rss/"],
  ["autoblog-home", "Autoblog.it", "motori", "https://www.autoblog.it/rss.xml"],
  ["omniauto-home", "OmniAuto.it", "motori", "https://www.omniauto.it/rss"],

  // --- Viaggi ----------------------------------------------------------------------------------
  ["doveviaggi-home", "Dove Viaggi", "viaggi", "https://www.dove.it/feed"],
  ["siviaggia-home", "SiViaggia", "viaggi", "https://www.siviaggia.it/feed"],
  ["turismo-it", "Turismo.it", "viaggi", "https://www.turismo.it/feed"],
  ["viaggiart-home", "Viaggi Art", "viaggi", "https://www.viaggi-art.com/feed"],

  // --- Cibo e Cucina ---------------------------------------------------------------------------
  ["giallozafferano-home", "GialloZafferano Magazine", "cibo", "https://www.giallozafferano.it/rss/"],
  ["gamberorosso-home", "Gambero Rosso", "cibo", "https://www.gamberorosso.it/feed/"],
  ["lacucinaitaliana-home", "La Cucina Italiana", "cibo", "https://www.lacucinaitaliana.it/feed"],
  ["dissapore-home", "Dissapore", "cibo", "https://www.dissapore.com/feed/"],
  ["cucchiaio-home", "Cucchiaio d'Argento", "cibo", "https://www.cucchiaio.it/feed/"],

  // --- Ambiente --------------------------------------------------------------------------------
  ["rinnovabili-home", "Rinnovabili.it", "ambiente", "https://www.rinnovabili.it/feed/"],
  ["greenreport-home", "Greenreport", "ambiente", "https://www.greenreport.it/feed"],
  ["lifegate-home", "LifeGate", "ambiente", "https://www.lifegate.it/feed"],
  ["legambiente-home", "Legambiente", "ambiente", "https://www.legambiente.it/feed/"],
  ["greenme-home", "GreenMe", "ambiente", "https://www.greenme.it/feed/"],

  // --- Casa e Design ---------------------------------------------------------------------------
  ["elledecorit-home", "Elle Decor Italia", "casa-design", "https://www.elledecor.com/it/rss/"],
  ["livingcorriere-home", "Living — Corriere", "casa-design", "https://living.corriere.it/feed/"],
  ["casafacile-home", "Casafacile", "casa-design", "https://www.casafacile.it/feed"],
  ["designboom-home", "Designboom", "casa-design", "https://www.designboom.com/feed/"],

  // --- Gaming ----------------------------------------------------------------------------------
  ["multiplayer-home", "Multiplayer.it", "gaming", "https://multiplayer.it/feed/"],
  ["everyeye-home", "Everyeye.it", "gaming", "https://www.everyeye.it/rss/news.asp"],
  ["spaziogames-home", "SpazioGames", "gaming", "https://www.spaziogames.it/feed/"],
  ["ignit-home", "IGN Italia", "gaming", "https://it.ign.com/feed.xml"],
  ["ignus-home", "IGN", "gaming", "https://feeds.ign.com/ign/all"],
  ["eurogamerit-home", "Eurogamer.it", "gaming", "https://www.eurogamer.it/feed"],
  ["eurogamer-home", "Eurogamer", "gaming", "https://www.eurogamer.net/feed"],

  // --- Edizioni locali -------------------------------------------------------------------------
  ["ilpiccolo-home", "Il Piccolo (Trieste)", "locali", "https://ilpiccolo.gelocal.it/rss/home"],
  ["gazzettino-home", "Il Gazzettino (Veneto)", "locali", "https://www.ilgazzettino.it/rss/home.xml"],
  ["mattinopadova-home", "Il Mattino di Padova", "locali", "https://mattinopadova.gelocal.it/rss/home"],
  ["tribunatreviso-home", "La Tribuna di Treviso", "locali", "https://tribunatreviso.gelocal.it/rss/home"],
  ["corrieredelveneto-home", "Corriere del Veneto", "locali", "https://corrieredelveneto.corriere.it/rss/"],
  ["corrieredibologna-home", "Corriere di Bologna", "locali", "https://corrieredibologna.corriere.it/rss/"],
  ["corrierefiorentino-home", "Corriere Fiorentino", "locali", "https://corrierefiorentino.corriere.it/rss/"],
  ["corrieredelmezzogiorno-home", "Corriere del Mezzogiorno", "locali", "https://corrieredelmezzogiorno.corriere.it/rss/"],
  ["tirreno-home", "Il Tirreno", "locali", "https://iltirreno.gelocal.it/rss/home"],
  ["nuovasardegna-home", "La Nuova Sardegna", "locali", "https://lanuovasardegna.gelocal.it/rss/home"],
  ["sicilia-home", "La Sicilia", "locali", "https://www.lasicilia.it/rss/home"],
  ["giornaledisicilia-home", "Giornale di Sicilia", "locali", "https://gds.it/rss/home.xml"],
  ["gazzettamezzogiorno-home", "La Gazzetta del Mezzogiorno", "locali", "https://www.lagazzettadelmezzogiorno.it/rss/home.xml"],
  ["quotidianodelsud-home", "Il Quotidiano del Sud", "locali", "https://quotidianodelsud.it/feed/"],
  ["ecodibergamo-home", "L'Eco di Bergamo", "locali", "https://www.ecodibergamo.it/rss/home.xml"],
  ["laprovinciacomo-home", "La Provincia (Como/Sondrio)", "locali", "https://www.laprovinciadicomo.it/rss/home.xml"],
  ["bresciaoggi-home", "Bresciaoggi", "locali", "https://www.bresciaoggi.it/rss/home.xml"],
  ["giornaledibrescia-home", "Giornale di Brescia", "locali", "https://www.giornaledibrescia.it/rss.xml"],
  ["laprovinciapavese-home", "La Provincia Pavese", "locali", "https://laprovinciapavese.gelocal.it/rss/home"],
  ["giornaledivicenza-home", "Il Giornale di Vicenza", "locali", "https://www.ilgiornaledivicenza.it/rss/home.xml"],
  ["arena-home", "L'Arena (Verona)", "locali", "https://www.larena.it/rss/home.xml"],
  ["ilcentro-home", "Il Centro (Abruzzo)", "locali", "https://ilcentro.gelocal.it/rss/home"],
  ["messaggeroveneto-home", "Messaggero Veneto (Udine)", "locali", "https://messaggeroveneto.gelocal.it/rss/home"],
  ["iltempo-home", "Il Tempo (Roma)", "locali", "https://www.iltempo.it/rss/home.xml"],
  ["cittadisalerno-home", "La Città di Salerno", "locali", "https://citta-salerno.gelocal.it/rss/home"],
  ["ansa-abruzzo", "ANSA Abruzzo", "locali", "https://www.ansa.it/abruzzo/notizie/abruzzo_rss.xml"],
  ["ansa-basilicata", "ANSA Basilicata", "locali", "https://www.ansa.it/basilicata/notizie/basilicata_rss.xml"],
  ["ansa-calabria", "ANSA Calabria", "locali", "https://www.ansa.it/calabria/notizie/calabria_rss.xml"],
  ["ansa-campania", "ANSA Campania", "locali", "https://www.ansa.it/campania/notizie/campania_rss.xml"],
  ["ansa-emiliaromagna", "ANSA Emilia-Romagna", "locali", "https://www.ansa.it/emiliaromagna/notizie/emiliaromagna_rss.xml"],
  ["ansa-friuli", "ANSA Friuli Venezia Giulia", "locali", "https://www.ansa.it/friuliveneziagiulia/notizie/friuliveneziagiulia_rss.xml"],
  ["ansa-lazio", "ANSA Lazio", "locali", "https://www.ansa.it/lazio/notizie/lazio_rss.xml"],
  ["ansa-liguria", "ANSA Liguria", "locali", "https://www.ansa.it/liguria/notizie/liguria_rss.xml"],
  ["ansa-lombardia", "ANSA Lombardia", "locali", "https://www.ansa.it/lombardia/notizie/lombardia_rss.xml"],
  ["ansa-marche", "ANSA Marche", "locali", "https://www.ansa.it/marche/notizie/marche_rss.xml"],
  ["ansa-molise", "ANSA Molise", "locali", "https://www.ansa.it/molise/notizie/molise_rss.xml"],
  ["ansa-piemonte", "ANSA Piemonte", "locali", "https://www.ansa.it/piemonte/notizie/piemonte_rss.xml"],
  ["ansa-puglia", "ANSA Puglia", "locali", "https://www.ansa.it/puglia/notizie/puglia_rss.xml"],
  ["ansa-sardegna", "ANSA Sardegna", "locali", "https://www.ansa.it/sardegna/notizie/sardegna_rss.xml"],
  ["ansa-sicilia", "ANSA Sicilia", "locali", "https://www.ansa.it/sicilia/notizie/sicilia_rss.xml"],
  ["ansa-toscana", "ANSA Toscana", "locali", "https://www.ansa.it/toscana/notizie/toscana_rss.xml"],
  ["ansa-trentino", "ANSA Trentino-Alto Adige", "locali", "https://www.ansa.it/trentino/notizie/trentino_rss.xml"],
  ["ansa-umbria", "ANSA Umbria", "locali", "https://www.ansa.it/umbria/notizie/umbria_rss.xml"],
  ["ansa-valledaosta", "ANSA Valle d'Aosta", "locali", "https://www.ansa.it/valledaosta/notizie/valledaosta_rss.xml"],
  ["ansa-veneto", "ANSA Veneto", "locali", "https://www.ansa.it/veneto/notizie/veneto_rss.xml"],

  // --- Altre agenzie di stampa italiane (attualità/cronaca) -----------------------------------
  ["adnkronos-home", "Adnkronos", "attualita", "https://www.adnkronos.com/rss"],
  ["adnkronos-cronaca", "Adnkronos Cronaca", "cronaca", "https://www.adnkronos.com/RSS_Cronaca.xml"],
  ["adnkronos-economia", "Adnkronos Economia", "economia", "https://www.adnkronos.com/RSS_Economia.xml"],
  ["adnkronos-sport", "Adnkronos Sport", "sport", "https://www.adnkronos.com/RSS_Sport.xml"],
  ["adnkronos-salute", "Adnkronos Salute", "salute", "https://www.adnkronos.com/RSS_Salute.xml"],
  ["agi-home", "AGI — Agenzia Giornalistica Italia", "attualita", "https://www.agi.it/rss"],
  ["agi-politica", "AGI Politica", "politica", "https://www.agi.it/politica/rss"],
  ["agi-economia", "AGI Economia", "economia", "https://www.agi.it/economia/rss"],
  ["agi-estero", "AGI Estero", "esteri", "https://www.agi.it/estero/rss"],
  ["la7-home", "La7", "attualita", "https://www.la7.it/rss.xml"],
  ["notizie-it-home", "Notizie.it", "attualita", "https://www.notizie.it/feed"],
  ["ansa-motori", "ANSA Motori", "motori", "https://www.ansa.it/canale_motori/notizie/motori_rss.xml"],
  ["ansa-ambiente", "ANSA Ambiente&Energia", "ambiente", "https://www.ansa.it/canale_ambiente/notizie/ambiente_rss.xml"],
  ["ansa-scienza", "ANSA Scienza", "scienza", "https://www.ansa.it/scienza/notizie/scienza_rss.xml"],
  ["ansa-viaggiart", "ANSA ViaggiArt", "viaggi", "https://www.ansa.it/canale_viaggiart/notizie/viaggiart_rss.xml"],
  ["ansa-terraegusto", "ANSA Terra&Gusto", "cibo", "https://www.ansa.it/canale_terraegusto/notizie/terraegusto_rss.xml"],

  // --- Completamento categorie più scarne -------------------------------------------------------
  ["fattoquotidiano-libri", "Il Fatto Quotidiano Libri", "libri", "https://www.ilfattoquotidiano.it/cultura/libri/feed/"],
  ["traveller-home", "Traveller", "viaggi", "https://www.traveller.it/feed"],
  ["bellitalia-home", "Bell'Italia", "viaggi", "https://www.bellitalia.it/feed"],
  ["internimagazine-home", "Interni Magazine", "casa-design", "https://www.internimagazine.it/feed/"],
  ["ambientecucina-home", "Ambiente Cucina", "casa-design", "https://www.ambientecucina.it/feed"],
  ["stylecorriere-home", "Style — Corriere della Sera", "moda", "https://style.corriere.it/feed/"],
  ["fashionnetworkit-home", "FashionNetwork Italia", "moda", "https://it.fashionnetwork.com/rss"],
  ["fanpage-tech", "Fanpage Tecnologia", "tecnologia", "https://www.fanpage.it/innovazione/feed/"],
  ["repubblica-tecnologia", "Repubblica Tecnologia", "tecnologia", "https://www.repubblica.it/rss/tecnologia/rss2.0.xml"],
  ["corriere-tecnologia", "Corriere Tecnologia", "tecnologia", "https://xml2.corriere.it/rss/tecnologia.xml"],
  ["repubblica-scienze", "Repubblica Scienze", "scienza", "https://www.repubblica.it/rss/scienze/rss2.0.xml"],
  ["corriere-scienze", "Corriere Scienze", "scienza", "https://xml2.corriere.it/rss/scienze.xml"],
  ["repubblica-ambiente", "Repubblica Ambiente", "ambiente", "https://www.repubblica.it/rss/ambiente/rss2.0.xml"],
  ["corriere-ambiente", "Corriere Ambiente", "ambiente", "https://xml2.corriere.it/rss/ambiente.xml"],
  ["repubblica-motori", "Repubblica Motori", "motori", "https://www.repubblica.it/rss/motori/rss2.0.xml"],
  ["corriere-motori", "Corriere Motori", "motori", "https://xml2.corriere.it/rss/motori.xml"],
  ["gazzetta-motori", "La Gazzetta — Motori", "motori", "https://www.gazzetta.it/rss/motori.xml"],
  ["repubblica-musica", "Repubblica Musica", "musica", "https://www.repubblica.it/rss/musica/rss2.0.xml"],
  ["repubblica-libri", "Repubblica Libri", "libri", "https://www.repubblica.it/rss/libri/rss2.0.xml"],
  ["repubblica-moda", "Repubblica Moda", "moda", "https://www.repubblica.it/rss/moda/rss2.0.xml"],
  ["repubblica-viaggi", "Repubblica Viaggi", "viaggi", "https://www.repubblica.it/rss/viaggi/rss2.0.xml"],
  ["repubblica-sapori", "Repubblica Sapori (Cibo)", "cibo", "https://www.repubblica.it/rss/sapori/rss2.0.xml"],
  ["repubblica-salute2", "Repubblica Salute (approfondimenti)", "salute", "https://www.repubblica.it/rss/scienze/rss2.0.xml"],
  ["corriere-lettura", "La Lettura — Corriere", "libri", "https://xml2.corriere.it/rss/lettura.xml"],
  ["corriere-viaggi", "Corriere Viaggi", "viaggi", "https://xml2.corriere.it/rss/viaggi.xml"],
  ["corriere-moda", "Corriere Moda", "moda", "https://xml2.corriere.it/rss/moda.xml"],
];

export interface NewsSourceDef {
  id: string;
  name: string;
  category: string;
  rssUrl: string;
}

export const NEWS_SOURCES: NewsSourceDef[] = RAW.map(([id, name, category, rssUrl]) => ({ id, name, category, rssUrl }));

export const NEWS_SOURCES_BY_ID: Map<string, NewsSourceDef> = new Map(NEWS_SOURCES.map((s) => [s.id, s]));
