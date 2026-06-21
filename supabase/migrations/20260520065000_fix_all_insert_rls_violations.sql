-- =============================================
-- FIX: RLS INSERT violations cho nhiều bảng
-- Phát hiện qua audit toàn bộ UI → Supabase calls
-- =============================================

-- ============================================================
-- 1. rag_notifications: THIẾU INSERT policy hoàn toàn
-- useStrategicReports.ts dòng 185 & 224 gọi .insert()
-- Level-up triggers trong DB cũng gọi INSERT
-- ============================================================
DROP POLICY IF EXISTS "Users can insert notifications" ON public.rag_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.rag_notifications;

-- Cho phép authenticated users insert notifications
CREATE POLICY "Users can insert notifications"
  ON public.rag_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Cho phép DB triggers (SECURITY DEFINER functions) cũng insert
-- Điều này đã hoạt động qua trigger functions vì chúng là SECURITY DEFINER
-- Nhưng thêm policy để Edge Functions cũng có thể insert
CREATE POLICY "System can insert notifications"
  ON public.rag_notifications
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 2. data_quality_issues: Chỉ có FOR ALL USING(is_company_admin)
-- useOrders.ts dòng 65 & 134 gọi .insert() khi member tạo đơn hàng
-- Member role KHÔNG THỂ insert → order creation fails silently
-- ============================================================
DROP POLICY IF EXISTS "Company members can insert data quality issues" ON public.data_quality_issues;

CREATE POLICY "Company members can insert data quality issues"
  ON public.data_quality_issues
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

-- ============================================================
-- 3. purchase_order_items: FOR ALL USING(EXISTS) thiếu WITH CHECK
-- Thêm explicit WITH CHECK cho INSERT
-- ============================================================
DROP POLICY IF EXISTS "Company members can manage purchase_order_items" ON public.purchase_order_items;

CREATE POLICY "Company members can manage purchase_order_items"
  ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders po
    WHERE po.id = purchase_order_items.purchase_order_id
    AND po.company_id = public.get_user_company_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.purchase_orders po
    WHERE po.id = purchase_order_items.purchase_order_id
    AND po.company_id = public.get_user_company_id()
  ));

-- ============================================================
-- 4. quotation_items: Tương tự — FOR ALL USING(EXISTS) thiếu WITH CHECK
-- ============================================================
DROP POLICY IF EXISTS "Company members can manage quotation_items" ON public.quotation_items;

CREATE POLICY "Company members can manage quotation_items"
  ON public.quotation_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quotations q
    WHERE q.id = quotation_items.quotation_id
    AND q.company_id = public.get_user_company_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quotations q
    WHERE q.id = quotation_items.quotation_id
    AND q.company_id = public.get_user_company_id()
  ));

-- ============================================================
-- 5. integration_configs, data_mappings, integration_queue, webhook_logs
-- Có FOR ALL USING(is_company_admin) mà KHÔNG có WITH CHECK
-- Thêm WITH CHECK để Postgres không cần fallback implicit
-- ============================================================
DROP POLICY IF EXISTS "Company admins can manage configs" ON public.integration_configs;
CREATE POLICY "Company admins can manage configs" ON public.integration_configs
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Company admins can manage mappings" ON public.data_mappings;
CREATE POLICY "Company admins can manage mappings" ON public.data_mappings
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Company admins can manage queue" ON public.integration_queue;
CREATE POLICY "Company admins can manage queue" ON public.integration_queue
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Company admins can manage webhook logs" ON public.webhook_logs;
CREATE POLICY "Company admins can manage webhook logs" ON public.webhook_logs
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- ============================================================
-- 6. company_members: FOR ALL USING(is_company_admin) thiếu WITH CHECK
-- Chỉ admin quản lý — nhưng thêm WITH CHECK cho explicit
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage company members" ON public.company_members;
CREATE POLICY "Admins can manage company members" ON public.company_members
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- ============================================================
-- 7. audit_questions: FOR ALL USING(is_company_admin) thiếu WITH CHECK
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage audit questions" ON public.audit_questions;
CREATE POLICY "Admins can manage audit questions" ON public.audit_questions
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- ============================================================
-- 8. documents: FOR ALL USING(is_company_admin) thiếu WITH CHECK
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;
CREATE POLICY "Admins can manage documents" ON public.documents
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- ============================================================
-- 9. system_settings: FOR ALL USING(has_role('admin')) thiếu WITH CHECK
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
