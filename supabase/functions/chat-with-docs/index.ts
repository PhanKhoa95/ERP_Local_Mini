import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Enhanced Chat with Documents
 * - Proper semantic search with context ranking
 * - Better prompt engineering for accurate answers
 * - Citation tracking and validation
 * - Support for both streaming and non-streaming
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { 
      question, 
      companyId, 
      sessionId, 
      userId,
      stream = false,
      maxChunks = 5,
      temperature = 0.3
    } = await req.json();

    if (!question || !companyId) {
      throw new Error("Question and companyId are required");
    }

    console.log("Chat with docs:", question.slice(0, 100));

    // Step 1: Generate query embedding
    const queryEmbedding = generateSemanticEmbedding(question);

    // Step 2: Perform semantic search
    const searchResults = await performSemanticSearch(
      supabase, 
      companyId, 
      queryEmbedding, 
      maxChunks
    );

    console.log(`Found ${searchResults.length} relevant chunks`);

    // Step 3: Build context with relevance scores
    const contextParts: string[] = [];
    const citations: Citation[] = [];

    for (let i = 0; i < searchResults.length; i++) {
      const result = searchResults[i];
      const relevanceLabel = result.similarity > 0.7 ? "Ráº¥t liÃªn quan" : 
                             result.similarity > 0.5 ? "LiÃªn quan" : "CÃ³ thá»ƒ liÃªn quan";
      
      contextParts.push(
        `[Nguá»“n ${i + 1}] ${result.document_name} (Trang ${result.page_number || 'N/A'}) - ${relevanceLabel}\n` +
        `---\n${result.content}\n---`
      );

      citations.push({
        source_index: i + 1,
        document_id: result.document_id,
        document_name: result.document_name,
        chunk_id: result.chunk_id,
        page_number: result.page_number,
        excerpt: result.content.slice(0, 200) + (result.content.length > 200 ? "..." : ""),
        similarity: Math.round(result.similarity * 100)
      });
    }

    const context = contextParts.join("\n\n") || "KhÃ´ng tÃ¬m tháº¥y tÃ i liá»‡u liÃªn quan.";

    // Step 4: Build system prompt with strict grounding
    const systemPrompt = buildSystemPrompt(context, citations.length > 0);

    // Step 5: Generate response
    if (stream) {
      return await handleStreamingResponse(
        systemPrompt,
        question,
        citations,
        corsHeaders
      );
    } else {
      return await handleNonStreamingResponse(
        supabase,
        systemPrompt,
        question,
        citations,
        sessionId,
        userId,
        temperature,
        corsHeaders
      );
    }
  } catch (error) {
    console.error("Error in chat-with-docs:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== TYPES ====================

interface Citation {
  source_index: number;
  document_id: string;
  document_name: string;
  chunk_id: string;
  page_number: number | null;
  excerpt: string;
  similarity: number;
}

interface SearchResult {
  chunk_id: string;
  content: string;
  page_number: number | null;
  document_id: string;
  document_name: string;
  similarity: number;
}

// ==================== SEMANTIC SEARCH ====================

async function performSemanticSearch(
  supabase: any,
  companyId: string,
  queryEmbedding: number[],
  limit: number
): Promise<SearchResult[]> {
  // Try RPC first
  const { data: rpcResults, error: rpcError } = await supabase.rpc("match_documents", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    match_company_id: companyId,
    match_threshold: 0.25,
    match_count: limit,
  });

  if (!rpcError && rpcResults && rpcResults.length > 0) {
    return rpcResults;
  }

  console.log("RPC failed or empty, falling back to manual search");

  // Manual search fallback
  const { data: documents } = await supabase
    .from("documents")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "completed");

  if (!documents || documents.length === 0) {
    return [];
  }

  const docIds = documents.map((d: any) => d.id);

  // Get chunks
  const { data: chunks } = await supabase
    .from("document_chunks")
    .select(`
      id,
      content,
      page_number,
      document_id,
      documents!inner(id, name)
    `)
    .in("document_id", docIds);

  if (!chunks || chunks.length === 0) {
    return [];
  }

  // Get embeddings
  const chunkIds = chunks.map((c: any) => c.id);
  const { data: embeddings } = await supabase
    .from("document_embeddings")
    .select("chunk_id, embedding_vector, embedding")
    .in("chunk_id", chunkIds);

  if (!embeddings) {
    return [];
  }

  // Build embedding map
  const embMap = new Map<string, number[]>();
  for (const emb of embeddings) {
    const vec = parseEmbedding(emb.embedding_vector || emb.embedding);
    if (vec) embMap.set(emb.chunk_id, vec);
  }

  // Calculate similarities
  const results: SearchResult[] = [];
  for (const chunk of chunks) {
    const chunkEmb = embMap.get(chunk.id);
    if (!chunkEmb) continue;

    const similarity = cosineSimilarity(queryEmbedding, chunkEmb);
    if (similarity >= 0.25) {
      results.push({
        chunk_id: chunk.id,
        content: chunk.content,
        page_number: chunk.page_number,
        document_id: chunk.document_id,
        document_name: chunk.documents?.name || "Unknown",
        similarity
      });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

function parseEmbedding(emb: any): number[] | null {
  if (!emb) return null;
  if (Array.isArray(emb)) return emb;
  if (typeof emb === 'string') {
    try {
      return emb.replace(/^\[|\]$/g, '').split(',').map(s => parseFloat(s.trim()));
    } catch { return null; }
  }
  return null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const mag = Math.sqrt(normA) * Math.sqrt(normB);
  return mag === 0 ? 0 : dot / mag;
}

// ==================== PROMPT ENGINEERING ====================

function buildSystemPrompt(context: string, hasContext: boolean): string {
  if (!hasContext) {
    return `Báº¡n lÃ  trá»£ lÃ½ AI tra cá»©u tÃ i liá»‡u ná»™i bá»™.

QUAN TRá»ŒNG: KhÃ´ng tÃ¬m tháº¥y tÃ i liá»‡u liÃªn quan Ä‘áº¿n cÃ¢u há»i.
HÃ£y tráº£ lá»i lá»‹ch sá»± ráº±ng báº¡n khÃ´ng tÃ¬m tháº¥y thÃ´ng tin vÃ  Ä‘á» xuáº¥t ngÆ°á»i dÃ¹ng:
1. Thá»­ Ä‘áº·t cÃ¢u há»i cá»¥ thá»ƒ hÆ¡n
2. Kiá»ƒm tra láº¡i tá»« khÃ³a
3. LiÃªn há»‡ bá»™ pháº­n quáº£n lÃ½ tÃ i liá»‡u náº¿u cáº§n`;
  }

  return `Báº¡n lÃ  trá»£ lÃ½ AI chuyÃªn tra cá»©u vÃ  phÃ¢n tÃ­ch tÃ i liá»‡u ná»™i bá»™. Báº¡n luÃ´n tráº£ lá»i chÃ­nh xÃ¡c, Ä‘áº§y Ä‘á»§ vÃ  trung thá»±c.

## QUY Táº®C Báº®T BUá»˜C

1. **CHá»ˆ** sá»­ dá»¥ng thÃ´ng tin tá»« cÃ¡c nguá»“n tÃ i liá»‡u Ä‘Æ°á»£c cung cáº¥p bÃªn dÆ°á»›i
2. **PHáº¢I** trÃ­ch dáº«n nguá»“n báº±ng cÃ¡ch sá»­ dá»¥ng [Nguá»“n X] vá»›i X lÃ  sá»‘ nguá»“n
3. **KHÃ”NG ÄÆ¯á»¢C** bá»‹a Ä‘áº·t hoáº·c suy luáº­n thÃ´ng tin khÃ´ng cÃ³ trong tÃ i liá»‡u
4. Náº¿u thÃ´ng tin khÃ´ng Ä‘á»§ hoáº·c khÃ´ng rÃµ rÃ ng, hÃ£y nÃ³i rÃµ Ä‘iá»u Ä‘Ã³
5. Tráº£ lá»i báº±ng tiáº¿ng Viá»‡t, rÃµ rÃ ng vÃ  cÃ³ cáº¥u trÃºc

## Cáº¤U TRÃšC TRáº¢ Lá»œI

1. **Tráº£ lá»i trá»±c tiáº¿p** cÃ¢u há»i náº¿u cÃ³ thÃ´ng tin
2. **TrÃ­ch dáº«n nguá»“n** cho má»—i thÃ´ng tin quan trá»ng
3. **Tá»•ng há»£p** náº¿u cÃ³ nhiá»u nguá»“n liÃªn quan
4. **LÆ°u Ã½** nhá»¯ng háº¡n cháº¿ hoáº·c thÃ´ng tin thiáº¿u náº¿u cÃ³

## TÃ€I LIá»†U THAM KHáº¢O

${context}

## LÆ¯U Ã QUAN TRá»ŒNG
- Nguá»“n cÃ³ Ä‘á»™ "Ráº¥t liÃªn quan" hoáº·c "LiÃªn quan" Ä‘Ã¡ng tin cáº­y hÆ¡n
- Náº¿u cÃ¡c nguá»“n mÃ¢u thuáº«n nhau, hÃ£y trÃ¬nh bÃ y cáº£ hai quan Ä‘iá»ƒm
- LuÃ´n Æ°u tiÃªn Ä‘á»™ chÃ­nh xÃ¡c hÆ¡n Ä‘á»™ dÃ i cá»§a cÃ¢u tráº£ lá»i`;
}

// ==================== RESPONSE HANDLERS ====================

async function handleStreamingResponse(
  systemPrompt: string,
  question: string,
  citations: Citation[],
  corsHeaders: Record<string, string>
): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    
    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "ÄÃ£ vÆ°á»£t quÃ¡ giá»›i háº¡n yÃªu cáº§u, vui lÃ²ng thá»­ láº¡i sau." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "Cáº§n náº¡p thÃªm credits, vui lÃ²ng liÃªn há»‡ admin." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    throw new Error("AI gateway error");
  }

  // Prepend citations to stream
  const encoder = new TextEncoder();
  const citationsEvent = `data: ${JSON.stringify({ type: "citations", citations })}\n\n`;
  
  const transformStream = new TransformStream({
    start(controller) {
      controller.enqueue(encoder.encode(citationsEvent));
    },
    transform(chunk, controller) {
      controller.enqueue(chunk);
    }
  });

  return new Response(response.body!.pipeThrough(transformStream), {
    headers: { 
      ...corsHeaders, 
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

async function handleNonStreamingResponse(
  supabase: any,
  systemPrompt: string,
  question: string,
  citations: Citation[],
  sessionId: string | undefined,
  userId: string | undefined,
  temperature: number,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "ÄÃ£ vÆ°á»£t quÃ¡ giá»›i háº¡n yÃªu cáº§u, vui lÃ²ng thá»­ láº¡i sau." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "Cáº§n náº¡p thÃªm credits, vui lÃ²ng liÃªn há»‡ admin." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    throw new Error("AI gateway error");
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content || "KhÃ´ng thá»ƒ táº¡o cÃ¢u tráº£ lá»i.";

  // Save to chat history
  if (sessionId && userId) {
    await supabase.from("chat_messages").insert([
      { session_id: sessionId, role: "user", content: question },
      { session_id: sessionId, role: "assistant", content: answer, citations },
    ]);

    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);
  }

  return new Response(
    JSON.stringify({ 
      answer, 
      citations,
      sources_count: citations.length,
      has_relevant_sources: citations.some(c => c.similarity > 50)
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ==================== EMBEDDING GENERATION ====================

const VIETNAMESE_STOP_WORDS = new Set([
  "vÃ ", "cá»§a", "lÃ ", "cÃ³", "Ä‘Æ°á»£c", "trong", "Ä‘áº¿n", "nÃ y", "vá»›i", "cho", 
  "má»™t", "nhá»¯ng", "cÃ¡c", "Ä‘á»ƒ", "khi", "tá»«", "theo", "vá»", "nhÆ°", "thÃ¬",
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "and", "or", "but", "if", "then", "else", "when", "at", "from", "by", "for"
]);

const SEMANTIC_CLUSTERS: Record<string, string[]> = {
  "tai_chinh": ["tiá»n", "ngÃ¢n", "chi", "thu", "phÃ­", "giÃ¡", "thanh toÃ¡n", "hÃ³a Ä‘Æ¡n", "cÃ´ng ná»£", "doanh thu", "finance", "money", "payment"],
  "nhan_su": ["nhÃ¢n", "viÃªn", "tuyá»ƒn", "lÆ°Æ¡ng", "báº£o hiá»ƒm", "nghá»‰ phÃ©p", "nhÃ¢n sá»±", "employee", "staff", "salary"],
  "san_pham": ["sáº£n pháº©m", "hÃ ng hÃ³a", "kho", "tá»“n kho", "nháº­p", "xuáº¥t", "product", "inventory", "stock"],
  "khach_hang": ["khÃ¡ch", "hÃ ng", "Ä‘á»‘i tÃ¡c", "nhÃ  cung cáº¥p", "Ä‘Æ¡n hÃ ng", "customer", "partner", "order"],
  "quy_trinh": ["quy trÃ¬nh", "hÆ°á»›ng dáº«n", "chÃ­nh sÃ¡ch", "quy Ä‘á»‹nh", "process", "procedure", "policy"]
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



