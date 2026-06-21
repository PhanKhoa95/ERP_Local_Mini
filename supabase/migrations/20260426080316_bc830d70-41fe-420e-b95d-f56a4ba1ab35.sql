
-- Bảng leads
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  partner_id UUID NULL,
  channel TEXT DEFAULT 'web_chat',
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  score INTEGER NOT NULL DEFAULT 0,
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  assigned_to UUID NULL,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_leads_company ON public.sales_leads(company_id);
CREATE INDEX idx_sales_leads_status ON public.sales_leads(company_id, status);

-- Bảng conversations
CREATE TABLE public.sales_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  session_token TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  agent_mode TEXT NOT NULL DEFAULT 'ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_conv_company ON public.sales_conversations(company_id);
CREATE INDEX idx_sales_conv_session ON public.sales_conversations(session_token);
CREATE INDEX idx_sales_conv_lead ON public.sales_conversations(lead_id);

-- Bảng messages
CREATE TABLE public.sales_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.sales_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT,
  tool_calls JSONB,
  tool_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_msg_conv ON public.sales_messages(conversation_id, created_at);

-- Bảng cấu hình
CREATE TABLE public.sales_agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE,
  agent_name TEXT NOT NULL DEFAULT 'Trợ lý bán hàng',
  greeting TEXT DEFAULT 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
  persona TEXT DEFAULT 'Bạn là trợ lý bán hàng chuyên nghiệp, thân thiện, nói tiếng Việt.',
  auto_create_order BOOLEAN NOT NULL DEFAULT false,
  auto_create_quotation BOOLEAN NOT NULL DEFAULT true,
  max_order_value NUMERIC NOT NULL DEFAULT 5000000,
  handoff_keywords TEXT[] DEFAULT ARRAY['gặp người','khiếu nại','complaint','nhân viên thật'],
  enabled_channels TEXT[] DEFAULT ARRAY['web_chat'],
  knowledge_doc_ids UUID[] DEFAULT ARRAY[]::UUID[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER trg_sales_leads_updated BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sales_conv_updated BEFORE UPDATE ON public.sales_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sales_cfg_updated BEFORE UPDATE ON public.sales_agent_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_agent_config ENABLE ROW LEVEL SECURITY;

-- Leads: chỉ thành viên công ty
CREATE POLICY "Members manage company leads" ON public.sales_leads
  FOR ALL USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

-- Conversations: thành viên công ty quản lý
CREATE POLICY "Members manage company conversations" ON public.sales_conversations
  FOR ALL USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

-- Messages: ai có quyền trên conversation đó thì có quyền trên message
CREATE POLICY "Members read messages of company conversations" ON public.sales_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.sales_conversations c
    WHERE c.id = conversation_id AND public.is_company_member(auth.uid(), c.company_id)
  ));
CREATE POLICY "Members insert messages" ON public.sales_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.sales_conversations c
    WHERE c.id = conversation_id AND public.is_company_member(auth.uid(), c.company_id)
  ));

-- Config: admin/manager công ty
CREATE POLICY "Members read sales config" ON public.sales_agent_config
  FOR SELECT USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Admins manage sales config" ON public.sales_agent_config
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_leads;
