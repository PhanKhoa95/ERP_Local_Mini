
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create companies table for multi-tenant
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create company_members table
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' NOT NULL, -- 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(company_id, user_id)
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'docx', 'xlsx'
  file_size BIGINT,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create document_chunks table
CREATE TABLE public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  page_number INTEGER,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create document_embeddings table with vector
CREATE TABLE public.document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID REFERENCES public.document_chunks(id) ON DELETE CASCADE NOT NULL UNIQUE,
  embedding vector(768), -- Gemini embedding dimension
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for vector similarity search
CREATE INDEX ON public.document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  title TEXT DEFAULT 'Cuộc hội thoại mới',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  citations JSONB, -- [{document_id, chunk_id, page_number, excerpt}]
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  citations JSONB,
  tags TEXT[] DEFAULT '{}',
  folder TEXT,
  notes TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create search_queries table for trending
CREATE TABLE public.search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  query_embedding vector(768),
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create trending_questions table
CREATE TABLE public.trending_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  growth_rate NUMERIC DEFAULT 0, -- % increase in last 24h
  last_asked_at TIMESTAMPTZ DEFAULT now(),
  cluster_id TEXT, -- for grouping similar questions
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create rag_notifications table (separate from existing notifications)
CREATE TABLE public.rag_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'document_processed', 'document_failed', 'trending_report'
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create email_preferences table
CREATE TABLE public.email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  document_processed BOOLEAN DEFAULT true,
  document_failed BOOLEAN DEFAULT true,
  weekly_trending BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'realtime', -- 'realtime', 'daily', 'weekly'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create system_settings table for API keys
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create audit_questions table (ground truth for testing)
CREATE TABLE public.audit_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  expected_answer TEXT NOT NULL,
  expected_document_ids UUID[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create audit_results table
CREATE TABLE public.audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_question_id UUID REFERENCES public.audit_questions(id) ON DELETE CASCADE NOT NULL,
  actual_answer TEXT,
  retrieved_document_ids UUID[],
  context_recall NUMERIC, -- 0-1 score
  faithfulness NUMERIC, -- 0-1 score
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_results ENABLE ROW LEVEL SECURITY;

-- Helper function to check company membership
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- Helper function to check company admin
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id AND role = 'admin'
  )
$$;

-- RLS Policies for companies
CREATE POLICY "Members can view their companies" ON public.companies
  FOR SELECT USING (public.is_company_member(auth.uid(), id));

CREATE POLICY "Admins can update their companies" ON public.companies
  FOR UPDATE USING (public.is_company_admin(auth.uid(), id));

-- RLS Policies for company_members
CREATE POLICY "Members can view company members" ON public.company_members
  FOR SELECT USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage company members" ON public.company_members
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

-- RLS Policies for documents
CREATE POLICY "Members can view company documents" ON public.documents
  FOR SELECT USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Members can insert documents" ON public.documents
  FOR INSERT WITH CHECK (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage documents" ON public.documents
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

-- RLS Policies for document_chunks
CREATE POLICY "Members can view chunks" ON public.document_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND public.is_company_member(auth.uid(), d.company_id)
    )
  );

-- RLS Policies for document_embeddings
CREATE POLICY "Members can view embeddings" ON public.document_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.document_chunks dc
      JOIN public.documents d ON d.id = dc.document_id
      WHERE dc.id = chunk_id AND public.is_company_member(auth.uid(), d.company_id)
    )
  );

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view own sessions" ON public.chat_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid() AND public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Users can update own sessions" ON public.chat_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions" ON public.chat_sessions
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in own sessions" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Users can insert messages in own sessions" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  );

-- RLS Policies for bookmarks
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (user_id = auth.uid() OR (is_shared = true AND public.is_company_member(auth.uid(), company_id)));

CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for search_queries
CREATE POLICY "Users can view own queries" ON public.search_queries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert queries" ON public.search_queries
  FOR INSERT WITH CHECK (user_id = auth.uid() AND public.is_company_member(auth.uid(), company_id));

-- RLS Policies for trending_questions
CREATE POLICY "Members can view trending" ON public.trending_questions
  FOR SELECT USING (public.is_company_member(auth.uid(), company_id));

-- RLS Policies for rag_notifications
CREATE POLICY "Users can view own notifications" ON public.rag_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.rag_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for email_preferences
CREATE POLICY "Users can manage own preferences" ON public.email_preferences
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for system_settings (admin only)
CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view settings" ON public.system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for audit_questions
CREATE POLICY "Admins can manage audit questions" ON public.audit_questions
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

-- RLS Policies for audit_results
CREATE POLICY "Admins can view audit results" ON public.audit_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.audit_questions aq
      WHERE aq.id = audit_question_id AND public.is_company_admin(auth.uid(), aq.company_id)
    )
  );

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.rag_notifications;

-- Create updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trending_questions_updated_at BEFORE UPDATE ON public.trending_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
