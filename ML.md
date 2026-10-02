# EchoVro Music Compatibility ML Algorithm

## Overview
EchoVro determines how compatible two users are based on their musical preferences (retrieved via Spotify/YouTube Music). To provide a score that is both accurate and explainable, we use a **TF-IDF (Term Frequency-Inverse Document Frequency) combined with Cosine Similarity** approach.

While deep learning (like Neural Collaborative Filtering) can find hidden patterns, TF-IDF + Cosine Similarity provides **explainability**—meaning we can tell the users *exactly* why they matched ("You both heavily listen to *The Weeknd* and *Indie Pop*").

## How it works

### 1. Data Extraction (The "Document")
When a user connects their Spotify account, we extract their top tracks, artists, and associated genres.
For the algorithm, each user's profile is treated as a "document" of words. The "words" are the Artist IDs and Genres.

Example User A Document:
`[ "artist:the_weeknd", "artist:the_weeknd", "genre:synth_pop", "artist:daft_punk" ]`

### 2. TF-IDF Vectorization
We calculate a weight for each artist/genre for the user:
* **Term Frequency (TF)**: How often this user listens to this artist compared to other artists. (e.g. The Weeknd has a high TF).
* **Inverse Document Frequency (IDF)**: How rare this artist is across the entire EchoVro user base. If *everyone* listens to Taylor Swift, matching on her gives a lower compatibility boost than matching on an obscure indie band. 

This results in a weighted vector for every user.

### 3. Cosine Similarity
To find the compatibility between User A and User B, we calculate the Cosine Similarity of their TF-IDF vectors.
Cosine similarity measures the angle between two vectors in a multi-dimensional space, giving a score between `0.0` (completely different taste) and `1.0` (identical taste).

Score formula: `Similarity = (A · B) / (||A|| * ||B||)`

### 4. Explainability
Because we use TF-IDF, we can easily extract the terms (artists/genres) that contributed the most to the dot product `(A · B)`. 
When the score is presented to the user, we also present the top 3 highest-contributing factors:
> "85% Match! You both have an unusually high affinity for **Tame Impala** and **Psychedelic Rock**."

## Why this algorithm?
- **Cold Start Resistant**: We don't need millions of users to start providing good recommendations. IDF can be bootstrapped from global Spotify stats, or start flat.
- **Highly Explainable**: We can always show the user *why* they matched.
- **Fast**: Dot products of sparse vectors are computationally very cheap and can run in real-time.
