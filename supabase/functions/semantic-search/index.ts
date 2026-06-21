import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Enhanced Semantic Search with proper vector similarity
 * Uses the match_documents RPC function for efficient pgvector search
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { query, companyId, limit = 5, userId, threshold = 0.3 } = await req.json();
    
    if (!query || !companyId) {
      throw new Error("Query and companyId are required");
    }

    console.log("Semantic search:", query, "Company:", companyId);

    // Generate embedding for the query
    const queryEmbedding = generateSemanticEmbedding(query);

    // Save search query for trending analysis
    if (userId) {
      await supabase.from("search_queries").insert({
        company_id: companyId,
        user_id: userId,
        query: query,
        query_embedding: `[${queryEmbedding.join(",")}]`,
      });

      // Update trending questions
      await updateTrendingQuestions(supabase, companyId, query);
    }

    // Try vector search first using RPC
    let results: any[] = [];
    
    const { data: vectorResults, error: rpcError } = await supabase.rpc("match_documents", {
      query_embedding: `[${queryEmbedding.join(",")}]`,
      match_company_id: companyId,
      match_threshold: threshold,
      match_count: limit,
    });

    if (rpcError) {
      console.log("Vector search RPC error, trying manual cosine similarity:", rpcError.message);
      
      // Fallback: Manual cosine similarity search
      results = await manualVectorSearch(supabase, companyId, queryEmbedding, limit, threshold);
    } else {
      results = vectorResults || [];
    }

    // If no vector results, fall back to text search
    if (results.length === 0) {
      console.log("No vector results, falling back to text search");
      results = await textSearch(supabase, companyId, query, limit);
    }

    // Update search query result count
    if (userId && results.length > 0) {
      await supabase
        .from("search_queries")
        .update({ result_count: results.length })
        .eq("query", query)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);
    }

    console.log(`Found ${results.length} results`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in semantic search:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Manual vector search using cosine similarity calculation
 */
async function manualVectorSearch(
  supabase: any, 
  companyId: string, 
  queryEmbedding: number[], 
  limit: number,
  threshold: number
): Promise<any[]> {
  // Get all document embeddings for the company
  const { data: documents, error: docError } = await supabase
    .from("documents")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "completed");

  if (docError || !documents || documents.length === 0) {
    return [];
  }

  const documentIds = documents.map((d: any) => d.id);

  // Get chunks with embeddings
  const { data: chunks, error: chunkError } = await supabase
    .from("document_chunks")
    .select(`
      id,
      content,
      page_number,
      document_id,
      documents!inner(id, name, company_id)
    `)
    .in("document_id", documentIds);

  if (chunkError || !chunks) {
    return [];
  }

  // Get embeddings for these chunks
  const chunkIds = chunks.map((c: any) => c.id);
  const { data: embeddings, error: embError } = await supabase
    .from("document_embeddings")
    .select("chunk_id, embedding_vector, embedding")
    .in("chunk_id", chunkIds);

  if (embError || !embeddings) {
    return [];
  }

  // Create lookup map
  const embeddingMap = new Map<string, number[]>();
  for (const emb of embeddings) {
    const embVector = parseEmbedding(emb.embedding_vector || emb.embedding);
    if (embVector) {
      embeddingMap.set(emb.chunk_id, embVector);
    }
  }

  // Calculate similarities
  const results: any[] = [];
  for (const chunk of chunks) {
    const chunkEmbedding = embeddingMap.get(chunk.id);
    if (!chunkEmbedding) continue;

    const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
    
    if (similarity >= threshold) {
      results.push({
        chunk_id: chunk.id,
        content: chunk.content,
        page_number: chunk.page_number,
        document_id: chunk.document_id,
        document_name: chunk.documents?.name,
        similarity: similarity
      });
    }
  }

  // Sort by similarity and limit
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Parse embedding from string or array
 */
function parseEmbedding(embedding: any): number[] | null {
  if (!embedding) return null;
  
  if (Array.isArray(embedding)) {
    return embedding;
  }
  
  if (typeof embedding === 'string') {
    try {
      // Handle "[1,2,3]" format
      const cleaned = embedding.replace(/^\[|\]$/g, '');
      return cleaned.split(',').map(s => parseFloat(s.trim()));
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;
  
  return dotProduct / magnitude;
}

/**
 * Text-based search fallback
 */
async function textSearch(
  supabase: any,
  companyId: string,
  query: string,
  limit: number
): Promise<any[]> {
  // Split query into keywords
  const keywords = query.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (keywords.length === 0) {
    return [];
  }

  // Build search pattern
  const searchPattern = keywords.join("%");

  const { data: chunks, error } = await supabase
    .from("document_chunks")
    .select(`
      id,
      content,
      page_number,
      document:documents!inner(id, name, company_id)
    `)
    .eq("document.company_id", companyId)
    .or(keywords.map(k => `content.ilike.%${k}%`).join(","))
    .limit(limit * 2);

  if (error || !chunks) {
    return [];
  }

  // Score results by keyword match count
  const results = chunks.map((chunk: any) => {
    const contentLower = chunk.content.toLowerCase();
    const matchCount = keywords.filter(k => contentLower.includes(k)).length;
    return {
      chunk_id: chunk.id,
      content: chunk.content,
      page_number: chunk.page_number,
      document_id: chunk.document?.id,
      document_name: chunk.document?.name,
      similarity: matchCount / keywords.length * 0.5, // Max 0.5 for text search
    };
  });

  return results
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Update trending questions
 */
async function updateTrendingQuestions(supabase: any, companyId: string, query: string) {
  try {
    // Normalize query for comparison
    const normalizedQuery = query.toLowerCase().trim().slice(0, 200);
    
    // Check if similar question exists
    const { data: existing } = await supabase
      .from("trending_questions")
      .select("id, count, question")
      .eq("company_id", companyId)
      .limit(100);

    // Find similar question using simple similarity
    let matchedQuestion = null;
    if (existing) {
      for (const q of existing) {
        const similarity = calculateTextSimilarity(normalizedQuery, q.question.toLowerCase());
        if (similarity > 0.7) {
          matchedQuestion = q;
          break;
        }
      }
    }

    if (matchedQuestion) {
      await supabase
        .from("trending_questions")
        .update({ 
          count: matchedQuestion.count + 1,
          last_asked_at: new Date().toISOString(),
          growth_rate: calculateGrowthRate(matchedQuestion.count, matchedQuestion.count + 1)
        })
        .eq("id", matchedQuestion.id);
    } else {
      await supabase.from("trending_questions").insert({
        company_id: companyId,
        question: query.slice(0, 500),
        count: 1,
        growth_rate: 1
      });
    }
  } catch (error) {
    console.error("Error updating trending questions:", error);
  }
}

/**
 * Simple text similarity using Jaccard index
 */
function calculateTextSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  
  return intersection.size / union.size;
}

/**
 * Calculate growth rate
 */
function calculateGrowthRate(oldCount: number, newCount: number): number {
  if (oldCount === 0) return 1;
  return (newCount - oldCount) / oldCount;
}

// ==================== EMBEDDING GENERATION ====================

const VIETNAMESE_STOP_WORDS = new Set([
  "và", "của", "là", "có", "được", "trong", "đến", "này", "với", "cho", 
  "một", "những", "các", "để", "khi", "từ", "theo", "về", "như", "thì",
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "and", "or", "but", "if", "then", "else", "when", "at", "from", "by", "for"
]);

const SEMANTIC_CLUSTERS: Record<string, string[]> = {
  "tai_chinh": ["tiền", "ngân", "chi", "thu", "phí", "giá", "thanh toán", "hóa đơn", "công nợ", "doanh thu", "finance", "money", "payment"],
  "nhan_su": ["nhân", "viên", "tuyển", "lương", "bảo hiểm", "nghỉ phép", "nhân sự", "employee", "staff", "salary"],
  "san_pham": ["sản phẩm", "hàng hóa", "kho", "tồn kho", "nhập", "xuất", "product", "inventory", "stock"],
  "khach_hang": ["khách", "hàng", "đối tác", "nhà cung cấp", "đơn hàng", "customer", "partner", "order"],
  "quy_trinh": ["quy trình", "hướng dẫn", "chính sách", "quy định", "process", "procedure", "policy"]
};

function generateSemanticEmbedding(text: string): number[] {
  const embedding = new Array(768).fill(0);
  const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const words = normalizedText
    .split(/[\s\p{P}]+/u)
    .filter(w => w.length > 1 && !VIETNAMESE_STOP_WORDS.has(w));
  
  if (words.length === 0) return normalizeVector(embedding);

  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  // Character n-grams (0-255)
  for (const word of words) {
    const weight = Math.log(1 + (wordFreq.get(word) || 1)) / Math.log(words.length + 2);
    for (let i = 0; i <= word.length - 3; i++) {
      const ngram = word.slice(i, i + 3);
      const hash = hashString(ngram) % 256;
      embedding[hash] += weight;
    }
  }

  // Word-level (256-511)
  for (const [word, freq] of wordFreq.entries()) {
    const tf = freq / words.length;
    const idf = Math.log(10 / (1 + (word.length < 4 ? 5 : word.length < 6 ? 3 : 1)));
    const hash = hashString(word) % 256;
    embedding[256 + hash] += tf * idf * (1 + word.length / 10);
  }

  // Semantic clusters (512-639)
  let clusterIdx = 0;
  for (const [, keywords] of Object.entries(SEMANTIC_CLUSTERS)) {
    let activation = 0;
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) activation += 1;
    }
    if (activation > 0) {
      const baseIdx = 512 + (clusterIdx * 25);
      for (let i = 0; i < 25 && baseIdx + i < 640; i++) {
        embedding[baseIdx + i] = activation * Math.sin(i * 0.5) * 0.5;
      }
    }
    clusterIdx++;
  }

  // Bigrams (640-767)
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + "_" + words[i + 1];
    const hash = hashString(bigram) % 128;
    embedding[640 + hash] += (1 - i / words.length * 0.3) * 0.5;
  }

  embedding[767] = Math.tanh(words.length / 100);

  return normalizeVector(embedding);
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function normalizeVector(vec: number[]): number[] {
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vec;
  return vec.map(val => val / magnitude);
}
