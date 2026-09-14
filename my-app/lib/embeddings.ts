// Semantic embeddings generator and vector similarity utilities

// Domain semantic anchor clusters used for deterministic feature vector projection
const SEMANTIC_ANCHORS = [
  // Performance & Latency (Dims 0-25)
  ['slow', 'fast', 'latency', 'speed', 'load', 'loading', 'lag', 'lagging', 'freeze', 'timeout', 'quick', 'snappy', 'perf', 'bottleneck', 'delay', 'seconds', 'response time', 'spinning', 'wheel', 'sluggish', 'hang', 'hanging'],
  
  // Bugs & Defects (Dims 26-55)
  ['bug', 'crash', 'crashing', 'error', 'broken', 'fail', 'failed', 'failure', 'glitch', 'exception', '500', 'blank', 'stuck', 'down', 'defect', 'issue', 'problem', 'fix', 'regression', 'reproduce', 'unhandled', 'breaks', 'corrupted', 'lost data'],
  
  // UI & UX & Design (Dims 56-85)
  ['ui', 'ux', 'design', 'layout', 'button', 'color', 'dark mode', 'theme', 'mobile', 'responsive', 'cluttered', 'clean', 'intuitive', 'confusing', 'interface', 'font', 'visual', 'navigation', 'sidebar', 'icon', 'contrast', 'alignment', 'screen', 'view'],
  
  // Billing & Pricing (Dims 86-115)
  ['price', 'pricing', 'expensive', 'cheap', 'cost', 'charge', 'charged', 'bill', 'billing', 'invoice', 'receipt', 'refund', 'subscription', 'plan', 'tier', 'credit card', 'payment', 'upgrade', 'cancel', 'overcharged', 'hidden fee', 'discount', 'free tier'],
  
  // Support & Customer Success (Dims 116-140)
  ['support', 'agent', 'help', 'helpdesk', 'ticket', 'representative', 'response', 'friendly', 'rude', 'unhelpful', 'service', 'contact', 'email support', 'live chat', 'escalate', 'waiting', 'hours', 'sla', 'resolution'],
  
  // Features & Integrations (Dims 141-170)
  ['feature', 'add', 'request', 'integration', 'export', 'import', 'webhook', 'slack', 'discord', 'jira', 'github', 'notion', 'api', 'roadmap', 'sync', 'csv', 'filter', 'search', 'automation', 'plug-in', 'sdk', 'customization'],
  
  // Onboarding & Team Workspaces (Dims 171-195)
  ['onboarding', 'signup', 'setup', 'tutorial', 'getting started', 'guide', 'documentation', 'invite', 'team', 'workspace', 'login', 'auth', 'password', 'sso', 'member', 'permission', 'role', 'admin', 'roster'],
  
  // Positive Sentiment Signals (Dims 196-225)
  ['love', 'great', 'awesome', 'amazing', 'excellent', 'fantastic', 'best', 'smooth', 'helpful', 'wonderful', 'perfect', 'brilliant', 'superb', 'enjoy', 'favorite', 'game changer', 'recommend', 'delighted', 'kudos', 'cleanly'],
  
  // Negative Sentiment Signals (Dims 226-255)
  ['hate', 'terrible', 'worst', 'horrible', 'frustrating', 'disappointed', 'annoying', 'awful', 'poor', 'useless', 'unusable', 'garbage', 'waste', 'regret', 'unacceptable', 'frustration', 'annoyed', 'mad', 'angry', 'dealbreaker'],
];

const VECTOR_DIMENSIONS = 256;

// Deterministic hash function for tokens and n-grams
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

// Generates a normalized dense vector embedding for any text string (Local, zero-latency, deterministic)
export async function generateEmbedding(text: string): Promise<number[]> {
  return generateLocalSemanticEmbedding(text);
}

// Computes 256-dimensional semantic feature vector with domain anchor projections and character subword hashing
export function generateLocalSemanticEmbedding(text: string): number[] {
  const vector = new Array<number>(VECTOR_DIMENSIONS).fill(0);
  const clean = text.toLowerCase().trim();
  const words = clean.split(/\W+/).filter((w) => w.length > 1);

  if (words.length === 0) {
    return vector;
  }

  // A. Semantic anchor matching across domain clusters
  const clusterSize = Math.floor(VECTOR_DIMENSIONS / SEMANTIC_ANCHORS.length);
  SEMANTIC_ANCHORS.forEach((cluster, clusterIdx) => {
    const baseDim = clusterIdx * clusterSize;
    let clusterScore = 0;

    cluster.forEach((term, termIdx) => {
      if (clean.includes(term)) {
        clusterScore += 1.5;
        const targetDim = (baseDim + termIdx) % VECTOR_DIMENSIONS;
        vector[targetDim] += 2.0;
      }
    });

    if (clusterScore > 0) {
      vector[baseDim] += clusterScore;
    }
  });

  // B. Subword & N-gram token hashing across full vector space
  words.forEach((word, wordIdx) => {
    const weight = 1.0 / Math.sqrt(wordIdx + 1);
    const wordHash = hashString(word) % VECTOR_DIMENSIONS;
    vector[wordHash] += 1.2 * weight;

    // 3-grams and 4-grams for morphological similarity
    if (word.length >= 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        const trigram = word.substring(i, i + 3);
        const triHash = hashString(trigram) % VECTOR_DIMENSIONS;
        vector[triHash] += 0.4 * weight;
      }
    }
  });

  return normalizeVector(vector);
}

// Normalizes vector to unit length (L2 norm)
export function normalizeVector(vector: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }

  const magnitude = Math.sqrt(sumSq);
  if (magnitude === 0) {
    return vector;
  }

  return vector.map((val) => Number((val / magnitude).toFixed(6)));
}

// Computes Cosine Similarity between two numeric vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  const length = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) {
    return 0;
  }

  return Math.max(-1.0, Math.min(1.0, dotProduct / denom));
}

// Ranks feedback candidate items by cosine similarity to a query vector
export function rankFeedbackByVectorSimilarity<T>(
  queryVector: number[],
  items: Array<{ item: T; vector: number[] }>
): Array<{ item: T; similarity: number }> {
  const scored = items.map(({ item, vector }) => ({
    item,
    similarity: cosineSimilarity(queryVector, vector),
  }));

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored;
}
