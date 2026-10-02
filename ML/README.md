# Machine Learning Compatibility

## Overview
EchoVro matches users based on the similarity of their musical tastes. The current prototype uses a **content‑based filtering** approach with **cosine similarity** on a vector representation of each user’s preferred tracks.

## Data Representation
- Each user has a list of **track IDs** (Spotify/YouTube/Mock IDs) stored in the `tracksJson` field of the `User` entity.
- The system builds a **binary feature vector** for every user where each dimension represents a unique track across the whole community.
  - `1` indicates the user has that track in their library.
  - `0` otherwise.

## Similarity Calculation
1. **Vector Construction** – Collect all unique track IDs from the database and map them to vector indices.
2. **Cosine Similarity** – For users *A* and *B*:
   ```
   similarity = (A · B) / (||A|| * ||B||)
   ```
   where `·` is the dot product and `||A||` is the Euclidean norm.
3. **Threshold** – Users with a similarity score **≥ 0.5** are considered compatible and may be suggested as connections.

## Usage in the Application
- The `ConnectionService` computes similarity when a user requests a list of suggested connections.
- The result is returned as a list of `UserDto` objects sorted by descending similarity.

## Future Enhancements
- **Collaborative Filtering** – Incorporate behaviour (likes, plays) to capture implicit preferences.
- **Hybrid Model** – Combine content‑based vectors with social graph features (mutual connections, shared places).
- **Model Training** – Replace hand‑crafted vectors with learned embeddings using a lightweight neural network (e.g., TensorFlow Lite) for richer similarity signals.

---

*This file resides at `ML/README.md` within the repository.*
