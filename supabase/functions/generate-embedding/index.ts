import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Enhanced Embedding Generation using TF-IDF inspired approach
 * with semantic word hashing and n-gram features for Vietnamese/English text
 */

// Common Vietnamese stop words to ignore
const VIETNAMESE_STOP_WORDS = new Set([
  "và", "của", "là", "có", "được", "trong", "đến", "này", "với", "cho", 
  "một", "những", "các", "để", "khi", "từ", "theo", "về", "như", "thì",
  "đã", "sẽ", "không", "còn", "nếu", "nhưng", "vì", "nên", "mà", "cũng",
  "bị", "tại", "trên", "dưới", "sau", "trước", "qua", "rồi", "lại", "ra",
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "must", "shall", "can", "need", "dare", "ought", "used", "to",
  "and", "or", "but", "if", "then", "else", "when", "at", "from", "by", "for",
  "with", "about", "against", "between", "into", "through", "during", "before",
  "after", "above", "below", "up", "down", "in", "out", "on", "off", "over", "under"
]);

// Semantic word clusters for Vietnamese business context
const SEMANTIC_CLUSTERS: Record<string, string[]> = {
  "tai_chinh": ["tiền", "ngân", "chi", "thu", "phí", "giá", "thanh toán", "hóa đơn", "công nợ", "doanh thu", "lợi nhuận", "vốn", "đầu tư", "tài sản", "nợ", "chi phí", "ngân sách", "budget", "finance", "money", "payment", "invoice", "revenue", "profit"],
  "nhan_su": ["nhân", "viên", "tuyển", "lương", "bảo hiểm", "nghỉ phép", "hợp đồng lao động", "nhân sự", "đào tạo", "employee", "staff", "salary", "hr", "training", "leave"],
  "san_pham": ["sản phẩm", "hàng hóa", "mặt hàng", "kho", "tồn kho", "nhập", "xuất", "product", "inventory", "stock", "goods", "warehouse"],
  "khach_hang": ["khách", "hàng", "đối tác", "nhà cung cấp", "đơn hàng", "giao hàng", "vận chuyển", "customer", "partner", "supplier", "order", "delivery", "shipping"],
  "quy_trinh": ["quy trình", "hướng dẫn", "chính sách", "quy định", "nội quy", "thủ tục", "process", "procedure", "policy", "guideline", "regulation"],
  "bao_cao": ["báo cáo", "thống kê", "phân tích", "đánh giá", "kết quả", "report", "statistics", "analysis", "evaluation", "result"]
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, texts, useCache = true } = await req.json();
    
    // Initialize Supabase for caching
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = supabaseUrl && supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    // Handle single text or batch of texts
    const inputTexts: string[] = texts || [text];
    const embeddings: number[][] = [];

    for (const inputText of inputTexts) {
      if (!inputText || typeof inputText !== 'string') {
        embeddings.push(new Array(768).fill(0));
        continue;
      }

      // Check cache first
      if (useCache && supabase) {
        const cachedEmbedding = await getCachedEmbedding(supabase, inputText);
        if (cachedEmbedding) {
          console.log("Cache hit for embedding");
          embeddings.push(cachedEmbedding);
          continue;
        }
      }

      // Generate semantic embedding
      const embedding = generateSemanticEmbedding(inputText);
      embeddings.push(embedding);

      // Save to cache
      if (useCache && supabase) {
        await saveCachedEmbedding(supabase, inputText, embedding);
      }
    }

    return new Response(
      JSON.stringify({ 
        embedding: texts ? undefined : embeddings[0],
        embeddings: texts ? embeddings : undefined 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating embedding:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Generate a semantic 768-dimensional embedding using:
 * 1. Character n-gram hashing (for morphological similarity)
 * 2. Word frequency hashing (TF component)
 * 3. Semantic cluster activation (for domain relevance)
 * 4. Positional encoding (for structure awareness)
 */
function generateSemanticEmbedding(text: string): number[] {
  const embedding = new Array(768).fill(0);
  const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Tokenize
  const words = normalizedText
    .split(/[\s\p{P}]+/u)
    .filter(w => w.length > 1 && !VIETNAMESE_STOP_WORDS.has(w));
  
  if (words.length === 0) {
    return normalizeVector(embedding);
  }

  // Word frequency map for TF
  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  // Section 1: Character 3-gram hashing (dimensions 0-255)
  // Captures morphological similarity and typo tolerance
  for (const word of words) {
    const weight = Math.log(1 + (wordFreq.get(word) || 1)) / Math.log(words.length + 2);
    for (let i = 0; i <= word.length - 3; i++) {
      const ngram = word.slice(i, i + 3);
      const hash = hashString(ngram) % 256;
      embedding[hash] += weight;
    }
  }

  // Section 2: Word-level hashing with IDF approximation (dimensions 256-511)
  // Longer/unique words get higher weight
  for (const [word, freq] of wordFreq.entries()) {
    const tf = freq / words.length;
    const idf = Math.log(10 / (1 + (word.length < 4 ? 5 : word.length < 6 ? 3 : 1)));
    const tfidf = tf * idf;
    
    const hash = hashString(word) % 256;
    embedding[256 + hash] += tfidf * (1 + word.length / 10);
  }

  // Section 3: Semantic cluster activation (dimensions 512-639)
  // Activates dimensions based on domain relevance
  let clusterIdx = 0;
  for (const [cluster, keywords] of Object.entries(SEMANTIC_CLUSTERS)) {
    let activation = 0;
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        activation += 1;
      }
    }
    if (activation > 0) {
      const baseIdx = 512 + (clusterIdx * 20);
      for (let i = 0; i < 20 && baseIdx + i < 640; i++) {
        embedding[baseIdx + i] = activation * Math.sin(i * 0.5) * 0.5;
      }
    }
    clusterIdx++;
  }

  // Section 4: Bigram features (dimensions 640-767)
  // Captures word order and common phrases
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + "_" + words[i + 1];
    const hash = hashString(bigram) % 128;
    const posWeight = 1 - (i / words.length) * 0.3; // Earlier bigrams slightly more important
    embedding[640 + hash] += posWeight * 0.5;
  }

  // Add document length normalization signal
  const docLengthSignal = Math.tanh(words.length / 100);
  embedding[767] = docLengthSignal;

  return normalizeVector(embedding);
}

/**
 * Simple string hashing function (djb2)
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * L2 normalize a vector
 */
function normalizeVector(vec: number[]): number[] {
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vec;
  return vec.map(val => val / magnitude);
}

/**
 * Get cached embedding from database
 */
async function getCachedEmbedding(supabase: any, text: string): Promise<number[] | null> {
  try {
    const textHash = await computeHash(text);
    const { data, error } = await supabase
      .from("embedding_cache")
      .select("embedding")
      .eq("text_hash", textHash)
      .single();
    
    if (error || !data) return null;
    
    // Update usage stats
    await supabase
      .from("embedding_cache")
      .update({ 
        last_used_at: new Date().toISOString(),
        use_count: (data.use_count || 0) + 1
      })
      .eq("text_hash", textHash);
    
    // Parse stored embedding
    if (typeof data.embedding === 'string') {
      const parsed = JSON.parse(data.embedding.replace(/^\[|\]$/g, '').split(',').map(Number));
      return parsed;
    }
    return data.embedding;
  } catch (e) {
    console.error("Cache read error:", e);
    return null;
  }
}

/**
 * Save embedding to cache
 */
async function saveCachedEmbedding(supabase: any, text: string, embedding: number[]): Promise<void> {
  try {
    const textHash = await computeHash(text);
    await supabase
      .from("embedding_cache")
      .upsert({
        text_hash: textHash,
        embedding: `[${embedding.join(",")}]`,
        use_count: 1,
        last_used_at: new Date().toISOString()
      }, { onConflict: 'text_hash' });
  } catch (e) {
    console.error("Cache write error:", e);
  }
}

/**
 * Compute SHA-256 hash of text
 */
async function computeHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.slice(0, 2000)); // Limit for consistent hashing
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
