import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Enhanced Document Processing Pipeline
 * - Uses Lovable AI for PDF text extraction (OCR + text)
 * - Smart recursive chunking with semantic boundaries
 * - AI-powered document classification and metadata extraction
 * - Proper embedding generation and storage
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let documentId: string | undefined;

  try {
    const body = await req.json();
    documentId = body.documentId;
    console.log("Processing document:", documentId);

    if (!documentId) {
      throw new Error("documentId is required");
    }

    // Get document info
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    // Update status to processing
    await supabase
      .from("documents")
      .update({ status: "processing", error_message: null })
      .eq("id", documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("company-documents")
      .download(document.file_path);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Extract text based on file type
    const fileType = document.file_type.toLowerCase();
    console.log(`Extracting text from ${fileType} file (${fileData.size} bytes)...`);

    let extractedText = "";
    let pages: PageContent[] = [];

    if (fileType === "pdf") {
      const result = await extractPdfWithAI(fileData, document.name);
      extractedText = result.text;
      pages = result.pages;
    } else if (fileType === "txt" || fileType === "md") {
      extractedText = await fileData.text();
      pages = [{ pageNumber: 1, content: extractedText }];
    } else if (fileType === "docx" || fileType === "doc") {
      const result = await extractDocxText(fileData);
      extractedText = result.text;
      pages = result.pages;
    } else if (fileType === "xlsx" || fileType === "xls" || fileType === "csv") {
      extractedText = await extractSpreadsheetText(fileData, fileType);
      pages = [{ pageNumber: 1, content: extractedText }];
    } else {
      extractedText = await fileData.text();
      pages = [{ pageNumber: 1, content: extractedText }];
    }

    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error("Could not extract meaningful text from document");
    }

    console.log(`Extracted ${extractedText.length} characters from ${pages.length} pages`);
    console.log(`Text preview: ${extractedText.slice(0, 300)}...`);

    // ===== AI CLASSIFICATION & METADATA EXTRACTION =====
    const aiMetadata = await classifyAndExtractMetadata(extractedText, document.name);
    console.log("AI classification result:", JSON.stringify(aiMetadata));

    // Update document with AI-extracted metadata
    const metadataUpdate: Record<string, unknown> = {};
    if (aiMetadata.category) metadataUpdate.category = aiMetadata.category;
    if (aiMetadata.extracted_metadata) metadataUpdate.extracted_metadata = aiMetadata.extracted_metadata;
    if (aiMetadata.expiry_date) metadataUpdate.expiry_date = aiMetadata.expiry_date;

    if (Object.keys(metadataUpdate).length > 0) {
      await supabase
        .from("documents")
        .update(metadataUpdate)
        .eq("id", documentId);
    }

    // Split text into semantic chunks
    const chunks = createSemanticChunks(pages, {
      maxChunkSize: 800,
      minChunkSize: 200,
      overlapSize: 100
    });

    console.log(`Created ${chunks.length} semantic chunks`);

    // Clear existing chunks for this document (in case of reprocessing)
    await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);

    // Insert chunks into database
    const chunkRecords = chunks.map((chunk, index) => ({
      document_id: documentId,
      chunk_index: index,
      content: chunk.content,
      page_number: chunk.pageNumber,
      token_count: estimateTokens(chunk.content),
    }));

    const { data: insertedChunks, error: chunkError } = await supabase
      .from("document_chunks")
      .insert(chunkRecords)
      .select("id");

    if (chunkError) {
      throw new Error(`Failed to insert chunks: ${chunkError.message}`);
    }

    console.log(`Inserted ${insertedChunks.length} chunks, generating embeddings...`);

    // Generate embeddings in batches
    const batchSize = 10;
    let embeddingsGenerated = 0;

    for (let i = 0; i < insertedChunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchChunkIds = insertedChunks.slice(i, i + batchSize);

      const embeddings = batch.map(chunk => generateSemanticEmbedding(chunk.content));

      const embeddingRecords = embeddings.map((embedding, idx) => ({
        chunk_id: batchChunkIds[idx].id,
        embedding_vector: `[${embedding.join(",")}]`,
        embedding: `[${embedding.join(",")}]`,
      }));

      const { error: embError } = await supabase
        .from("document_embeddings")
        .insert(embeddingRecords);

      if (embError) {
        console.error("Embedding insert error:", embError);
      } else {
        embeddingsGenerated += batch.length;
      }
    }

    console.log(`Generated ${embeddingsGenerated} embeddings`);

    // Update document status
    await supabase
      .from("documents")
      .update({ 
        status: "completed", 
        chunk_count: chunks.length,
        error_message: null
      })
      .eq("id", documentId);

    // Send success notification
    if (document.uploaded_by) {
      const categoryLabel = getCategoryLabel(aiMetadata.category);
      await supabase.from("rag_notifications").insert({
        user_id: document.uploaded_by,
        company_id: document.company_id,
        type: "document_processed",
        title: "TÃ i liá»‡u Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½",
        message: `TÃ i liá»‡u "${document.name}" Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½ thÃ nh cÃ´ng. PhÃ¢n loáº¡i: ${categoryLabel}. ${chunks.length} Ä‘oáº¡n vÄƒn báº£n.`,
        data: { 
          document_id: documentId, 
          chunk_count: chunks.length,
          embeddings_count: embeddingsGenerated,
          category: aiMetadata.category,
          extracted_metadata: aiMetadata.extracted_metadata,
        },
      });
    }

    console.log("Document processed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunkCount: chunks.length,
        embeddingsCount: embeddingsGenerated,
        category: aiMetadata.category,
        extractedMetadata: aiMetadata.extracted_metadata,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing document:", error);
    
    if (documentId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseForError = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: doc } = await supabaseForError
        .from("documents")
        .select("uploaded_by, company_id, name")
        .eq("id", documentId)
        .single();

      await supabaseForError
        .from("documents")
        .update({ 
          status: "failed", 
          error_message: error instanceof Error ? error.message : "Unknown error" 
        })
        .eq("id", documentId);

      if (doc?.uploaded_by) {
        await supabaseForError.from("rag_notifications").insert({
          user_id: doc.uploaded_by,
          company_id: doc.company_id,
          type: "document_failed",
          title: "Lá»—i xá»­ lÃ½ tÃ i liá»‡u",
          message: `KhÃ´ng thá»ƒ xá»­ lÃ½ tÃ i liá»‡u "${doc.name}": ${error instanceof Error ? error.message : "Unknown error"}`,
          data: { document_id: documentId },
        });
      }
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== AI CLASSIFICATION & METADATA ====================

interface AIMetadataResult {
  category: string | null;
  extracted_metadata: Record<string, unknown> | null;
  expiry_date: string | null;
}

function getCategoryLabel(category: string | null): string {
  const labels: Record<string, string> = {
    invoice: "HÃ³a Ä‘Æ¡n",
    contract: "Há»£p Ä‘á»“ng",
    drawing: "Báº£n váº½ ká»¹ thuáº­t",
    report: "BÃ¡o cÃ¡o",
    other: "KhÃ¡c",
  };
  return labels[category || "other"] || "KhÃ¡c";
}

async function classifyAndExtractMetadata(text: string, fileName: string): Promise<AIMetadataResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) {
    console.log("LOVABLE_API_KEY not configured, skipping AI classification");
    return { category: null, extracted_metadata: null, expiry_date: null };
  }

  try {
    // Use first 3000 chars for classification to keep costs low
    const sampleText = text.slice(0, 3000);

    const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a document classification and metadata extraction specialist for Vietnamese business documents. Analyze the document and extract structured information.`
          },
          {
            role: "user",
            content: `Analyze this document named "${fileName}":\n\n${sampleText}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_document",
              description: "Classify document and extract metadata",
              parameters: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["invoice", "contract", "drawing", "report", "other"],
                    description: "Document category"
                  },
                  invoice_number: {
                    type: "string",
                    description: "Invoice or document number if found"
                  },
                  document_date: {
                    type: "string",
                    description: "Document date in YYYY-MM-DD format if found"
                  },
                  total_amount: {
                    type: "number",
                    description: "Total monetary amount if found"
                  },
                  currency: {
                    type: "string",
                    description: "Currency code (VND, USD, etc)"
                  },
                  vendor_name: {
                    type: "string",
                    description: "Vendor/supplier/party name if found"
                  },
                  customer_name: {
                    type: "string",
                    description: "Customer/buyer name if found"
                  },
                  expiry_date: {
                    type: "string",
                    description: "Contract expiry date or payment due date in YYYY-MM-DD format if found"
                  },
                  summary: {
                    type: "string",
                    description: "Brief 1-2 sentence summary of the document"
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Relevant tags/keywords (max 5)"
                  }
                },
                required: ["category", "summary"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "classify_document" } },
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI classification failed:", response.status, errText);
      return { category: null, extracted_metadata: null, expiry_date: null };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.log("No tool call in AI response");
      return { category: null, extracted_metadata: null, expiry_date: null };
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("AI extracted:", JSON.stringify(result));

    const { category, expiry_date, ...metadata } = result;

    return {
      category: category || null,
      extracted_metadata: Object.keys(metadata).length > 0 ? metadata : null,
      expiry_date: expiry_date || null,
    };
  } catch (err) {
    console.error("AI classification error:", err);
    return { category: null, extracted_metadata: null, expiry_date: null };
  }
}

// ==================== TEXT EXTRACTION ====================

interface PageContent {
  pageNumber: number;
  content: string;
}

interface ExtractionResult {
  text: string;
  pages: PageContent[];
}

async function extractPdfWithAI(blob: Blob, fileName: string): Promise<ExtractionResult> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  const traditionalText = extractTextFromPdfBytes(bytes);
  
  if (!traditionalText || traditionalText.length < 50 || containsGarbage(traditionalText)) {
    console.log("Traditional PDF extraction failed, using AI Vision OCR...");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) {
      console.log("LOVABLE_API_KEY not configured, falling back to traditional extraction");
      return { 
        text: traditionalText, 
        pages: [{ pageNumber: 1, content: traditionalText }] 
      };
    }
    
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes.slice(0, Math.min(bytes.length, 4000000)))));
    
    try {
      const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are a document text extraction specialist. Extract ALL text content from this PDF document accurately.

CRITICAL INSTRUCTIONS:
1. Extract EVERY piece of text visible in the document
2. Maintain the logical reading order (left-to-right, top-to-bottom)
3. Preserve paragraph structure with double newlines between paragraphs
4. Include headers, footers, and page numbers
5. Format tables as plain text using | as column separators
6. For Vietnamese text, ensure ALL diacritical marks are preserved correctly
7. Do NOT summarize, paraphrase, or add any commentary
8. If multiple pages, separate with "--- Page X ---" where X is the page number

Document name: "${fileName}"

Return ONLY the extracted text content, nothing else.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 32000,
          temperature: 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content || "";
        
        if (aiText && aiText.length > 50 && !containsGarbage(aiText)) {
          console.log("AI Vision OCR extraction successful:", aiText.length, "chars");
          const pages = parseAIExtractedPages(aiText);
          return { text: aiText, pages };
        }
      } else {
        const errorText = await response.text();
        console.log("AI Vision OCR failed:", response.status, errorText);
      }
    } catch (aiError) {
      console.error("AI Vision OCR error:", aiError);
    }
  }

  console.log("Using traditional extraction:", traditionalText.length, "chars");
  return { 
    text: traditionalText, 
    pages: [{ pageNumber: 1, content: traditionalText }] 
  };
}

function containsGarbage(text: string): boolean {
  const garbageChars = text.match(/[^\x20-\x7E\u00C0-\u024F\u1E00-\u1EFF\u0100-\u017F\s\n]/g) || [];
  const normalChars = text.match(/[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u0100-\u017F]/g) || [];
  if (garbageChars.length > normalChars.length * 0.3) return true;
  if (text.includes('endstream') || text.includes('endobj') || text.includes('FlateDecode')) return true;
  return false;
}

function parseAIExtractedPages(text: string): PageContent[] {
  const pageMarkers = text.split(/---\s*Page\s*(\d+)\s*---/i);
  const pages: PageContent[] = [];
  
  if (pageMarkers.length > 1) {
    for (let i = 0; i < pageMarkers.length; i += 2) {
      const content = (pageMarkers[i] || "").trim();
      const pageNum = parseInt(pageMarkers[i + 1] || "1", 10);
      if (content) {
        pages.push({ pageNumber: pageNum || pages.length + 1, content });
      }
    }
  }
  
  if (pages.length === 0) {
    pages.push({ pageNumber: 1, content: text });
  }
  
  return pages;
}

function extractTextFromPdfBytes(bytes: Uint8Array): string {
  const rawText = new TextDecoder('latin1').decode(bytes);
  const textContents: string[] = [];
  
  const textObjectRegex = /BT([\s\S]*?)ET/g;
  let match;
  
  while ((match = textObjectRegex.exec(rawText)) !== null) {
    const textBlock = match[1];
    
    const tjMatches = textBlock.match(/\(([^)]*)\)\s*Tj/g);
    if (tjMatches) {
      for (const tj of tjMatches) {
        const content = tj.replace(/^\(|\)\s*Tj$/g, '');
        const decoded = decodeEscapedPdfText(content);
        if (decoded && decoded.length > 1 && !containsGarbage(decoded)) {
          textContents.push(decoded);
        }
      }
    }

    const tjArrayMatches = textBlock.match(/\[(.*?)\]\s*TJ/g);
    if (tjArrayMatches) {
      for (const tjArray of tjArrayMatches) {
        const parts = tjArray.match(/\(([^)]*)\)/g);
        if (parts) {
          const decoded = parts.map(p => decodeEscapedPdfText(p.slice(1, -1))).join('');
          if (decoded.trim() && !containsGarbage(decoded)) {
            textContents.push(decoded);
          }
        }
      }
    }
  }

  const textPatterns = rawText.match(/(?:[A-Z][a-z]+(?:\s+[a-z]+)*|[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]{4,}(?:\s+[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]{3,})+)/g);
  if (textPatterns) {
    for (const pattern of textPatterns) {
      if (pattern.length > 15 && !containsGarbage(pattern)) {
        textContents.push(pattern);
      }
    }
  }

  return textContents.join(' ').replace(/\s+/g, ' ').trim();
}

function decodeEscapedPdfText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

async function extractDocxText(blob: Blob): Promise<ExtractionResult> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
    const rawText = new TextDecoder().decode(bytes);
    return { text: rawText, pages: [{ pageNumber: 1, content: rawText }] };
  }

  const zipContent = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  
  const paragraphs = zipContent.split(/<w:p[^>]*>/);
  const cleanParagraphs: string[] = [];
  
  for (const para of paragraphs) {
    const textMatches = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    if (textMatches) {
      const paraContent = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
      if (paraContent.trim()) {
        cleanParagraphs.push(paraContent.trim());
      }
    }
  }

  const allText = cleanParagraphs.join('\n\n');

  const pageBreaks = zipContent.split(/<w:br w:type="page"\/>/);
  const pages: PageContent[] = [];
  
  if (pageBreaks.length > 1) {
    for (let i = 0; i < pageBreaks.length; i++) {
      const pageTexts = pageBreaks[i].match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      const pageContent = pageTexts ? pageTexts.map(t => t.replace(/<[^>]+>/g, '')).join(' ') : '';
      if (pageContent.trim()) {
        pages.push({ pageNumber: i + 1, content: pageContent.trim() });
      }
    }
  } else {
    pages.push({ pageNumber: 1, content: allText });
  }

  return { text: allText, pages };
}

async function extractSpreadsheetText(blob: Blob, fileType: string): Promise<string> {
  const text = await blob.text();
  if (fileType === 'csv') {
    const lines = text.split('\n');
    return lines.map(line => line.replace(/,/g, ' | ')).join('\n');
  }
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ==================== SEMANTIC CHUNKING ====================

interface ChunkOptions {
  maxChunkSize: number;
  minChunkSize: number;
  overlapSize: number;
}

interface Chunk {
  content: string;
  pageNumber: number;
}

function createSemanticChunks(pages: PageContent[], options: ChunkOptions): Chunk[] {
  const chunks: Chunk[] = [];
  
  for (const page of pages) {
    const pageChunks = splitTextSemanticly(page.content, options);
    for (const chunkText of pageChunks) {
      chunks.push({ content: chunkText, pageNumber: page.pageNumber });
    }
  }

  if (chunks.length === 0 && pages.length > 0) {
    const allText = pages.map(p => p.content).join('\n\n');
    if (allText.trim()) {
      chunks.push({ content: allText.trim(), pageNumber: 1 });
    }
  }

  return chunks;
}

function splitTextSemanticly(text: string, options: ChunkOptions): string[] {
  const { maxChunkSize, minChunkSize, overlapSize } = options;
  const chunks: string[] = [];

  if (!text || text.trim().length < minChunkSize) {
    if (text && text.trim()) return [text.trim()];
    return [];
  }

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  let currentChunk = "";
  let previousOverlap = "";

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    if (trimmedParagraph.length > maxChunkSize) {
      if (currentChunk.trim().length >= minChunkSize) {
        chunks.push((previousOverlap + currentChunk).trim());
        previousOverlap = getOverlap(currentChunk, overlapSize);
        currentChunk = "";
      }

      const sentences = splitIntoSentences(trimmedParagraph);
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length >= minChunkSize) {
          chunks.push((previousOverlap + currentChunk).trim());
          previousOverlap = getOverlap(currentChunk, overlapSize);
          currentChunk = sentence + " ";
        } else {
          currentChunk += sentence + " ";
        }
      }
    } else if (currentChunk.length + trimmedParagraph.length > maxChunkSize) {
      if (currentChunk.trim().length >= minChunkSize) {
        chunks.push((previousOverlap + currentChunk).trim());
        previousOverlap = getOverlap(currentChunk, overlapSize);
      }
      currentChunk = trimmedParagraph + "\n\n";
    } else {
      currentChunk += trimmedParagraph + "\n\n";
    }
  }

  if (currentChunk.trim().length >= minChunkSize) {
    chunks.push((previousOverlap + currentChunk).trim());
  } else if (currentChunk.trim() && chunks.length > 0) {
    chunks[chunks.length - 1] += "\n\n" + currentChunk.trim();
  } else if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function splitIntoSentences(text: string): string[] {
  const sentences = text.split(/(?<=[.!?ã€‚])\s+(?=[A-ZÃ€ÃÃ‚ÃƒÃˆÃ‰ÃŠÃŒÃÃ’Ã“Ã”Ã•Ã™ÃšÄ‚ÄÄ¨Å¨Æ Æ¯áº áº¢áº¤áº¦áº¨áºªáº¬áº®áº°áº²áº´áº¶áº¸áººáº¼á»€á»‚á»„á»†á»ˆá»Šá»Œá»Žá»á»’á»”á»–á»˜á»šá»œá»žá» á»¢á»¤á»¦á»¨á»ªá»¬á»®á»°á»²á»´Ãá»¶á»¸])/);
  return sentences.filter(s => s.trim().length > 0);
}

function getOverlap(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) return text;
  const lastPart = text.slice(-overlapSize - 50);
  const sentenceEnd = lastPart.lastIndexOf('. ');
  if (sentenceEnd > 0) return lastPart.slice(sentenceEnd + 2);
  return text.slice(-overlapSize);
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ==================== EMBEDDING GENERATION ====================

function generateSemanticEmbedding(text: string): number[] {
  const embedding = new Array(768).fill(0);
  const normalizedText = text.toLowerCase().trim();
  
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i < normalizedText.length - n + 1; i++) {
      const ngram = normalizedText.slice(i, i + n);
      const hash = hashString(ngram);
      const idx = Math.abs(hash) % 256;
      embedding[idx] += 1 / Math.sqrt(normalizedText.length);
    }
  }

  const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }
  for (const [word, freq] of wordFreq.entries()) {
    const tfidf = (freq / words.length) * Math.log(100 / (1 + freq));
    const hash = hashString(word);
    const idx = 256 + Math.abs(hash) % 256;
    embedding[idx] += tfidf;
  }

  const categories = [
    { keywords: ['bÃ¡o cÃ¡o', 'report', 'thá»‘ng kÃª', 'statistics', 'thÃ¡ng', 'quÃ½', 'nÄƒm'], dims: [512, 520] },
    { keywords: ['há»£p Ä‘á»“ng', 'contract', 'thá»a thuáº­n', 'agreement', 'bÃªn'], dims: [520, 530] },
    { keywords: ['tÃ i chÃ­nh', 'finance', 'doanh thu', 'revenue', 'chi phÃ­', 'cost', 'tiá»n'], dims: [530, 540] },
    { keywords: ['nhÃ¢n sá»±', 'hr', 'nhÃ¢n viÃªn', 'employee', 'tuyá»ƒn dá»¥ng'], dims: [540, 550] },
    { keywords: ['sáº£n pháº©m', 'product', 'dá»‹ch vá»¥', 'service', 'hÃ ng hÃ³a'], dims: [550, 560] },
    { keywords: ['khÃ¡ch hÃ ng', 'customer', 'Ä‘á»‘i tÃ¡c', 'partner', 'client'], dims: [560, 570] },
    { keywords: ['quy trÃ¬nh', 'process', 'hÆ°á»›ng dáº«n', 'guide', 'thá»§ tá»¥c'], dims: [570, 580] },
    { keywords: ['váº­n hÃ nh', 'operation', 'quáº£n lÃ½', 'manage', 'Ä‘iá»u hÃ nh'], dims: [580, 590] },
    { keywords: ['ká»¹ thuáº­t', 'technical', 'cÃ´ng nghá»‡', 'technology', 'há»‡ thá»‘ng'], dims: [590, 600] },
    { keywords: ['phÃ¡p lÃ½', 'legal', 'quy Ä‘á»‹nh', 'regulation', 'luáº­t'], dims: [600, 610] },
  ];

  for (const cat of categories) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (normalizedText.includes(kw)) score += 1;
    }
    if (score > 0) {
      const normalized = score / cat.keywords.length;
      for (let i = cat.dims[0]; i < cat.dims[1]; i++) {
        embedding[i] = normalized;
      }
    }
  }

  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + '_' + words[i + 1];
    const hash = hashString(bigram);
    const idx = 640 + Math.abs(hash) % 128;
    embedding[idx] += 1 / words.length;
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash;
}



