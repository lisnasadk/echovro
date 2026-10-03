/* =====================================================================
   echovro-ml.js  —  EchoVro Music-Taste Matching Engine (v2)
   Runs in the browser, Node, or an Edge Function. Zero dependencies.

   PIPELINE
   1. GENRE INFERENCE   track (title + artist) -> genre distribution
        a) Knowledge-base lookup (artist, multi-artist credits, or song title)
        b) Fallback: Multinomial Naive Bayes (Laplace smoothing) over name/title words,
           trained from the knowledge base, updated incrementally as the KB grows
   2. TASTE PROFILE     many tracks -> one L1-normalised genre vector + artist set + top 3-5 genres
   3. TF-IDF            rare genres (sufi, malayalam...) count for more than ubiquitous ones (pop)
   4. COMPATIBILITY     0.60·cosine(TF-IDF) + 0.30·weighted-Jaccard(genres) + 0.10·Jaccard(artists)
                        -> 15..100 %, label, shared genres, bridge genre, explanation

   ALL services map into ONE genre taxonomy (GENRES):
     Spotify : ML.profileFromSpotify(topArtists)           // /me/top/artists items {name, genres[]}
               ML.profileFromTags(tagStrings)              // or just a flat list of genre tags
     YouTube : ML.profile(ML.fromYouTube(videos))          // videos: {title, channel}
     Gaana   : ML.profile(ML.fromGaana(tracks))            // tracks: {title, artist | artists[]}
     Generic : ML.profile([[title, artist], {title, artist}, ...])

   QUICK START
     const me   = ML.profile(ML.fromGaana(myTracks));
     const them = ML.profile(ML.fromYouTube(theirVideos));
     ML.fit([me, them, ...everyoneInView]);                // optional: dynamic TF-IDF
     const r = ML.compat(me, them);                        // {score, label, shared, bridge, explanation, ...}

   AT SCALE (see MatchIndex): store serialised profiles per user, keep the IDF model as
   document-frequency counters, and let MatchIndex pre-filter candidates by top genre
   instead of scoring every pair.
   ===================================================================== */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.EchoVroML = api;
  root.ML = api; // backwards-compatible global used by the existing app
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ===================================================================
     0. CONFIG & TAXONOMY
     =================================================================== */
  const GENRES = ['pop', 'rock', 'hip-hop', 'electronic', 'r&b', 'indie', 'classical', 'ambient', 'reggae', 'folk', 'bollywood', 'sufi', 'malayalam', 'jazz'];
  const LABEL = { pop: 'Pop', rock: 'Rock', 'hip-hop': 'Hip-hop', electronic: 'Electronic', 'r&b': 'R&B / Soul', indie: 'Indie / Acoustic', classical: 'Classical', ambient: 'Ambient', reggae: 'Reggae', folk: 'Folk', bollywood: 'Bollywood', sufi: 'Sufi', malayalam: 'Malayalam film', jazz: 'Jazz' };
  const GENRE_SET = new Set(GENRES);

  const WEIGHTS = { cosine: 0.6, genreJaccard: 0.3, artistJaccard: 0.1 }; // ensemble 60 / 30 / 10
  const CONFIG = {
    baseline: 15,          // score returned when there is no usable data
    topThreshold: 0.04,    // genre counts as "present" in a profile above this share
    minTop: 3, maxTop: 5,  // size of the "top genres" list
    sharedThreshold: 0.03, // both users must have at least this share to call a genre "shared"
    bridgeThreshold: 0.05, // the other user must be below this share for a genre to be a "bridge"
    nbMinProb: 0.08,       // ignore NB genres below this probability
    nbGuessWeight: 0.5,    // guessed genres count half as much as KB-known ones
    cacheSize: 50000       // track-resolution cache entries
  };

  /* ===================================================================
     1. TEXT HELPERS (unicode-safe: Hindi / Malayalam / etc. survive)
     =================================================================== */
  // lowercase, strip Latin diacritics only (Indic vowel signs are combining marks, so we must keep them)
  const norm = s => String(s == null ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')
    .toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ').trim();
  // compact lookup key: "A.R. Rahman" == "AR Rahman" == "a r rahman"
  const key = s => norm(s).replace(/\s+/g, '');

  const STOP = new Set(['the', 'an', 'of', 'and', 'feat', 'ft', 'featuring', 'official', 'video', 'audio', 'lyrics', 'lyric', 'music', 'topic', 'vevo', 'records', 'song', 'songs', 'full', 'hd', 'from', 'movie', 'film', 'version']);
  const tokens = s => norm(s).split(' ').filter(w => w.length > 1 && !STOP.has(w));

  const NOISE_BRACKET = /[\(\[\{][^\)\]\}]*(official|video|audio|lyric|lyrics|lyrical|visuali[sz]er|\bhd\b|4k|\bmv\b|full song|remaster(ed)?|explicit|from\s+["“'‘])[^\)\]\}]*[\)\]\}]/gi;
  /** Strip "(Official Video)", "[Lyrics]", '(From "Rockstar")', "| Channel", "- Official Audio" ... */
  function cleanTitle(raw) {
    let t = String(raw == null ? '' : raw).split('|')[0];
    t = t.replace(NOISE_BRACKET, ' ');
    t = t.replace(/\s[-–—]\s*(official\b.*|lyrics?\b.*|lyrical\b.*|from\s.*|audio\b.*|video\b.*)$/i, '');
    return t.replace(/\s+/g, ' ').trim();
  }
  /** "Arijit Singh - Topic" / "TaylorSwiftVEVO" / "Coldplay Official" -> clean channel/artist name */
  function cleanArtist(raw) {
    return String(raw == null ? '' : raw)
      .replace(/\s*[-–—]\s*topic$/i, '').replace(/vevo$/i, '').replace(/\s+official(\s+channel)?$/i, '')
      .replace(/\s+/g, ' ').trim();
  }
  // "A, B & C feat. D x E" -> separate artists (whole string is always tried first, so "Simon & Garfunkel" still works)
  const ARTIST_SEP = /\s*(?:,|;|\/|&|\bfeat\.?\s|\bft\.?\s|\bfeaturing\b|\bwith\b|\bx\b|\band\b)\s*/i;

  /** Accepts [title, artist], {title, artist|artists[]|channel}, or a bare title string. */
  function asTrack(t) {
    let title = '', artist = '', tags = [];
    if (Array.isArray(t)) { title = t[0]; artist = t[1]; if (Array.isArray(t[2])) tags = t[2]; }
    else if (t && typeof t === 'object') {
      title = t.title != null ? t.title : t.name;
      artist = t.artist != null ? t.artist : (t.artists != null ? t.artists : t.channel);
      tags = Array.isArray(t.genres) ? t.genres : (Array.isArray(t.tags) ? t.tags : []);
    } else title = t;
    if (Array.isArray(artist)) artist = artist.map(a => (a && a.name) || a).join(', ');
    return { title: cleanTitle(title), artist: cleanArtist(artist), tags };
  }

  /* ===================================================================
     2. KNOWLEDGE BASE  (starts empty — populate with loadKnowledgeBase)
     =================================================================== */
  const KB = { artists: new Map(), songs: new Map() }; // artists: key -> {id, display, genres}; songs: titleKey -> artistId
  const cache = new Map();

  // --- Multinomial Naive Bayes state (fractional counts: a document counts gw[c] toward class c) ---
  const NB = { tok: {}, tot: {}, prior: {}, vocab: new Set() };
  GENRES.forEach(c => { NB.tok[c] = Object.create(null); NB.tot[c] = 0; NB.prior[c] = 0; });
  function nbLearn(words, gw) {
    if (!words.length) return;
    for (const c in gw) {
      NB.prior[c] += gw[c];
      for (const w of words) { NB.tok[c][w] = (NB.tok[c][w] || 0) + gw[c]; NB.tot[c] += gw[c]; }
    }
    words.forEach(w => NB.vocab.add(w));
  }
  function nbPredict(words) {
    words = words.filter(w => NB.vocab.has(w));
    if (!words.length) return null;
    const V = NB.vocab.size, P = GENRES.reduce((s, c) => s + NB.prior[c], 0) || 1, lp = {};
    for (const c of GENRES) {
      const denom = NB.tot[c] + V;
      let l = Math.log((NB.prior[c] + 1e-3) / P);
      for (const w of words) l += Math.log(((NB.tok[c][w] || 0) + 1) / denom); // Laplace smoothing
      lp[c] = l / words.length;                                                // length-tempered: avoids over-confidence
    }
    const m = Math.max(...Object.values(lp)), ex = {}; let z = 0;
    for (const c of GENRES) { ex[c] = Math.exp(lp[c] - m); z += ex[c]; }
    const genres = {}; let any = false;
    for (const c of GENRES) { const p = ex[c] / z; if (p > CONFIG.nbMinProb) { genres[c] = p * CONFIG.nbGuessWeight; any = true; } }
    return any ? genres : null;
  }

  function normWeights(w) {
    const out = {}; let s = 0;
    for (const g in (w || {})) if (GENRE_SET.has(g) && w[g] > 0) { out[g] = w[g]; s += w[g]; }
    if (!s) return null;
    for (const g in out) out[g] /= s;
    return out;
  }
  /** Add or replace one artist. genres = {genre: weight}; weights are normalised to sum to 1. */
  function addArtist(name, genres) {
    const gw = normWeights(genres), id = key(name);
    if (!gw || !id) return false;
    const rec = { id, display: name, genres: gw };
    KB.artists.set(id, rec);
    if (id.startsWith('the') && id.length > 4) KB.artists.set(id.slice(3), rec); // "The Beatles" == "Beatles"
    nbLearn(tokens(name), gw);
    cache.clear();
    return true;
  }
  /** Link a song title to its artist. Add the artist first so the title also trains the classifier. */
  function addSong(title, artistName) {
    const t = key(title), rec = KB.artists.get(key(artistName));
    if (!t || !rec) return false;
    KB.songs.set(t, rec.id);
    nbLearn(tokens(title), rec.genres);
    cache.clear();
    return true;
  }
  /** Bulk-load from JSON / a DB export:  { artists: {name: {genre: w}}, songs: {title: artist} } */
  function loadKnowledgeBase(data) {
    let a = 0, s = 0;
    Object.entries((data && data.artists) || {}).forEach(([n, g]) => { if (addArtist(n, g)) a++; });
    Object.entries((data && data.songs) || {}).forEach(([t, n]) => { if (addSong(t, n)) s++; });
    return { artists: a, songs: s };
  }
  const kbStats = () => ({ artists: new Set([...KB.artists.values()]).size, songs: KB.songs.size, vocab: NB.vocab.size });
  function lookupArtist(name) { const k = key(name); return k ? KB.artists.get(k) || null : null; }

  // The KB starts EMPTY. Load real data at startup (DB export, Last.fm/MusicBrainz tags, etc.):
  //   ML.loadKnowledgeBase({ artists: { 'Name': {genre: weight} }, songs: { 'Title': 'Artist Name' } })
  // Tracks that carry their own genre tags (Spotify artist genres, Last.fm tags) need no KB at all.

  /* ===================================================================
     3. GENRE INFERENCE  track -> {genres, artists, source, confidence}
        source: 'kb' (artist known) | 'tags' (track's own genre tags) | 'song' (title known) | 'nb' (guessed) | 'none'
        Treat the returned object as read-only (results are cached).
     =================================================================== */
  function findArtists(artistStr) {
    if (!artistStr) return { recs: [], ids: [] };
    const whole = lookupArtist(artistStr);
    if (whole) return { recs: [whole], ids: [whole.id] };
    const recs = [], ids = [];
    for (const part of artistStr.split(ARTIST_SEP).map(s => s.trim()).filter(Boolean)) {
      const r = lookupArtist(part);
      if (r) { recs.push(r); ids.push(r.id); } else if (key(part)) ids.push(key(part)); // unknown artists still count for artist-overlap
    }
    return { recs, ids };
  }
  function averageGenres(recs) {
    const out = {};
    recs.forEach(r => { for (const g in r.genres) out[g] = (out[g] || 0) + r.genres[g] / recs.length; });
    return out;
  }

  function resolve(track) {
    const { title, artist, tags } = asTrack(track);
    const ck = key(title) + '|' + key(artist) + '|' + tags.map(x => String(x).toLowerCase()).join(',');
    const hit = cache.get(ck);
    if (hit) return hit;

    const { recs, ids } = findArtists(artist);
    let res;
    if (recs.length) {
      res = { genres: averageGenres(recs), artists: [...new Set(ids)], source: 'kb', confidence: 1 };
    } else if (tags.length && tagVec(tags)) {
      res = { genres: tagVec(tags), artists: [...new Set(ids)], source: 'tags', confidence: 0.8 };
    } else {
      // song-title lookup: only when there is no artist, or the title is distinctive (2+ words) — avoids "Perfect"-style collisions
      const sid = KB.songs.get(key(title));
      const songRec = sid && (!artist || title.trim().split(/\s+/).length >= 2) ? KB.artists.get(sid) : null;
      if (songRec) {
        res = { genres: { ...songRec.genres }, artists: [...new Set([...ids, songRec.id])], source: 'song', confidence: 0.9 };
      } else {
        const g = nbPredict(tokens(artist + ' ' + title));
        res = g
          ? { genres: g, artists: [...new Set(ids)], source: 'nb', confidence: Math.max(...Object.values(g)) / CONFIG.nbGuessWeight }
          : { genres: {}, artists: [...new Set(ids)], source: 'none', confidence: 0 };
      }
    }
    cache.set(ck, res);
    if (cache.size > CONFIG.cacheSize) cache.delete(cache.keys().next().value); // FIFO eviction
    return res;
  }

  /* ===================================================================
     4. TASTE PROFILE
     profile = { vec (L1-normalised), artists:Set, n, top[3-5], coverage:{known,guessed,unknown}, hasSignal }
     =================================================================== */
  const zeroVec = () => { const v = {}; GENRES.forEach(g => v[g] = 0); return v; };

  function pickTop(vec) {
    const ranked = GENRES.filter(g => vec[g] > 0).sort((a, b) => vec[b] - vec[a]);
    const top = ranked.filter(g => vec[g] > CONFIG.topThreshold).slice(0, CONFIG.maxTop);
    for (const g of ranked) { if (top.length >= CONFIG.minTop) break; if (!top.includes(g)) top.push(g); } // always give 3 if we can
    return top.sort((a, b) => vec[b] - vec[a]);
  }
  function finish(vec, artists, n, coverage) {
    const s = GENRES.reduce((a, g) => a + vec[g], 0);
    if (s > 0) GENRES.forEach(g => vec[g] /= s);
    return { vec, artists, n, top: s > 0 ? pickTop(vec) : [], coverage, hasSignal: s > 0 };
  }
  const emptyCoverage = () => ({ known: 0, guessed: 0, unknown: 0 });

  /** tracks: array of [title, artist] | {title, artist|artists|channel}. Never throws; empty/garbage -> empty profile. */
  function profile(tracks) {
    const vec = zeroVec(), artists = new Set(), cov = emptyCoverage();
    let n = 0;
    for (const t of Array.isArray(tracks) ? tracks : []) {
      let r;
      try { r = resolve(t); } catch (e) { continue; }
      n++;
      r.artists.forEach(a => artists.add(a));
      for (const g in r.genres) vec[g] += r.genres[g];
      if (r.source === 'kb' || r.source === 'song' || r.source === 'tags') cov.known++; else if (r.source === 'nb') cov.guessed++; else cov.unknown++;
    }
    return finish(vec, artists, n, cov);
  }

  // Spotify free-text genre tags ("bollywood", "indian indie", "dance pop"...) -> taxonomy. A tag matching several rules is split between them.
  const TAG_RULES = [
    [/bollywood|filmi|hindi|indian pop|desi pop/, 'bollywood'], [/sufi|qawwali|ghazal/, 'sufi'], [/malayalam|mollywood/, 'malayalam'],
    [/reggae|\bska\b|dancehall/, 'reggae'], [/hip[ -]?hop|\brap\b|\btrap\b|drill/, 'hip-hop'], [/r&b|\bsoul\b|urban contemporary|funk/, 'r&b'],
    [/\bedm\b|\bhouse\b|techno|electro|dance|synth|trance|dubstep/, 'electronic'], [/classical|orchestra|piano|baroque|romantic era|soundtrack/, 'classical'],
    [/ambient|drone|new age|sleep|lo-?fi|chill/, 'ambient'], [/indie|acoustic|singer-songwriter|bedroom/, 'indie'], [/folk|country|bluegrass/, 'folk'],
    [/jazz|bebop|swing/, 'jazz'], [/rock|metal|punk|grunge|alternative/, 'rock'], [/pop/, 'pop']
  ];
  function tagsToVec(tags, vec, weight) {
    let counted = 0;
    const local = zeroVec();
    (tags || []).forEach(t => {
      const s = String(t).toLowerCase(), hits = TAG_RULES.filter(r => r[0].test(s));
      hits.forEach(h => local[h[1]] += 1 / hits.length);
      if (hits.length) counted++;
    });
    GENRES.forEach(g => vec[g] += counted ? (local[g] / counted) * weight : 0);
    return counted > 0;
  }
  function tagVec(tags) { const v = zeroVec(); if (!tagsToVec(tags, v, 1)) return null; const o = {}; GENRES.forEach(g => { if (v[g] > 0) o[g] = v[g]; }); return o; }
  /** Flat list of genre tags -> profile. */
  function profileFromTags(tags) {
    const vec = zeroVec(), cov = emptyCoverage();
    const ok = tagsToVec(tags, vec, 1);
    cov[ok ? 'guessed' : 'unknown'] = (tags || []).length;
    return finish(vec, new Set(), (tags || []).length, cov);
  }
  /** Spotify /me/top/artists items: [{name, genres:[...]}]. KB wins; otherwise the artist's own tags (each artist counts once). */
  function profileFromSpotify(artistsIn) {
    const vec = zeroVec(), artists = new Set(), cov = emptyCoverage();
    let n = 0;
    for (const a of Array.isArray(artistsIn) ? artistsIn : []) {
      if (!a) continue;
      n++;
      const rec = a.name ? lookupArtist(a.name) : null;
      if (a.name && key(a.name)) artists.add(rec ? rec.id : key(a.name));
      if (rec) { for (const g in rec.genres) vec[g] += rec.genres[g]; cov.known++; }
      else if (tagsToVec(a.genres, vec, 1)) cov.guessed++;
      else cov.unknown++;
    }
    return finish(vec, artists, n, cov);
  }

  /* ---- service adapters: raw API items -> clean [{title, artist}] ---- */
  function fromYouTube(videos) {
    return (Array.isArray(videos) ? videos : []).map(v => {
      const title = cleanTitle(v && v.title), channel = cleanArtist(v && (v.channel || v.channelTitle));
      if (lookupArtist(channel)) return { title, artist: channel };            // "Arijit Singh - Topic" style channels
      const m = title.match(/^(.+?)\s[-–—]\s(.+)$/);                           // "Artist - Song" video titles
      return m ? { title: m[2].trim(), artist: m[1].trim() } : { title, artist: channel };
    });
  }
  function fromGaana(tracks) {
    return (Array.isArray(tracks) ? tracks : []).map(t => asTrack({ title: t && (t.title || t.name), artist: t && (t.artists || t.artist) }));
  }

  /* ===================================================================
     5. TF-IDF  (incremental, so it scales: keep df counters, not all profiles)
     =================================================================== */
  class IdfModel {
    constructor() { this.N = 0; this.df = {}; GENRES.forEach(g => this.df[g] = 0); this._idf = null; }
    add(p) { this.N++; GENRES.forEach(g => { if (p.vec[g] > CONFIG.topThreshold) this.df[g]++; }); this._idf = null; return this; }
    remove(p) { if (this.N > 0) this.N--; GENRES.forEach(g => { if (p.vec[g] > CONFIG.topThreshold && this.df[g] > 0) this.df[g]--; }); this._idf = null; return this; }
    fit(profiles) { this.N = 0; GENRES.forEach(g => this.df[g] = 0); (profiles || []).forEach(p => this.add(p)); return this; }
    weights() {
      if (!this._idf) { this._idf = {}; GENRES.forEach(g => this._idf[g] = Math.log((1 + this.N) / (1 + this.df[g])) + 1); } // smoothed IDF, always >= 1
      return this._idf;
    }
    toJSON() { return { N: this.N, df: this.df }; }
    static fromJSON(o) { const m = new IdfModel(); m.N = (o && o.N) || 0; GENRES.forEach(g => m.df[g] = (o && o.df && o.df[g]) || 0); return m; }
  }
  const defaultIdf = new IdfModel();
  /** Fit the default IDF model on everyone currently in view. */
  function fit(profiles) { return defaultIdf.fit(profiles); }

  /* ===================================================================
     6. COMPATIBILITY
     =================================================================== */
  const labelFor = s => s >= 80 ? 'Musical soulmates' : s >= 60 ? 'Strong overlap' : s >= 40 ? 'Some common ground' : 'Different worlds — great for discovery';
  const names = gs => gs.map(g => LABEL[g] || g);
  const joinList = xs => xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
  const artistName = id => { const r = KB.artists.get(id); return r ? r.display : id; };
  const usable = p => !!(p && p.vec && GENRES.some(g => p.vec[g] > 0));

  /**
   * SYMMETRIC: compat(a, b) and compat(b, a) return the same score, label, components, shared genres and shared artists
   * (cosine, Jaccard and the shared-genre ranking are all order-independent). Only the perspective fields swap:
   * `bridge` = what the OTHER person likes that YOU don't; `bridgeForThem` = the reverse; myTop/theirTop follow the caller.
   */
  function compat(a, b, opts) {
    const idf = ((opts && opts.idf) || defaultIdf).weights();
    const myTop = (a && a.top) || [], theirTop = (b && b.top) || [];

    // graceful fallback: no data on either side -> baseline, never throws
    if (!usable(a) || !usable(b)) {
      return {
        score: CONFIG.baseline, label: labelFor(0), limitedData: true,
        components: { cosine: 0, genreJaccard: 0, artistJaccard: 0 },
        shared: [], sharedLabels: [], sharedArtists: [], bridge: usable(b) ? (theirTop[0] || null) : null, bridgeForThem: null,
        myTop, theirTop,
        explanation: 'Not enough listening data yet to compare — connect a music service to see how you match.'
      };
    }

    let dot = 0, na = 0, nb = 0, mn = 0, mx = 0;
    for (const g of GENRES) {
      const xa = a.vec[g] || 0, xb = b.vec[g] || 0, x = xa * idf[g], y = xb * idf[g];
      dot += x * y; na += x * x; nb += y * y;
      mn += Math.min(xa, xb); mx += Math.max(xa, xb);
    }
    const cos = na > 0 && nb > 0 ? dot / Math.sqrt(na * nb) : 0;
    const wj = mx > 0 ? mn / mx : 0;

    const A = a.artists || new Set(), B = b.artists || new Set();
    const sharedArtistIds = [...A].filter(x => B.has(x)).sort();
    const useArtists = A.size > 0 && B.size > 0;
    const aj = useArtists ? sharedArtistIds.length / (new Set([...A, ...B]).size || 1) : 0;

    // if artist data is missing on either side (e.g. tags-only Spotify), re-spread its 10% so scores aren't capped at 90
    const wsum = useArtists ? 1 : WEIGHTS.cosine + WEIGHTS.genreJaccard;
    const raw = (WEIGHTS.cosine * cos + WEIGHTS.genreJaccard * wj + (useArtists ? WEIGHTS.artistJaccard * aj : 0)) / wsum;
    const score = Math.max(CONFIG.baseline, Math.min(100, Math.round(100 * raw)));

    const shared = GENRES.filter(g => Math.min(a.vec[g] || 0, b.vec[g] || 0) > CONFIG.sharedThreshold)
      .sort((x, y) => (Math.min(a.vec[y], b.vec[y]) * idf[y] - Math.min(a.vec[x], b.vec[x]) * idf[x]) || GENRES.indexOf(x) - GENRES.indexOf(y)) // rare shared genres first, deterministic ties
      .slice(0, 3);

    const bridgeOf = (from, to) => GENRES.filter(g => (from.vec[g] || 0) >= CONFIG.topThreshold && (to.vec[g] || 0) < CONFIG.bridgeThreshold)
      .sort((x, y) => (from.vec[y] * idf[y] - from.vec[x] * idf[x]) || GENRES.indexOf(x) - GENRES.indexOf(y))[0] || null;
    const bridge = bridgeOf(b, a);        // something THEY love that YOU barely listen to
    const bridgeForThem = bridgeOf(a, b); // something YOU love that THEY barely listen to

    const sharedArtists = sharedArtistIds.slice(0, 5).map(artistName);
    const parts = [];
    if (shared.length) parts.push(`You both listen to ${joinList(names(shared))}.`);
    if (sharedArtists.length) parts.push(`You both like ${joinList(sharedArtists)}.`);
    let explanation = parts.length ? parts.join(' ') : 'Your tastes don’t overlap much yet.';
    if (bridge) explanation += ` They could introduce you to ${LABEL[bridge]}.`;

    return {
      score, label: labelFor(score), limitedData: false,
      components: { cosine: +cos.toFixed(3), genreJaccard: +wj.toFixed(3), artistJaccard: +aj.toFixed(3) },
      shared, sharedLabels: names(shared), sharedArtists, bridge, bridgeForThem,
      myTop, theirTop, explanation
    };
  }

  /* ===================================================================
     7. SCALING HELPERS
     =================================================================== */
  /** Rank a small list of candidates: [{id, profile}] -> [{id, ...compat}] sorted best-first. */
  function rank(me, candidates, opts) {
    const o = opts || {}, k = o.k || 20, minScore = o.minScore || 0;
    return (candidates || [])
      .map(c => ({ id: c.id, ...compat(me, c.profile, o) }))
      .filter(r => r.score >= minScore)
      .sort((x, y) => y.score - x.score).slice(0, k);
  }

  /**
   * In-memory candidate index for large user bases. Pre-filters by shared top genres (inverted index)
   * before running the full ensemble, and maintains the IDF model incrementally.
   * For millions of users run this server-side (or shard by region/language) rather than in the browser.
   */
  class MatchIndex {
    constructor() { this.profiles = new Map(); this.byGenre = {}; GENRES.forEach(g => this.byGenre[g] = new Set()); this.idf = new IdfModel(); }
    add(id, p) {
      if (this.profiles.has(id)) this.remove(id);
      this.profiles.set(id, p); this.idf.add(p);
      (p.top || []).forEach(g => this.byGenre[g].add(id));
    }
    remove(id) {
      const p = this.profiles.get(id); if (!p) return false;
      this.idf.remove(p); (p.top || []).forEach(g => this.byGenre[g].delete(id)); this.profiles.delete(id); return true;
    }
    findMatches(p, opts) {
      const o = opts || {}, k = o.k || 20, maxCandidates = o.maxCandidates || 2000;
      const hits = new Map();
      (p.top || []).forEach(g => this.byGenre[g].forEach(id => hits.set(id, (hits.get(id) || 0) + 1)));
      if (hits.size < k) for (const id of this.profiles.keys()) { if (hits.size >= maxCandidates) break; if (!hits.has(id)) hits.set(id, 0); } // discovery fallback
      const ids = [...hits.entries()].sort((x, y) => y[1] - x[1]).slice(0, maxCandidates).map(e => e[0]).filter(id => id !== o.excludeId);
      return rank(p, ids.map(id => ({ id, profile: this.profiles.get(id) })), { k, minScore: o.minScore, idf: this.idf });
    }
    get size() { return this.profiles.size; }
  }

  /* ---- persistence: Sets don't JSON-serialise; store profiles in Supabase as jsonb ---- */
  const serialize = p => ({ vec: p.vec, artists: [...p.artists], n: p.n, top: p.top, coverage: p.coverage, hasSignal: p.hasSignal });
  const deserialize = o => ({ vec: o.vec, artists: new Set(o.artists || []), n: o.n || 0, top: o.top || [], coverage: o.coverage || emptyCoverage(), hasSignal: o.hasSignal !== false });

  return {
    GENRES, LABEL, WEIGHTS, CONFIG,
    // knowledge base
    addArtist, addSong, loadKnowledgeBase, kbStats,
    // inference + profiles
    resolve, profile, profileFromTags, profileFromSpotify, fromYouTube, fromGaana, cleanTitle,
    // tf-idf + scoring
    IdfModel, fit, compat, rank, MatchIndex,
    // persistence
    serialize, deserialize
  };
});
