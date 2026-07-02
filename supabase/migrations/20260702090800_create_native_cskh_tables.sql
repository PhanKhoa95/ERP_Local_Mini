-- Create cskh_channels table
CREATE TABLE IF NOT EXISTS public.cskh_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'zalo', 'facebook', 'webchat'
    credentials JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cskh_conversations table
CREATE TABLE IF NOT EXISTS public.cskh_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.cskh_channels(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_address TEXT,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'resolved'
    assigned_agent_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cskh_messages table
CREATE TABLE IF NOT EXISTS public.cskh_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.cskh_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL, -- 'customer', 'agent', 'bot'
    sender_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cskh_customer_memories table
CREATE TABLE IF NOT EXISTS public.cskh_customer_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.cskh_conversations(id) ON DELETE CASCADE,
    fact TEXT NOT NULL,
    importance INTEGER DEFAULT 3, -- 1, 2, 3
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.cskh_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cskh_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cskh_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cskh_customer_memories ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated read/write for local demo
CREATE POLICY "Allow public access to cskh_channels" ON public.cskh_channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to cskh_conversations" ON public.cskh_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to cskh_messages" ON public.cskh_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to cskh_customer_memories" ON public.cskh_customer_memories FOR ALL USING (true) WITH CHECK (true);
