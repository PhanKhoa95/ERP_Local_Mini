import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NodeExecution {
  node_id: string;
  node_type: string;
  status: "success" | "failed" | "skipped" | "waiting";
  input: any;
  output: any;
  ai_reasoning?: string;
  duration_ms: number;
}

async function executeNode(
  node: any,
  contextData: any,
  supabase: any,
  companyId: string,
  userId: string
): Promise<{ output: any; ai_reasoning?: string }> {
  const nodeType = node.type;
  const subtype = node.trigger_type || node.condition_type || node.action_type;

  // Trigger nodes just pass through context
  if (nodeType === "trigger") {
    return { output: contextData };
  }

  // Condition nodes evaluate and return boolean
  if (nodeType === "condition") {
    if (subtype === "compare") {
      const field = node.config?.field;
      const operator = node.config?.operator;
      const value = Number(node.config?.value);
      const actual = Number(contextData?.[field] ?? 0);
      let result = false;
      switch (operator) {
        case ">": result = actual > value; break;
        case "<": result = actual < value; break;
        case "=": result = actual === value; break;
        case ">=": result = actual >= value; break;
        case "<=": result = actual <= value; break;
      }
      return { output: { result, actual, operator, value } };
    }

    if (subtype === "status_check") {
      const expected = node.config?.expected_status;
      return { output: { result: contextData?.status === expected, expected, actual: contextData?.status } };
    }

    if (subtype === "condition_guard") {
      const requiredFields = (node.config?.required_fields || "").split(",").map((f: string) => f.trim()).filter(Boolean);
      const missing = requiredFields.filter((f: string) => !contextData?.[f] && contextData?.[f] !== 0);
      const minField = node.config?.min_value_field;
      const minValue = Number(node.config?.min_value || 0);
      let valueCheck = true;
      if (minField && contextData?.[minField] !== undefined) {
        valueCheck = Number(contextData[minField]) >= minValue;
      }
      const result = missing.length === 0 && valueCheck;
      return { output: { result, missing_fields: missing, value_check: valueCheck } };
    }

    if (subtype === "ai_router") {
      // Call ai-workflow-agent for routing
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-workflow-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ node_type: "ai_router", config: node.config, context_data: contextData }),
      });
      const result = await resp.json();
      return { output: result.result, ai_reasoning: result.result?.reasoning };
    }

    if (subtype === "check_vneid_verified") {
      const { data: vneid } = await supabase
        .from("vneid_verifications")
        .select("status")
        .eq("user_id", userId)
        .eq("status", "verified")
        .limit(1)
        .maybeSingle();
      return { output: { result: !!vneid, verified: !!vneid } };
    }

    if (subtype === "permission_guard") {
      const requiredRole = node.config?.required_role || "staff";
      const requiresVneid = node.config?.requires_vneid === "true";
      const roleLevel: Record<string, number> = { staff: 1, manager: 2, admin: 3 };

      // Get user role
      const { data: memberData } = await supabase
        .from("company_members")
        .select("role")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .single();

      const userRole = memberData?.role || "staff";
      const hasRole = (roleLevel[userRole] || 1) >= (roleLevel[requiredRole] || 1);

      let vneidOk = true;
      if (requiresVneid) {
        const { data: vneid } = await supabase
          .from("vneid_verifications")
          .select("status")
          .eq("user_id", userId)
          .eq("status", "verified")
          .limit(1)
          .maybeSingle();
        vneidOk = !!vneid;
      }

      const result = hasRole && vneidOk;
      return {
        output: {
          result,
          role: userRole,
          required_role: requiredRole,
          vneid_ok: vneidOk,
          denied_reason: !hasRole ? "insufficient_role" : !vneidOk ? "vneid_required" : null,
        },
      };
    }

    // 3-Level dispatch conditions
    if (subtype === "check_workload") {
      const maxTasks = Number(node.config?.max_tasks || 10);
      const employeeId = contextData?.assigned_to || contextData?.employee_id;
      if (!employeeId) return { output: { result: true, reason: "no_employee_id" } };
      
      const { count } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", employeeId)
        .not("status", "in", '("done","cancelled")');
      
      const currentTasks = count || 0;
      return { output: { result: currentTasks < maxTasks, current_tasks: currentTasks, max_tasks: maxTasks } };
    }

    return { output: { result: true } };
  }

  // Action nodes
  if (nodeType === "action") {
    if (subtype === "update_status") {
      return { output: { action: "update_status", new_status: node.config?.new_status } };
    }

    if (subtype === "send_notification") {
      await supabase.from("rag_notifications").insert({
        user_id: userId,
        company_id: companyId,
        type: "workflow",
        title: "Workflow Notification",
        message: node.config?.message || "Thông báo từ workflow",
      });
      return { output: { sent: true } };
    }

    if (subtype === "create_approval") {
      const { data } = await supabase.from("approval_requests").insert({
        company_id: companyId,
        requested_by: userId,
        title: node.config?.approval_title || "Yêu cầu phê duyệt từ workflow",
        request_type: "workflow",
        status: "pending",
      }).select("id").single();
      return { output: { approval_id: data?.id } };
    }

    if (subtype === "create_task") {
      await supabase.from("tasks").insert({
        company_id: companyId,
        assigned_by: userId,
        title: node.config?.task_title || "Task từ workflow",
        source_type: "workflow",
        priority: "normal",
      });
      return { output: { task_created: true } };
    }

    if (subtype === "ai_agent") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-workflow-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ node_type: "ai_agent", config: node.config, context_data: contextData }),
      });
      const result = await resp.json();
      return { output: result.result, ai_reasoning: JSON.stringify(result.result?.reasoning) };
    }

    if (subtype === "human_approval") {
      // Create approval request and pause
      const { data } = await supabase.from("approval_requests").insert({
        company_id: companyId,
        requested_by: userId,
        title: node.config?.message || "Phê duyệt workflow",
        request_type: "workflow_approval",
        status: "pending",
      }).select("id").single();
      return { output: { waiting: true, approval_id: data?.id } };
    }

    if (subtype === "webhook") {
      try {
        const method = node.config?.method || "POST";
        const url = node.config?.url;
        if (!url) return { output: { error: "No URL configured" } };
        const resp = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: method === "POST" ? JSON.stringify(contextData) : undefined,
        });
        const body = await resp.text();
        return { output: { status: resp.status, body: body.substring(0, 1000) } };
      } catch (e) {
        return { output: { error: e.message } };
      }
    }

    if (subtype === "ai_self_correct") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-workflow-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ node_type: "ai_self_correct", config: node.config, context_data: contextData }),
      });
      const result = await resp.json();
      return { output: result.result, ai_reasoning: result.result?.correction };
    }

    if (subtype === "sync_point") {
      const syncMsg = node.config?.sync_message || "Sync point reached";
      return { output: { synced: true, sync_message: syncMsg, synced_at: new Date().toISOString() } };
    }

    if (subtype === "audit_trail") {
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: node.config?.audit_action || "WORKFLOW_AUDIT",
        table_name: node.config?.audit_table || "workflows",
        record_id: contextData?.id || null,
        new_data: { message: node.config?.audit_message, context: contextData },
      });
      return { output: { audited: true } };
    }

    if (subtype === "issue_tokens") {
      const amount = Number(node.config?.amount || 100);
      const tokenType = node.config?.token_type || "reward";
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const resp = await fetch(`${supabaseUrl}/functions/v1/manage-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ action: "issue", target_user_id: userId, amount, token_type: tokenType }),
      });
      const result = await resp.json();
      return { output: { issued: true, ...result } };
    }

    if (subtype === "issue_esop") {
      return { output: { esop_issued: true, shares_per_point: node.config?.shares_per_point || 10 } };
    }

    // 3-Level Dispatch Actions
    if (subtype === "ai_transcriber") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-task-dispatcher`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({
          action: "transcribe_to_tasks",
          text: contextData?.content || contextData?.text || "",
          company_id: companyId,
          user_id: userId,
          source_type: node.config?.source_type || "meeting",
        }),
      });
      const result = await resp.json();
      return { output: result, ai_reasoning: "AI transcribed text to tasks" };
    }

    if (subtype === "kpi_mapper") {
      // Map task completion to KPI metrics
      const directiveId = contextData?.directive_id || contextData?.source_id;
      if (directiveId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const resp = await fetch(`${supabaseUrl}/functions/v1/ai-task-dispatcher`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({
            action: "dispatch_directive",
            directive_id: directiveId,
            company_id: companyId,
            user_id: userId,
          }),
        });
        const result = await resp.json();
        return { output: result };
      }
      return { output: { mapped: false, reason: "no_directive_id" } };
    }

    if (subtype === "auto_dispatch") {
      const directiveId = contextData?.directive?.id || contextData?.directive_id;
      if (directiveId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const resp = await fetch(`${supabaseUrl}/functions/v1/ai-task-dispatcher`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({
            action: "breakdown_wbs",
            directive_id: directiveId,
            company_id: companyId,
            suggestions: node.config?.suggestions || "",
          }),
        });
        const result = await resp.json();
        return { output: result };
      }
      return { output: { dispatched: false, reason: "no_directive_id" } };
    }

    if (subtype === "escalation_alert") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-task-dispatcher`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ action: "check_escalation", company_id: companyId }),
      });
      const result = await resp.json();
      return { output: result };
    }

    if (subtype === "vneid_validator") {
      const actionType = node.config?.action_type || "sensitive_action";
      const { data: vneid } = await supabase
        .from("vneid_verifications")
        .select("status")
        .eq("user_id", userId)
        .eq("status", "verified")
        .limit(1)
        .maybeSingle();
      
      const verified = !!vneid;
      if (verified) {
        await supabase.from("sensitive_action_logs").insert({
          company_id: companyId,
          user_id: userId,
          action_type: actionType,
          vneid_verified: true,
          step_up_method: "vneid",
          approved: true,
          metadata: { source: "workflow", node_id: node.id },
        });
      }
      return { output: { result: verified, vneid_verified: verified, action_type: actionType } };
    }

    return { output: { action: subtype, config: node.config } };
  }

  return { output: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const { data: member } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", userId)
      .limit(1)
      .single();
    if (!member) {
      return new Response(JSON.stringify({ error: "No company" }), { status: 403, headers: corsHeaders });
    }
    const companyId = member.company_id;

    const { workflow_id, trigger_data } = await req.json();

    // Load workflow
    const { data: workflow, error: wfError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflow_id)
      .eq("company_id", companyId)
      .single();

    if (wfError || !workflow) {
      return new Response(JSON.stringify({ error: "Workflow not found" }), { status: 404, headers: corsHeaders });
    }

    const flowData = typeof workflow.flow_data === "string" ? JSON.parse(workflow.flow_data) : workflow.flow_data;
    const nodes = flowData.nodes || [];
    const edges = flowData.edges || [];

    // Create log entry
    const { data: logEntry } = await supabase.from("workflow_logs").insert({
      workflow_id,
      trigger_data: trigger_data || {},
      status: "running",
      started_at: new Date().toISOString(),
      node_executions: [],
    }).select("id").single();

    const logId = logEntry?.id;
    const nodeExecutions: NodeExecution[] = [];
    let contextData = trigger_data || {};
    let workflowStatus = "success";
    let waitingForApproval = false;
    let approvalRequestId: string | null = null;

    // Build adjacency map
    const childrenMap = new Map<string, string[]>();
    for (const edge of edges) {
      const children = childrenMap.get(edge.source) || [];
      children.push(edge.target);
      childrenMap.set(edge.source, children);
    }

    // Find trigger nodes (no incoming edges)
    const targetSet = new Set(edges.map((e: any) => e.target));
    const startNodes = nodes.filter((n: any) => !targetSet.has(n.id));

    // BFS execution
    const queue = [...startNodes.map((n: any) => n.id)];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodes.find((n: any) => n.id === nodeId);
      if (!node) continue;

      const startTime = Date.now();

      try {
        const { output, ai_reasoning } = await executeNode(node, contextData, supabase, companyId, userId);

        const execution: NodeExecution = {
          node_id: nodeId,
          node_type: node.type,
          status: "success",
          input: contextData,
          output,
          ai_reasoning,
          duration_ms: Date.now() - startTime,
        };

        // Handle human_approval pause
        if (node.action_type === "human_approval" && output?.waiting) {
          execution.status = "waiting";
          waitingForApproval = true;
          approvalRequestId = output.approval_id;
          nodeExecutions.push(execution);
          workflowStatus = "waiting";
          break;
        }

        nodeExecutions.push(execution);

        // Merge output into context
        if (output && typeof output === "object") {
          contextData = { ...contextData, ...output };
        }

        // For condition nodes, only follow edges if result is true
        if (node.type === "condition" && output?.result === false) {
          continue; // Don't enqueue children
        }

        // Enqueue children
        const children = childrenMap.get(nodeId) || [];
        for (const childId of children) {
          if (!visited.has(childId)) queue.push(childId);
        }
      } catch (e) {
        nodeExecutions.push({
          node_id: nodeId,
          node_type: node.type,
          status: "failed",
          input: contextData,
          output: { error: e.message },
          duration_ms: Date.now() - startTime,
        });
        workflowStatus = "failed";
        break;
      }
    }

    // Update log
    if (logId) {
      await supabase.from("workflow_logs").update({
        status: workflowStatus,
        finished_at: workflowStatus !== "waiting" ? new Date().toISOString() : null,
        execution_log: { summary: `${nodeExecutions.length} nodes executed` },
        node_executions: nodeExecutions,
        waiting_for_approval: waitingForApproval,
        approval_request_id: approvalRequestId,
      }).eq("id", logId);
    }

    return new Response(JSON.stringify({
      log_id: logId,
      status: workflowStatus,
      node_executions: nodeExecutions,
      context_data: contextData,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("execute-workflow error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
