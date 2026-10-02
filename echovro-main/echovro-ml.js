/* =====================================================================
   echovro-ml.js — music-taste inference + compatibility (runs in the browser, no dependencies)

   PIPELINE
   1. GENRE INFERENCE  (track → genre distribution)
        a) Knowledge base lookup: artist (or song title) → genre weights
        b) Fallback for unseen tracks: Multinomial Naive Bayes over artist/title words
           (trained at load time from the knowledge base, Laplace smoothing)
   2. TASTE PROFILE    (many tracks → one L1-normalised genre vector + artist set)
   3. TF-IDF WEIGHTING (genres everybody listens to, e.g. pop, count for less than rare ones)
   4. COMPATIBILITY    score = 0.60·cosine(TF-IDF) + 0.30·weighted-Jaccard(genres) + 0.10·Jaccard(artists)

   Works the same for Spotify, YouTube Music and Gaana because every service is mapped
   into ONE shared genre taxonomy. In production, feed it real data:
     Spotify  : ML.profileFromTags( topArtists.flatMap(a=>a.genres) )      // /me/top/artists
     YouTube  : ML.profile( likedVideos.map(v=>[v.title, v.channel]) )     // cleaned titles
     Gaana    : ML.profile( tracks.map(t=>[t.title, t.artist]) )
   ===================================================================== */
(function (root) {
  'use strict';

  const GENRES = ['pop','rock','hip-hop','electronic','r&b','indie','classical','ambient','reggae','folk','bollywood','sufi','malayalam','jazz'];
  const LABEL = {pop:'Pop',rock:'Rock','hip-hop':'Hip-hop',electronic:'Electronic','r&b':'R&B / Soul',indie:'Indie / Acoustic',classical:'Classical',ambient:'Ambient',reggae:'Reggae',folk:'Folk',bollywood:'Bollywood',sufi:'Sufi',malayalam:'Malayalam film',jazz:'Jazz'};

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.& ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = s => norm(s).split(/[^a-z0-9]+/).filter(w => w.length > 1);

  /* ---------- Knowledge base (extend freely) ---------- */
  const ARTISTS_RAW = {
    'The Beatles':{rock:.5,pop:.4,folk:.1}, 'Bob Marley':{reggae:.8,folk:.1,rock:.1}, 'A.R. Rahman':{bollywood:.6,sufi:.2,electronic:.1,classical:.1},
    'Arijit Singh':{bollywood:.8,pop:.1,sufi:.1}, 'The Weeknd':{'r&b':.5,pop:.35,electronic:.15}, 'Dua Lipa':{pop:.6,electronic:.3,'r&b':.1},
    'Vijay Yesudas':{malayalam:.8,bollywood:.2}, 'Ed Sheeran':{pop:.5,indie:.4,folk:.1}, 'Mohit Chauhan':{bollywood:.6,indie:.2,folk:.2},
    'Jack Johnson':{indie:.6,folk:.2,reggae:.1,pop:.1}, 'Claude Debussy':{classical:1}, 'Erik Satie':{classical:.8,ambient:.2},
    'Marconi Union':{ambient:.8,electronic:.2}, 'Tochi Raina':{bollywood:.5,sufi:.3,indie:.2},
    'Coldplay':{rock:.4,pop:.4,indie:.2}, 'Taylor Swift':{pop:.7,indie:.2,folk:.1}, 'Drake':{'hip-hop':.7,'r&b':.2,pop:.1},
    'Kendrick Lamar':{'hip-hop':.9,'r&b':.1}, 'Daft Punk':{electronic:.9,pop:.1}, 'Adele':{pop:.5,'r&b':.3,jazz:.2},
    'Nusrat Fateh Ali Khan':{sufi:.8,classical:.2}, 'KK':{bollywood:.8,rock:.1,pop:.1}, 'Shreya Ghoshal':{bollywood:.8,classical:.2},
    'Sid Sriram':{'r&b':.4,bollywood:.3,indie:.3}, 'Anirudh Ravichander':{bollywood:.4,electronic:.4,pop:.2}, 'Miles Davis':{jazz:1},
    'Norah Jones':{jazz:.5,indie:.3,folk:.2}, 'Radiohead':{rock:.5,indie:.3,electronic:.2}, 'Billie Eilish':{pop:.5,electronic:.3,indie:.2},
    'Post Malone':{'hip-hop':.5,pop:.4,rock:.1}, 'Imagine Dragons':{rock:.5,pop:.4,electronic:.1}, 'Queen':{rock:.9,pop:.1},
    'Pink Floyd':{rock:.7,ambient:.3}, 'Ludovico Einaudi':{classical:.7,ambient:.3}, 'Hans Zimmer':{classical:.6,ambient:.2,electronic:.2}
  };
  const SONGS_RAW = {
    'Here Comes the Sun':'The Beatles','Three Little Birds':'Bob Marley','Kun Faya Kun':'A.R. Rahman','Ilahi':'Arijit Singh','Agar Tum Saath Ho':'Arijit Singh',
    'Blinding Lights':'The Weeknd','Starboy':'The Weeknd','Levitating':'Dua Lipa','Malare':'Vijay Yesudas','Perfect':'Ed Sheeran','Tum Se Hi':'Mohit Chauhan',
    'Banana Pancakes':'Jack Johnson','Clair de Lune':'Claude Debussy','Gymnopédie No. 1':'Erik Satie','Weightless':'Marconi Union','Kabira':'Tochi Raina'
  };
  const ART = {}, SONG = {};
  Object.entries(ARTISTS_RAW).forEach(([k, v]) => ART[norm(k)] = v);
  Object.entries(SONGS_RAW).forEach(([k, v]) => SONG[norm(k)] = norm(v));

  /* ---------- Multinomial Naive Bayes (fallback for unknown artists/songs) ---------- */
  const NB = { tok: {}, tot: {}, prior: {}, vocab: new Set() };
  (function train() {
    GENRES.forEach(c => { NB.tok[c] = {}; NB.tot[c] = 0; NB.prior[c] = 0; });
    for (const [artist, gw] of Object.entries(ART)) {
      const words = tokens(artist);
      for (const [t, a] of Object.entries(SONG)) if (a === artist) words.push(...tokens(t));
      for (const c in gw) {                          // fractional counts: a document counts gw[c] toward class c
        NB.prior[c] += gw[c];
        for (const w of words) { NB.tok[c][w] = (NB.tok[c][w] || 0) + gw[c]; NB.tot[c] += gw[c]; NB.vocab.add(w); }
      }
    }
  })();
  function nbPredict(words) {
    words = words.filter(w => NB.vocab.has(w));
    if (!words.length) return null;
    const V = NB.vocab.size, P = GENRES.reduce((s, c) => s + NB.prior[c], 0), lp = {};
    GENRES.forEach(c => {
      let l = Math.log((NB.prior[c] + 1e-3) / P);
      words.forEach(w => l += Math.log(((NB.tok[c][w] || 0) + 1) / (NB.tot[c] + V)));   // Laplace smoothing
      lp[c] = l / words.length;                                                          // length-tempered, avoids over-confidence
    });
    const m = Math.max(...Object.values(lp)), ex = {}; let z = 0;
    GENRES.forEach(c => { ex[c] = Math.exp(lp[c] - m); z += ex[c]; });
    const out = {};
    GENRES.forEach(c => { const p = ex[c] / z; if (p > .08) out[c] = p * .5; });      // ×0.5: guessed genres count half as much as known ones
    return out;
  }

  /* ---------- Step 1: track → genre distribution ---------- */
  function resolve(track) {
    const title = norm(track[0]), artist = norm(track[1]);
    let key = artist, g = ART[artist];
    if (!g && artist) { const k = Object.keys(ART).find(k => artist.includes(k)); if (k) { key = k; g = ART[k]; } }
    if (!g && SONG[title]) { key = SONG[title]; g = ART[key]; }
    if (!g) g = nbPredict(tokens(artist + ' ' + title));
    return { genres: g || {}, artist: key || null };
  }

  /* ---------- Step 2: tracks → taste profile ---------- */
  function finish(vec, artists, n) {
    const s = GENRES.reduce((a, g) => a + vec[g], 0) || 1;
    GENRES.forEach(g => vec[g] /= s);
    const top = GENRES.filter(g => vec[g] > .04).sort((a, b) => vec[b] - vec[a]);
    return { vec, artists, n, top };
  }
  function profile(tracks) {
    const vec = {}, artists = new Set(); GENRES.forEach(g => vec[g] = 0);
    (tracks || []).forEach(t => {
      const r = resolve(t); if (r.artist) artists.add(r.artist);
      for (const g in r.genres) vec[g] += r.genres[g];
    });
    return finish(vec, artists, (tracks || []).length);
  }
  // Spotify gives free-text genre tags per artist ("bollywood", "indian indie", "reggae fusion"...)
  const TAGS = [[/bollywood|filmi|hindi|indian pop/, 'bollywood'], [/sufi|qawwali|ghazal/, 'sufi'], [/malayalam|mollywood/, 'malayalam'], [/reggae|ska|dancehall/, 'reggae'],
    [/hip hop|rap|trap|drill/, 'hip-hop'], [/r&b|soul|urban contemporary|funk/, 'r&b'], [/edm|house|techno|electro|dance|synth|trance/, 'electronic'],
    [/classical|orchestra|piano|baroque|romantic era|soundtrack/, 'classical'], [/ambient|drone|new age|sleep|lo-?fi|chill/, 'ambient'],
    [/indie|acoustic|singer-songwriter|bedroom/, 'indie'], [/folk|country|bluegrass/, 'folk'], [/jazz|bebop|swing/, 'jazz'],
    [/rock|metal|punk|grunge|alternative/, 'rock'], [/pop/, 'pop']];
  function profileFromTags(tags) {
    const vec = {}; GENRES.forEach(g => vec[g] = 0);
    (tags || []).forEach(t => { const x = TAGS.find(r => r[0].test(norm(t))); if (x) vec[x[1]]++; });
    return finish(vec, new Set(), (tags || []).length);
  }

  /* ---------- Step 3: TF-IDF over everyone currently in view ---------- */
  let IDF = {}; GENRES.forEach(g => IDF[g] = 1);
  function fit(profiles) {
    const N = profiles.length;
    GENRES.forEach(g => { const df = profiles.filter(p => p.vec[g] > .04).length; IDF[g] = Math.log((1 + N) / (1 + df)) + 1; });
  }

  /* ---------- Step 4: compatibility ---------- */
  function compat(a, b) {
    if (!a || !b) return { score: null, shared: [], label: 'Not enough listening data yet', myTop: [], theirTop: [], bridge: null };
    const hasA = (a.n && a.n > 0) || (a.top && a.top.length > 0);
    const hasB = (b.n && b.n > 0) || (b.top && b.top.length > 0);
    if (!hasA || !hasB) {
      return { score: null, shared: [], label: 'Not enough listening data yet', myTop: a.top || [], theirTop: b.top || [], bridge: null };
    }
    let dot = 0, na = 0, nb = 0, mn = 0, mx = 0;
    GENRES.forEach(g => {
      const x = (a.vec[g] || 0) * (IDF[g] || 1), y = (b.vec[g] || 0) * (IDF[g] || 1);
      dot += x * y; na += x * x; nb += y * y;
      mn += Math.min(a.vec[g] || 0, b.vec[g] || 0); mx += Math.max(a.vec[g] || 0, b.vec[g] || 0);
    });
    const denom = Math.sqrt(na * nb);
    const cos = denom > 0 ? (dot / denom) : 0;
    const wj = mx > 0 ? (mn / mx) : 0;
    const aArtists = a.artists || new Set(), bArtists = b.artists || new Set();
    const inter = [...aArtists].filter(x => bArtists.has(x)).length, uni = new Set([...aArtists, ...bArtists]).size || 1;
    let rawScore = .6 * cos + .3 * wj + .1 * (inter / uni);
    if (rawScore <= 0 && ((a.top && a.top.length) || (b.top && b.top.length))) {
      rawScore = 0.38;
    }
    const score = Math.max(15, Math.round(100 * Math.min(1, rawScore)));
    const shared = GENRES.filter(g => Math.min(a.vec[g] || 0, b.vec[g] || 0) > .03).sort((x, y) => Math.min(b.vec[y] || 0, a.vec[y] || 0) - Math.min(b.vec[x] || 0, a.vec[x] || 0)).slice(0, 3);
    const bridge = (b.top || []).find(g => (a.vec[g] || 0) < .05) || (b.top && b.top[0]) || null;
    const label = score >= 80 ? 'Musical soulmates' : score >= 60 ? 'Strong overlap' : score >= 40 ? 'Some common ground' : 'Different worlds — great for discovery';
    return { score, shared: shared.length ? shared : (a.top && a.top.slice(0, 2)) || [], label, bridge, myTop: a.top || [], theirTop: b.top || [] };
  }

  root.ML = { GENRES, LABEL, resolve, profile, profileFromTags, fit, compat };
})(window);
