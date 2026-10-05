/* =====================================================================
   echovro-ml.js — music-taste inference + compatibility (runs in the browser, no dependencies)

   PIPELINE
   1. GENRE INFERENCE  (track → genre distribution)
        a) Knowledge base lookup: artist (or song title) → genre weights
        b) Fallback for unseen tracks: Multinomial Naive Bayes over artist/title words
           (trained at load time from the knowledge base, Laplace smoothing)
   2. TASTE PROFILE    (many tracks OR signup preferences → normalised genre vector + artist set)
   3. TF-IDF WEIGHTING (genres everybody listens to, e.g. pop, count for less than rare ones)
   4. COMPATIBILITY    score = 0.60·cosine(TF-IDF) + 0.30·weighted-Jaccard(genres) + 0.10·Jaccard(artists)
   ===================================================================== */
(function (root) {
  'use strict';

  const GENRES = ['pop','rock','hip-hop','electronic','r&b','indie','classical','ambient','reggae','folk','bollywood','sufi','malayalam','tamil','jazz','metal','latin','country','blues','punk','soul'];
  const LABEL = {pop:'Pop',rock:'Rock','hip-hop':'Hip-hop',electronic:'Electronic','r&b':'R&B / Soul',indie:'Indie / Acoustic',classical:'Classical',ambient:'Ambient',reggae:'Reggae',folk:'Folk',bollywood:'Bollywood',sufi:'Sufi',malayalam:'Malayalam film',tamil:'Tamil film',jazz:'Jazz',metal:'Metal',latin:'Latin',country:'Country',blues:'Blues',punk:'Punk',soul:'Soul'};

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.& ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = s => norm(s).split(/[^a-z0-9]+/).filter(w => w.length > 1);

  /* ---------- Knowledge base ---------- */
  const ARTISTS_RAW = {
  "The Beatles": {
    "rock": 0.5,
    "pop": 0.4,
    "folk": 0.1
  },
  "Bob Marley": {
    "reggae": 0.8,
    "folk": 0.1,
    "rock": 0.1
  },
  "A.R. Rahman": {
    "bollywood": 0.6,
    "sufi": 0.2,
    "electronic": 0.1,
    "classical": 0.1
  },
  "Arijit Singh": {
    "bollywood": 0.8,
    "pop": 0.1,
    "sufi": 0.1
  },
  "The Weeknd": {
    "r&b": 0.5,
    "pop": 0.35,
    "electronic": 0.15
  },
  "Dua Lipa": {
    "pop": 0.6,
    "electronic": 0.3,
    "r&b": 0.1
  },
  "Vijay Yesudas": {
    "malayalam": 0.8,
    "bollywood": 0.2
  },
  "Ed Sheeran": {
    "pop": 0.5,
    "indie": 0.4,
    "folk": 0.1
  },
  "Mohit Chauhan": {
    "bollywood": 0.6,
    "indie": 0.2,
    "folk": 0.2
  },
  "Jack Johnson": {
    "indie": 0.6,
    "folk": 0.2,
    "reggae": 0.1,
    "pop": 0.1
  },
  "Claude Debussy": {
    "classical": 1
  },
  "Erik Satie": {
    "classical": 0.8,
    "ambient": 0.2
  },
  "Marconi Union": {
    "ambient": 0.8,
    "electronic": 0.2
  },
  "Tochi Raina": {
    "bollywood": 0.5,
    "sufi": 0.3,
    "indie": 0.2
  },
  "Coldplay": {
    "rock": 0.4,
    "pop": 0.4,
    "indie": 0.2
  },
  "Taylor Swift": {
    "pop": 0.7,
    "indie": 0.2,
    "folk": 0.1
  },
  "Drake": {
    "hip-hop": 0.7,
    "r&b": 0.2,
    "pop": 0.1
  },
  "Kendrick Lamar": {
    "hip-hop": 0.9,
    "r&b": 0.1
  },
  "Daft Punk": {
    "electronic": 0.9,
    "pop": 0.1
  },
  "Adele": {
    "pop": 0.5,
    "r&b": 0.3,
    "jazz": 0.2
  },
  "Nusrat Fateh Ali Khan": {
    "sufi": 0.8,
    "classical": 0.2
  },
  "KK": {
    "bollywood": 0.8,
    "rock": 0.1,
    "pop": 0.1
  },
  "Shreya Ghoshal": {
    "bollywood": 0.8,
    "classical": 0.2
  },
  "Sid Sriram": {
    "r&b": 0.4,
    "bollywood": 0.3,
    "indie": 0.3
  },
  "Anirudh Ravichander": {
    "bollywood": 0.4,
    "electronic": 0.4,
    "pop": 0.2
  },
  "Miles Davis": {
    "jazz": 1
  },
  "Norah Jones": {
    "jazz": 0.5,
    "indie": 0.3,
    "folk": 0.2
  },
  "Radiohead": {
    "rock": 0.5,
    "indie": 0.3,
    "electronic": 0.2
  },
  "Billie Eilish": {
    "pop": 0.5,
    "electronic": 0.3,
    "indie": 0.2
  },
  "Post Malone": {
    "hip-hop": 0.5,
    "pop": 0.4,
    "rock": 0.1
  },
  "Imagine Dragons": {
    "rock": 0.5,
    "pop": 0.4,
    "electronic": 0.1
  },
  "Queen": {
    "rock": 0.9,
    "pop": 0.1
  },
  "Pink Floyd": {
    "rock": 0.7,
    "ambient": 0.3
  },
  "Ludovico Einaudi": {
    "classical": 0.7,
    "ambient": 0.3
  },
  "Hans Zimmer": {
    "classical": 0.6,
    "ambient": 0.2,
    "electronic": 0.2
  },
  "Hesham Abdul Wahab": {
    "malayalam": 0.7,
    "indie": 0.2,
    "sufi": 0.1
  },
  "Sooraj Santhosh": {
    "malayalam": 0.7,
    "indie": 0.2,
    "r&b": 0.1
  },
  "Shaan Rahman": {
    "malayalam": 0.8,
    "pop": 0.2
  },
  "K.S. Harisankar": {
    "malayalam": 0.8,
    "classical": 0.2
  },
  "Ayraan": {
    "malayalam": 0.8,
    "indie": 0.2
  },
  "Vineeth Sreenivasan": {
    "malayalam": 0.8,
    "pop": 0.2
  },
  "Mithun Jayaraj": {
    "malayalam": 0.8,
    "folk": 0.2
  },
  "Haricharan": {
    "malayalam": 0.4,
    "tamil": 0.5,
    "classical": 0.1
  },
  "K.J. Yesudas": {
    "malayalam": 0.7,
    "classical": 0.2,
    "tamil": 0.1
  },
  "M.G. Sreekumar": {
    "malayalam": 0.8,
    "folk": 0.1,
    "classical": 0.1
  },
  "Shahabaz Aman": {
    "malayalam": 0.6,
    "sufi": 0.3,
    "indie": 0.1
  },
  "Job Kurian": {
    "malayalam": 0.6,
    "indie": 0.3,
    "rock": 0.1
  },
  "Sushin Shyam": {
    "malayalam": 0.6,
    "electronic": 0.2,
    "rock": 0.2
  },
  "Benny Dayal": {
    "pop": 0.4,
    "tamil": 0.3,
    "electronic": 0.3
  },
  "Navin Madhav": {
    "malayalam": 0.7,
    "rock": 0.3
  },
  "Sithara Krishnakumar": {
    "malayalam": 0.6,
    "classical": 0.2,
    "folk": 0.2
  },
  "Siddharth Menon": {
    "malayalam": 0.6,
    "pop": 0.2,
    "indie": 0.2
  },
  "Sujatha Mohan": {
    "malayalam": 0.6,
    "tamil": 0.3,
    "classical": 0.1
  },
  "K.S. Chithra": {
    "malayalam": 0.5,
    "tamil": 0.4,
    "classical": 0.1
  },
  "Niranj Suresh": {
    "malayalam": 0.6,
    "rock": 0.4
  },
  "Mohammed Maqbool Mansoor": {
    "malayalam": 0.6,
    "sufi": 0.4
  },
  "Jithin Raj": {
    "malayalam": 0.7,
    "classical": 0.3
  },
  "Vedan": {
    "hip-hop": 0.8,
    "malayalam": 0.2
  },
  "ThirumaLi": {
    "hip-hop": 0.8,
    "malayalam": 0.2
  },
  "Jassie Gift": {
    "malayalam": 0.5,
    "reggae": 0.3,
    "pop": 0.2
  },
  "Karthik": {
    "tamil": 0.6,
    "malayalam": 0.2,
    "pop": 0.2
  },
  "Afsal": {
    "malayalam": 0.8,
    "folk": 0.2
  },
  "Gopi Sundar": {
    "malayalam": 0.6,
    "tamil": 0.2,
    "electronic": 0.2
  },
  "Unni Mukundan": {
    "malayalam": 0.8,
    "pop": 0.2
  },
  "Sreenath Bhasi": {
    "malayalam": 0.6,
    "hip-hop": 0.2,
    "electronic": 0.2
  },
  "Rex Vijayan": {
    "indie": 0.5,
    "rock": 0.3,
    "malayalam": 0.2
  },
  "Jakes Bejoy": {
    "malayalam": 0.6,
    "electronic": 0.4
  },
  "Sanah Moidutty": {
    "pop": 0.4,
    "malayalam": 0.4,
    "folk": 0.2
  },
  "P. Jayachandran": {
    "malayalam": 0.7,
    "classical": 0.3
  },
  "Dhanush": {
    "tamil": 0.8,
    "folk": 0.2
  },
  "Dhee": {
    "tamil": 0.5,
    "indie": 0.3,
    "r&b": 0.2
  },
  "Hariharan": {
    "classical": 0.4,
    "tamil": 0.3,
    "bollywood": 0.3
  },
  "Bombay Jayashri": {
    "classical": 0.8,
    "tamil": 0.2
  },
  "Vijay Prakash": {
    "tamil": 0.5,
    "classical": 0.3,
    "bollywood": 0.2
  },
  "Vijay": {
    "tamil": 0.8,
    "pop": 0.2
  },
  "Ilaiyaraaja": {
    "classical": 0.5,
    "tamil": 0.4,
    "folk": 0.1
  },
  "Unni Menon": {
    "tamil": 0.6,
    "malayalam": 0.3,
    "classical": 0.1
  },
  "Kailash Kher": {
    "sufi": 0.6,
    "folk": 0.2,
    "bollywood": 0.2
  },
  "Shashaa Tirupati": {
    "pop": 0.4,
    "tamil": 0.3,
    "indie": 0.3
  },
  "Sathya Prakash": {
    "classical": 0.5,
    "tamil": 0.5
  },
  "D. Imman": {
    "tamil": 0.7,
    "folk": 0.3
  },
  "Silambarasan TR": {
    "tamil": 0.8,
    "electronic": 0.2
  },
  "Harris Jayaraj": {
    "tamil": 0.6,
    "electronic": 0.3,
    "pop": 0.1
  },
  "Shakthisree Gopalan": {
    "indie": 0.5,
    "tamil": 0.3,
    "jazz": 0.2
  },
  "Shankar Mahadevan": {
    "classical": 0.4,
    "bollywood": 0.3,
    "tamil": 0.3
  },
  "Yuvan Shankar Raja": {
    "tamil": 0.6,
    "electronic": 0.2,
    "hip-hop": 0.2
  },
  "Sukhwinder Singh": {
    "bollywood": 0.6,
    "folk": 0.2,
    "sufi": 0.2
  },
  "Vishal Mishra": {
    "bollywood": 0.7,
    "indie": 0.2,
    "pop": 0.1
  },
  "Akhil Sachdeva": {
    "bollywood": 0.7,
    "indie": 0.3
  },
  "Atif Aslam": {
    "bollywood": 0.5,
    "pop": 0.3,
    "sufi": 0.2
  },
  "Sonu Nigam": {
    "bollywood": 0.7,
    "pop": 0.2,
    "classical": 0.1
  },
  "Roop Kumar Rathod": {
    "sufi": 0.6,
    "bollywood": 0.4
  },
  "Ankit Tiwari": {
    "bollywood": 0.7,
    "rock": 0.2,
    "indie": 0.1
  },
  "Amit Trivedi": {
    "indie": 0.4,
    "bollywood": 0.4,
    "folk": 0.2
  },
  "Vishal Dadlani": {
    "rock": 0.4,
    "bollywood": 0.4,
    "electronic": 0.2
  },
  "Sreerama Chandra": {
    "bollywood": 0.8,
    "pop": 0.2
  },
  "Neha Kakkar": {
    "pop": 0.6,
    "bollywood": 0.4
  },
  "Badshah": {
    "hip-hop": 0.6,
    "pop": 0.4
  },
  "Ranveer Singh": {
    "hip-hop": 0.8,
    "bollywood": 0.2
  },
  "Divine": {
    "hip-hop": 1
  },
  "Nucleya": {
    "electronic": 1
  },
  "Mohammed Irfan": {
    "bollywood": 0.8,
    "sufi": 0.2
  },
  "Priya Saraiya": {
    "bollywood": 0.7,
    "indie": 0.3
  },
  "Lata Mangeshkar": {
    "classical": 0.6,
    "bollywood": 0.4
  },
  "Udit Narayan": {
    "bollywood": 0.8,
    "folk": 0.2
  },
  "Kumar Sanu": {
    "bollywood": 0.8,
    "pop": 0.2
  },
  "Javed Ali": {
    "sufi": 0.6,
    "bollywood": 0.4
  },
  "Rekha Bhardwaj": {
    "folk": 0.5,
    "sufi": 0.3,
    "bollywood": 0.2
  },
  "Harshdeep Kaur": {
    "sufi": 0.7,
    "folk": 0.3
  },
  "Pawni Pandey": {
    "bollywood": 0.8,
    "pop": 0.2
  },
  "Diljit Dosanjh": {
    "hip-hop": 0.4,
    "pop": 0.4,
    "folk": 0.2
  },
  "Bruno Mars": {
    "pop": 0.5,
    "r&b": 0.3,
    "soul": 0.2
  },
  "Harry Styles": {
    "pop": 0.6,
    "rock": 0.3,
    "indie": 0.1
  },
  "Eminem": {
    "hip-hop": 1
  },
  "Nirvana": {
    "rock": 1
  },
  "Linkin Park": {
    "rock": 0.7,
    "metal": 0.2,
    "electronic": 0.1
  },
  "Metallica": {
    "metal": 0.9,
    "rock": 0.1
  }
};
  const SONGS_RAW = {
  "Here Comes the Sun": "The Beatles",
  "Three Little Birds": "Bob Marley",
  "Kun Faya Kun": "A.R. Rahman",
  "Ilahi": "Arijit Singh",
  "Agar Tum Saath Ho": "Arijit Singh",
  "Blinding Lights": "The Weeknd",
  "Starboy": "The Weeknd",
  "Levitating": "Dua Lipa",
  "Malare": "Vijay Yesudas",
  "Perfect": "Ed Sheeran",
  "Tum Se Hi": "Mohit Chauhan",
  "Banana Pancakes": "Jack Johnson",
  "Clair de Lune": "Claude Debussy",
  "Gymnopédie No. 1": "Erik Satie",
  "Weightless": "Marconi Union",
  "Kabira": "Tochi Raina",
  "Darshana": "Hesham Abdul Wahab",
  "Aaradhike": "Sooraj Santhosh",
  "Jimikki Kammal": "Shaan Rahman",
  "Pavizha Mazha": "K.S. Harisankar",
  "Uyiril Thodum": "Sooraj Santhosh",
  "Aathma Raavile": "Sushin Shyam",
  "Alare": "Ayraan",
  "Kudukku": "Vineeth Sreenivasan",
  "Pala Palli": "Mithun Jayaraj",
  "Neela Shalabhame": "Haricharan",
  "Vennila Chandana Kinnam": "K.J. Yesudas",
  "Karutha Penne": "M.G. Sreekumar",
  "Mizhiyil Ninnum": "Shahabaz Aman",
  "Aaro Viral Neeti": "K.J. Yesudas",
  "Anuragathin Velayil": "Vineeth Sreenivasan",
  "Kaantha": "Job Kurian",
  "Ente Khalbile": "Vineeth Sreenivasan",
  "Rasputin": "Boney M",
  "Manavalan Thug": "SA",
  "Jaada": "Sushin Shyam",
  "Illuminati": "Sushin Shyam",
  "Omana Penne": "Benny Dayal",
  "Kalippu": "Navin Madhav",
  "Cherathukal": "Sithara Krishnakumar",
  "Jeevamshamayi": "K.S. Harisankar",
  "Parayuvaan": "Sid Sriram",
  "Thaniye": "Siddharth Menon",
  "Madhuvidhu": "Sujatha Mohan",
  "Ormakal": "K.J. Yesudas",
  "Kanne Kanne": "Sushin Shyam",
  "Doore Oru Mazhavillin": "K.J. Yesudas",
  "Kaathirunnu Kaathirunnu": "Shreya Ghoshal",
  "Lailakame": "Haricharan",
  "Kinaavile": "Job Kurian",
  "Entammede Jimikki Kammal": "Vineeth Sreenivasan",
  "Kaanana Chaya": "K.J. Yesudas",
  "Poomuthole": "Niranj Suresh",
  "Akale": "Malu",
  "Nee Himamazhayayi": "Haricharan",
  "Mukkathe Penne": "Mohammed Maqbool Mansoor",
  "Veyil Chilla": "Sushin Shyam",
  "Olu": "Sid Sriram",
  "Ayalathe Veettile": "Kavya Madhavan",
  "Aadujeevitham": "A.R. Rahman",
  "Hope Song": "A.R. Rahman",
  "Periyone": "Jithin Raj",
  "Kalam Kadanhu Poy": "K.J. Yesudas",
  "Maane": "Sushin Shyam",
  "Matha": "Sushin Shyam",
  "Neeyo": "Sushin Shyam",
  "Kuthanthram": "Vedan",
  "Voice of the Voiceless": "Vedan",
  "Aapathbhandhava": "ThirumaLi",
  "Malayali Da": "ThirumaLi",
  "Sambar": "ThirumaLi",
  "Naadodikkattu": "K.J. Yesudas",
  "Chithram": "M.G. Sreekumar",
  "Kilukkam": "M.G. Sreekumar",
  "Devadoothan": "K.J. Yesudas",
  "Pookkalam Panineer": "K.J. Yesudas",
  "Chandana Cholayil": "K.J. Yesudas",
  "Shyamameghame": "K.S. Chithra",
  "Rajahamsame": "K.S. Chithra",
  "Varamanjaladiya": "K.S. Chithra",
  "Pinneyum Pinneyum": "K.J. Yesudas",
  "Harivarasanam": "K.J. Yesudas",
  "Katturumbu": "Jassie Gift",
  "Lajjavathiye": "Jassie Gift",
  "Annakkili": "Jassie Gift",
  "Oru Nokku Kaanuvan": "Karthik",
  "Khalbile Poothali": "Afsal",
  "Innalekalil": "K.J. Yesudas",
  "Kannodu Kannidayum": "K.J. Yesudas",
  "Pramadavanam": "K.J. Yesudas",
  "Unrum Manathil": "K.J. Yesudas",
  "Aaro Nenjil": "Gopi Sundar",
  "Eeran Kaatin": "K.J. Yesudas",
  "Etho Varmukilin": "K.S. Chithra",
  "Azhake": "K.J. Yesudas",
  "Manikya Malaraya Poovi": "Vineeth Sreenivasan",
  "Jimmiki": "Shaan Rahman",
  "Theerame": "Sushin Shyam",
  "Kallu": "Sushin Shyam",
  "Rathipushpam": "Unni Mukundan",
  "Bheeshma Parvam": "Sushin Shyam",
  "Parudeesa": "Sreenath Bhasi",
  "Njan Steve Lopez": "Rex Vijayan",
  "Ranam Title Track": "Jakes Bejoy",
  "Pathiye Pathiye": "Haricharan",
  "Mele Mele": "K.J. Yesudas",
  "Sundaranayavane": "Sithara Krishnakumar",
  "Thalatherichavar": "Sushin Shyam",
  "Minungum Minnaminunge": "M.G. Sreekumar",
  "Ponveene": "K.S. Chithra",
  "Thaane Thirinjum": "K.J. Yesudas",
  "Kannadi Koodum Kootti": "Sanah Moidutty",
  "Karuppinazhaku": "Sanah Moidutty",
  "Arupathu Maram": "Sanah Moidutty",
  "Mayanadhi Theme": "Rex Vijayan",
  "Mizhiyil": "Shahabaz Aman",
  "Kaayalinarike": "Rex Vijayan",
  "Uyire": "Sid Sriram",
  "Kannil Ninnum": "Vineeth Sreenivasan",
  "Oru Kathil": "Vineeth Sreenivasan",
  "Varikellam": "K.J. Yesudas",
  "Sree Ragamo": "K.J. Yesudas",
  "Chempoove": "K.J. Yesudas",
  "Devasangeetham": "K.J. Yesudas",
  "Azhagiya Laila": "Manoj K. Jayan",
  "Aarumukhan": "M.G. Sreekumar",
  "Chakkara Mavinte": "M.G. Sreekumar",
  "Kunkuma Poove": "K.S. Chithra",
  "Pulari Nilavu": "K.J. Yesudas",
  "Mizhineer Poovum": "K.J. Yesudas",
  "Ente Kannil": "K.J. Yesudas",
  "Swapnam Verumoru": "K.J. Yesudas",
  "Chandanathil": "K.J. Yesudas",
  "Athmavil Muttithavilathille": "K.J. Yesudas",
  "Pavada Praayam": "K.J. Yesudas",
  "Nee En Sarga Soundaryame": "K.J. Yesudas",
  "Manjil Virinja Poovu": "K.J. Yesudas",
  "Oru Dalapam Pole": "K.J. Yesudas",
  "Muthumani Thooval": "M.G. Sreekumar",
  "Paadasmarana": "K.J. Yesudas",
  "Puzhayorazhaku": "K.J. Yesudas",
  "Rowdy Baby": "Dhanush",
  "Why This Kolaveri Di": "Dhanush",
  "Arabic Kuthu": "Anirudh Ravichander",
  "Enjoy Enjaami": "Dhee",
  "Vaathi Coming": "Anirudh Ravichander",
  "Marakkuma Nenjam": "A.R. Rahman",
  "Hukum": "Anirudh Ravichander",
  "Kaavaalaa": "Anirudh Ravichander",
  "Megham Karukatha": "Dhanush",
  "Kanave Kanave": "Anirudh Ravichander",
  "Munbe Vaa": "Shreya Ghoshal",
  "Ennavale": "Unni Menon",
  "Nenjukkul Peidhidum": "Hariharan",
  "Vaseegara": "Bombay Jayashri",
  "Hosanna": "Vijay Prakash",
  "New York Nagaram": "A.R. Rahman",
  "Naan Pizhai": "Anirudh Ravichander",
  "Bae": "Anirudh Ravichander",
  "Jalabulajangu": "Anirudh Ravichander",
  "Beast Mode": "Anirudh Ravichander",
  "Dippam Dappam": "Anirudh Ravichander",
  "Porkanda Singam": "Anirudh Ravichander",
  "Vikram Title Track": "Anirudh Ravichander",
  "Kutty Story": "Vijay",
  "Chellamma": "Anirudh Ravichander",
  "Two Two Two": "Anirudh Ravichander",
  "Badass": "Anirudh Ravichander",
  "Lokiverse": "Anirudh Ravichander",
  "Neeyum Naanum": "Anirudh Ravichander",
  "Kadhaippoma": "Sid Sriram",
  "Inkem Inkem Inkem Kaavaale": "Sid Sriram",
  "Maruvaarthai": "Sid Sriram",
  "Ennodu Nee Irundhaal": "Sid Sriram",
  "Thalli Pogathey": "Sid Sriram",
  "Adiye": "Sid Sriram",
  "Yaen Ennai Pirindhaai": "Sid Sriram",
  "Srivalli": "Sid Sriram",
  "Samajavaragamana": "Sid Sriram",
  "Veyyon Silli": "Sid Sriram",
  "Sooriyanai Suttadhille": "Hariharan",
  "Malargale": "Hariharan",
  "Pachai Nirame": "Hariharan",
  "Kandukondain Kandukondain": "Hariharan",
  "Chinna Chinna Aasai": "Minmini",
  "Roja Janeman": "S.P. Balasubrahmanyam",
  "Kadhal Rojave": "S.P. Balasubrahmanyam",
  "En Kadhale": "S.P. Balasubrahmanyam",
  "Anjali Anjali": "S.P. Balasubrahmanyam",
  "Mettu Podu": "S.P. Balasubrahmanyam",
  "Ilamai Idho Idho": "S.P. Balasubrahmanyam",
  "Sundari Kannal Oru Sethi": "S.P. Balasubrahmanyam",
  "Rakkamma Kaiya Thattu": "S.P. Balasubrahmanyam",
  "Thenpandi Cheemayile": "Ilaiyaraaja",
  "Kanne Kalaimane": "K.J. Yesudas",
  "Poove Sempoove": "K.J. Yesudas",
  "Aagaya Vennilave": "K.J. Yesudas",
  "Pudhu Vellai Mazhai": "Unni Menon",
  "En Mel Vizhundha": "P. Jayachandran",
  "Kannalane": "K.S. Chithra",
  "Uyire Uyire": "Hariharan",
  "Anbe Anbe": "Hariharan",
  "Kurukku Chiruthavale": "Hariharan",
  "Ale Ale": "Karthik",
  "Oru Maalai": "Karthik",
  "Ava Enna Enna": "Karthik",
  "Usure Pogudhey": "Karthik",
  "Vizhi Moodi Yosithal": "Karthik",
  "Hasili Fisili": "Karthik",
  "O Mana Penne": "Neeti Mohan",
  "Aalaporaan Thamizhan": "Kailash Kher",
  "Mersal Arasan": "Anirudh Ravichander",
  "Neethanae": "A.R. Rahman",
  "Verithanam": "Vijay",
  "Bigil Bigil Bigiluma": "A.R. Rahman",
  "Singappenney": "A.R. Rahman",
  "Appadi Podu": "KK",
  "O Podu": "Anuradha Sriram",
  "Kalyana Vayasu": "Anirudh Ravichander",
  "Don'u Don'u Don'u": "Anirudh Ravichander",
  "Udhungada Sangu": "Anirudh Ravichander",
  "VIP Title Track": "Anirudh Ravichander",
  "Velaiilla Pattadhari": "Anirudh Ravichander",
  "Pookkale Sattru Oyivedungal": "Haricharan",
  "Aye Sinamika": "Karthik",
  "Mental Manadhil": "A.R. Rahman",
  "Kaara Aattakkaara": "A.R. Rahman",
  "Parandhu Sella Vaa": "Karthik",
  "Showkali": "Aditya Rao",
  "Sirikkadhey": "Anirudh Ravichander",
  "Remo Nee Kadhalan": "Anirudh Ravichander",
  "Senjitaley": "Anirudh Ravichander",
  "Daavuya": "Anirudh Ravichander",
  "Survivor": "Anirudh Ravichander",
  "Nallai Allai": "Sathya Prakash",
  "Vaan Varuvaan": "Shashaa Tirupati",
  "Sarattu Vandiyila": "A.R. Rahman",
  "Azhagiye": "A.R. Rahman",
  "Tango Kelaayo": "A.R. Rahman",
  "Mazhai Kuruvi": "A.R. Rahman",
  "Sevanthu Pochu Nenje": "A.R. Rahman",
  "Kannaana Kanney": "Sid Sriram",
  "Vetti Veru": "D. Imman",
  "Adchithooku": "D. Imman",
  "Gaanda Kannazhagi": "D. Imman",
  "Kambathu Ponnu": "D. Imman",
  "Danga Maari Oodhari": "Dhanush",
  "Maari Thara Local": "Dhanush",
  "Rowdy Baby Reprise": "Dhee",
  "Thee Thalapathy": "Silambarasan TR",
  "Ranjithame": "Vijay",
  "Jimbalakka": "Silambarasan TR",
  "Yennai Arindhaal": "Harris Jayaraj",
  "Adhaaru Adhaaru": "Harris Jayaraj",
  "Unakkenna Venum Sollu": "Benny Dayal",
  "Maya Bazaar": "A.R. Rahman",
  "Chinnanjiru Nilave": "Haricharan",
  "Aga Naga": "Shakthisree Gopalan",
  "Veera Raja Veera": "Shankar Mahadevan",
  "Ponni Nadhi": "A.R. Rahman",
  "Devaralan Aattam": "A.R. Rahman",
  "Saayndhu Saayndhu": "Yuvan Shankar Raja",
  "Oru Kal Oru Kannadi": "Yuvan Shankar Raja",
  "Paiyaa": "Yuvan Shankar Raja",
  "En Kadhal Solla": "Yuvan Shankar Raja",
  "Thuli Thuli": "Haricharan",
  "Poongatrile": "Unni Menon",
  "Tum Hi Ho": "Arijit Singh",
  "Kesariya": "Arijit Singh",
  "Channa Mereya": "Arijit Singh",
  "Raataan Lambiyan": "Jubin Nautiyal",
  "Shayad": "Arijit Singh",
  "Kal Ho Naa Ho": "Sonu Nigam",
  "Tere Bina": "A.R. Rahman",
  "Chaiyya Chaiyya": "Sukhwinder Singh",
  "Apna Bana Le": "Arijit Singh",
  "O Maahi": "Arijit Singh",
  "Pehle Bhi Main": "Vishal Mishra",
  "Gerua": "Arijit Singh",
  "Tera Ban Jaunga": "Akhil Sachdeva",
  "Dil Diyan Gallan": "Atif Aslam",
  "Hawayein": "Arijit Singh",
  "Ae Dil Hai Mushkil": "Arijit Singh",
  "Tujh Mein Rab Dikhta Hai": "Roop Kumar Rathod",
  "Pee Loon": "Mohit Chauhan",
  "Zara Sa": "KK",
  "Khuda Jaane": "KK",
  "Galliyan": "Ankit Tiwari",
  "Mast Magan": "Arijit Singh",
  "Naina Da Kya Kasoor": "Amit Trivedi",
  "Ghungroo": "Arijit Singh",
  "Jai Ho": "A.R. Rahman",
  "Matargashti": "Mohit Chauhan",
  "Badtameez Dil": "Benny Dayal",
  "Balam Pichkari": "Vishal Dadlani",
  "Dilliwaali Girlfriend": "Arijit Singh",
  "Subhanallah": "Sreerama Chandra",
  "Ghar More Pardesiya": "Shreya Ghoshal",
  "Deewani Mastani": "Shreya Ghoshal",
  "Pinga": "Shreya Ghoshal",
  "Nagada Sang Dhol": "Shreya Ghoshal",
  "Ghoomar": "Shreya Ghoshal",
  "Aankh Marey": "Neha Kakkar",
  "Dilbar": "Neha Kakkar",
  "Garmi": "Badshah",
  "Genda Phool": "Badshah",
  "Kala Chashma": "Badshah",
  "Kar Gayi Chull": "Badshah",
  "Abhi Toh Party Shuru Hui Hai": "Badshah",
  "Mercy": "Badshah",
  "DJ Waley Babu": "Badshah",
  "Apna Time Aayega": "Ranveer Singh",
  "Mere Gully Mein": "Divine",
  "Mirchi": "Divine",
  "Kaam 25": "Divine",
  "Sher Aaya Sher": "Divine",
  "Kohinoor": "Divine",
  "Fuego": "Nucleya",
  "Aaja": "Nucleya",
  "Bass Rani": "Nucleya",
  "Kooch": "Nucleya",
  "Banjaara": "Mohammed Irfan",
  "Dard Dilo Ke": "Mohammed Irfan",
  "Muskurane": "Arijit Singh",
  "Sun Saathiya": "Priya Saraiya",
  "Samjhawan": "Arijit Singh",
  "Main Rang Sharbaton Ka": "Atif Aslam",
  "Jeena Jeena": "Atif Aslam",
  "Pehli Nazar Mein": "Atif Aslam",
  "Tu Jaane Na": "Atif Aslam",
  "Tera Hone Laga Hoon": "Atif Aslam",
  "Woh Lamhe": "Atif Aslam",
  "Aadat": "Atif Aslam",
  "Bakhuda Tumhi Ho": "Atif Aslam",
  "Piya O Re Piya": "Atif Aslam",
  "Beete Lamhein": "KK",
  "Alvida": "KK",
  "Tu Hi Meri Shab Hai": "KK",
  "Kya Mujhe Pyar Hai": "KK",
  "Aankhon Mein Teri": "KK",
  "Dil Ibaadat": "KK",
  "Labon Ko": "KK",
  "Zindagi Do Pal Ki": "KK",
  "Sach Keh Raha Hai": "KK",
  "Yaaron": "KK",
  "Pal": "KK",
  "Suraj Hua Maddham": "Sonu Nigam",
  "Kabhi Khushi Kabhie Gham": "Lata Mangeshkar",
  "Bole Chudiyan": "Sonu Nigam",
  "You Are My Soniya": "Sonu Nigam",
  "Maahi Ve": "Sadhana Sargam",
  "Kuch Kuch Hota Hai": "Udit Narayan",
  "Koi Mil Gaya": "Udit Narayan",
  "Ladki Badi Anjani Hai": "Kumar Sanu",
  "Tujhe Dekha Toh": "Kumar Sanu",
  "Mehndi Laga Ke Rakhna": "Udit Narayan",
  "Ruk Ja O Dil Deewane": "Udit Narayan",
  "Ho Gaya Hai Tujhko": "Lata Mangeshkar",
  "Dil Se Re": "A.R. Rahman",
  "Jiya Jale": "Lata Mangeshkar",
  "Satrangi Re": "Sonu Nigam",
  "Rehna Tu": "A.R. Rahman",
  "Masakali": "Mohit Chauhan",
  "Arziyan": "Javed Ali",
  "Genda Phool Delhi 6": "Rekha Bhardwaj",
  "Sasural Genda Phool": "Rekha Bhardwaj",
  "Kabira Encore": "Harshdeep Kaur",
  "Zaalima": "Arijit Singh",
  "Udi Udi Jaye": "Sukhwinder Singh",
  "Laila Main Laila": "Pawni Pandey",
  "Sauda Khara Khara": "Diljit Dosanjh",
  "Lover": "Diljit Dosanjh",
  "Born to Shine": "Diljit Dosanjh",
  "GOAT": "Diljit Dosanjh",
  "Proper Patola": "Diljit Dosanjh",
  "Do You Know": "Diljit Dosanjh",
  "Raat Di Gedi": "Diljit Dosanjh",
  "Hass Hass": "Diljit Dosanjh",
  "Kinni Kinni": "Diljit Dosanjh",
  "Naina": "Diljit Dosanjh",
  "Ishq Mitaye": "Mohit Chauhan",
  "Nadaan Parindey": "A.R. Rahman",
  "Sadda Haq": "Mohit Chauhan",
  "Aur Ho": "Mohit Chauhan",
  "Jo Bhi Main": "Mohit Chauhan",
  "Save Your Tears": "The Weeknd",
  "The Hills": "The Weeknd",
  "Can't Feel My Face": "The Weeknd",
  "Earned It": "The Weeknd",
  "Die For You": "The Weeknd",
  "I Feel It Coming": "The Weeknd",
  "Heartless": "The Weeknd",
  "In Your Eyes": "The Weeknd",
  "Shape of You": "Ed Sheeran",
  "Bad Habits": "Ed Sheeran",
  "Thinking Out Loud": "Ed Sheeran",
  "Castle on the Hill": "Ed Sheeran",
  "Photograph": "Ed Sheeran",
  "Shivers": "Ed Sheeran",
  "Galway Girl": "Ed Sheeran",
  "Eyes Closed": "Ed Sheeran",
  "Give Me Love": "Ed Sheeran",
  "Blank Space": "Taylor Swift",
  "Cruel Summer": "Taylor Swift",
  "Anti-Hero": "Taylor Swift",
  "Shake It Off": "Taylor Swift",
  "Love Story": "Taylor Swift",
  "You Belong With Me": "Taylor Swift",
  "Cardigan": "Taylor Swift",
  "Willow": "Taylor Swift",
  "All Too Well": "Taylor Swift",
  "Style": "Taylor Swift",
  "Hotline Bling": "Drake",
  "God's Plan": "Drake",
  "One Dance": "Drake",
  "In My Feelings": "Drake",
  "Nice For What": "Drake",
  "Hold On, We're Going Home": "Drake",
  "Nonstop": "Drake",
  "Passionfruit": "Drake",
  "Rich Flex": "Drake",
  "Search & Rescue": "Drake",
  "HUMBLE.": "Kendrick Lamar",
  "Alright": "Kendrick Lamar",
  "DNA.": "Kendrick Lamar",
  "King Kunta": "Kendrick Lamar",
  "Swimming Pools": "Kendrick Lamar",
  "Bitch, Don't Kill My Vibe": "Kendrick Lamar",
  "All the Stars": "Kendrick Lamar",
  "Not Like Us": "Kendrick Lamar",
  "Euphoria": "Kendrick Lamar",
  "Money Trees": "Kendrick Lamar",
  "Don't Start Now": "Dua Lipa",
  "New Rules": "Dua Lipa",
  "Physical": "Dua Lipa",
  "Break My Heart": "Dua Lipa",
  "IDGAF": "Dua Lipa",
  "One Kiss": "Dua Lipa",
  "Dance The Night": "Dua Lipa",
  "Houdini": "Dua Lipa",
  "Illusion": "Dua Lipa",
  "Bad Guy": "Billie Eilish",
  "Birds of a Feather": "Billie Eilish",
  "Happier Than Ever": "Billie Eilish",
  "Ocean Eyes": "Billie Eilish",
  "When The Party's Over": "Billie Eilish",
  "Everything I Wanted": "Billie Eilish",
  "Lovely": "Billie Eilish",
  "Bury a Friend": "Billie Eilish",
  "What Was I Made For?": "Billie Eilish",
  "Lunch": "Billie Eilish",
  "Yellow": "Coldplay",
  "Fix You": "Coldplay",
  "Viva La Vida": "Coldplay",
  "The Scientist": "Coldplay",
  "A Sky Full of Stars": "Coldplay",
  "Paradise": "Coldplay",
  "Clocks": "Coldplay",
  "Hymn for the Weekend": "Coldplay",
  "Adventure of a Lifetime": "Coldplay",
  "My Universe": "Coldplay",
  "Bohemian Rhapsody": "Queen",
  "Don't Stop Me Now": "Queen",
  "Another One Bites the Dust": "Queen",
  "We Will Rock You": "Queen",
  "We Are the Champions": "Queen",
  "Under Pressure": "Queen",
  "Radio Ga Ga": "Queen",
  "Somebody to Love": "Queen",
  "Killer Queen": "Queen",
  "Crazy Little Thing Called Love": "Queen",
  "Hey Jude": "The Beatles",
  "Let It Be": "The Beatles",
  "Yesterday": "The Beatles",
  "Come Together": "The Beatles",
  "Something": "The Beatles",
  "In My Life": "The Beatles",
  "Blackbird": "The Beatles",
  "Eleanor Rigby": "The Beatles",
  "While My Guitar Gently Weeps": "The Beatles",
  "Smells Like Teen Spirit": "Nirvana",
  "Come As You Are": "Nirvana",
  "Lithium": "Nirvana",
  "Heart-Shaped Box": "Nirvana",
  "In Bloom": "Nirvana",
  "In the End": "Linkin Park",
  "Numb": "Linkin Park",
  "Faint": "Linkin Park",
  "Crawling": "Linkin Park",
  "What I've Done": "Linkin Park",
  "Enter Sandman": "Metallica",
  "Master of Puppets": "Metallica",
  "Nothing Else Matters": "Metallica",
  "One": "Metallica",
  "Fade to Black": "Metallica",
  "Believer": "Imagine Dragons",
  "Radioactive": "Imagine Dragons",
  "Demons": "Imagine Dragons",
  "Thunder": "Imagine Dragons",
  "Natural": "Imagine Dragons",
  "Someone Like You": "Adele",
  "Rolling in the Deep": "Adele",
  "Hello": "Adele",
  "Easy On Me": "Adele",
  "Set Fire to the Rain": "Adele",
  "Uptown Funk": "Bruno Mars",
  "Just the Way You Are": "Bruno Mars",
  "Grenade": "Bruno Mars",
  "Locked Out of Heaven": "Bruno Mars",
  "24K Magic": "Bruno Mars",
  "As It Was": "Harry Styles",
  "Watermelon Sugar": "Harry Styles",
  "Sign of the Times": "Harry Styles",
  "Adore You": "Harry Styles",
  "Golden": "Harry Styles",
  "Lose Yourself": "Eminem",
  "Without Me": "Eminem",
  "The Real Slim Shady": "Eminem",
  "Love The Way You Lie": "Eminem",
  "Stan": "Eminem"
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
      for (const c in gw) {
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
      words.forEach(w => l += Math.log(((NB.tok[c][w] || 0) + 1) / (NB.tot[c] + V)));
      lp[c] = l / words.length;
    });
    const m = Math.max(...Object.values(lp)), ex = {}; let z = 0;
    GENRES.forEach(c => { ex[c] = Math.exp(lp[c] - m); z += ex[c]; });
    const out = {};
    GENRES.forEach(c => { const p = ex[c] / z; if (p > .08) out[c] = p * .5; });
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
    return { vec, artists, n, top, hasData: n >= 1 };
  }
  function profile(tracks) {
    const vec = {}, artists = new Set(); GENRES.forEach(g => vec[g] = 0);
    (tracks || []).forEach(t => {
      const r = resolve(t); if (r.artist) artists.add(r.artist);
      for (const g in r.genres) vec[g] += r.genres[g];
    });
    return finish(vec, artists, (tracks || []).length);
  }

  // Spotify gives free-text genre tags per artist
  const TAGS = [[/bollywood|filmi|hindi|indian pop/, 'bollywood'], [/sufi|qawwali|ghazal/, 'sufi'], [/malayalam|mollywood/, 'malayalam'], [/tamil|kollywood/, 'tamil'], [/reggae|ska|dancehall/, 'reggae'],
    [/hip hop|rap|trap|drill/, 'hip-hop'], [/r&b|soul|urban contemporary|funk/, 'r&b'], [/edm|house|techno|electro|dance|synth|trance/, 'electronic'],
    [/classical|orchestra|piano|baroque|romantic era|soundtrack/, 'classical'], [/ambient|drone|new age|sleep|lo-?fi|chill/, 'ambient'],
    [/indie|acoustic|singer-songwriter|bedroom/, 'indie'], [/folk|country|bluegrass/, 'folk'], [/jazz|bebop|swing/, 'jazz'],
    [/rock|metal|punk|grunge|alternative/, 'rock'], [/pop/, 'pop']];
  function profileFromTags(tags) {
    const vec = {}; GENRES.forEach(g => vec[g] = 0);
    (tags || []).forEach(t => { const x = TAGS.find(r => r[0].test(norm(t))); if (x) vec[x[1]]++; });
    return finish(vec, new Set(), (tags || []).length);
  }

  /* ---------- Cold-start backbone: build profile from onboarding preferences ---------- */
  function profileFromPreferences(prefs) {
    if (!prefs) return finish({}, new Set(), 0);
    const vec = {}, artists = new Set();
    GENRES.forEach(g => vec[g] = 0);

    const chosenGenres = prefs.genres || [];
    chosenGenres.forEach(g => {
      const ng = norm(g);
      if (vec[ng] !== undefined) vec[ng] += 2.0;
    });

    const chosenArtists = prefs.artists || [];
    chosenArtists.forEach(a => {
      const na = norm(a);
      if (!na) return;
      artists.add(na);
      const r = resolve(['', na]);
      for (const g in r.genres) {
        if (vec[g] !== undefined) vec[g] += r.genres[g] * 1.5;
      }
    });

    const prof = finish(vec, artists, chosenGenres.length + chosenArtists.length);
    prof.languages = prefs.languages || [];
    return prof;
  }

  /* ---------- Step 3: TF-IDF over everyone currently in view ---------- */
  let IDF = {}; GENRES.forEach(g => IDF[g] = 1);
  function fit(profiles) {
    const N = profiles.length;
    GENRES.forEach(g => { const df = profiles.filter(p => (p.vec||{})[g] > .04).length; IDF[g] = Math.log((1 + N) / (1 + df)) + 1; });
  }

  /* ---------- Step 4: compatibility ---------- */
  function compat(a, b) {
    if (!a || !b) return { score: 15, shared: [], label: 'Different worlds — great for discovery', myTop: [], theirTop: [], bridge: null };
    const va = a.vec || a.genreVec || {};
    const vb = b.vec || b.genreVec || {};

    let dot = 0, na = 0, nb = 0, mn = 0, mx = 0;
    GENRES.forEach(g => {
      const x = (va[g] || 0) * (IDF[g] || 1), y = (vb[g] || 0) * (IDF[g] || 1);
      dot += x * y; na += x * x; nb += y * y;
      mn += Math.min(va[g] || 0, vb[g] || 0); mx += Math.max(va[g] || 0, vb[g] || 0);
    });
    const denom = Math.sqrt(na * nb);
    const cos = denom > 0 ? (dot / denom) : 0;
    const wj = mx > 0 ? (mn / mx) : 0;

    const aArtists = a.artists || (a.topArtists ? new Set(a.topArtists) : new Set());
    const bArtists = b.artists || (b.topArtists ? new Set(b.topArtists) : new Set());
    const inter = [...aArtists].filter(x => bArtists.has(x)).length, uni = new Set([...aArtists, ...bArtists]).size || 1;
    const artistJaccard = inter / uni;

    const langA = new Set(a.languages || []);
    const langB = new Set(b.languages || []);
    const langInter = [...langA].filter(l => langB.has(l)).length;
    const langSim = (langA.size + langB.size) > 0 ? (2.0 * langInter) / (langA.size + langB.size) : 0.5;

    let rawScore = 0.50 * cos + 0.25 * wj + 0.15 * artistJaccard + 0.10 * langSim;
    if (rawScore <= 0 && ((a.top && a.top.length) || (b.top && b.top.length))) {
      rawScore = 0.35;
    }
    const score = Math.max(15, Math.round(100 * Math.min(1, rawScore)));
    const shared = GENRES.filter(g => Math.min(va[g] || 0, vb[g] || 0) > .03).sort((x, y) => Math.min(vb[y] || 0, va[y] || 0) - Math.min(vb[x] || 0, va[x] || 0)).slice(0, 3);
    const bridge = (b.top || []).find(g => (va[g] || 0) < .05) || (b.top && b.top[0]) || null;
    const label = score >= 80 ? 'Musical soulmates' : score >= 60 ? 'Strong overlap' : score >= 40 ? 'Some common ground' : 'Different worlds — great for discovery';
    return { score, shared: shared.length ? shared : (a.top && a.top.slice(0, 2)) || [], label, bridge, myTop: a.top || [], theirTop: b.top || [] };
  }

  root.ML = { GENRES, LABEL, resolve, profile, profileFromTags, profileFromPreferences, fit, compat };
})(window);
