import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ...params } = await req.json();

    // ======= ACTION: transcribe_to_tasks =======
    if (action === "transcribe_to_tasks") {
      const { text, company_id, user_id, source_type = "meeting" } = params;
      if (!text || !company_id) throw new Error("Missing text or company_id");

      if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      // Get org chart for context
      const { data: employees } = await supabase
        .from("perf_employees")
        .select("id, name, title, org_unit_id, perf_org_units(name)")
        .eq("company_id", company_id)
        .eq("is_active", true)
        .limit(100);

      const employeeList = (employees || []).map((e: any) =>
        `${e.name} (${e.title || 'NV'}, ${e.perf_org_units?.name || 'N/A'})`
      ).join(", ");

      const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Báº¡n lÃ  thÆ° kÃ½ Ä‘iá»u phá»‘i AI. Nhiá»‡m vá»¥: phÃ¢n tÃ­ch biÃªn báº£n há»p/vÄƒn báº£n chá»‰ thá»‹ vÃ  bÃ³c tÃ¡ch thÃ nh danh sÃ¡ch cÃ´ng viá»‡c cá»¥ thá»ƒ.\nNhÃ¢n viÃªn hiá»‡n cÃ³: ${employeeList || "ChÆ°a cÃ³ dá»¯ liá»‡u"}\nTráº£ vá» JSON qua tool calling.`,
            },
            { role: "user", content: `PhÃ¢n tÃ­ch ná»™i dung sau vÃ  bÃ³c tÃ¡ch cÃ´ng viá»‡c:\n\n${text}` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_tasks",
                description: "TrÃ­ch xuáº¥t danh sÃ¡ch cÃ´ng viá»‡c tá»« ná»™i dung há»p/vÄƒn báº£n",
                parameters: {
                  type: "object",
                  properties: {
                    directive_title: { type: "string", description: "TiÃªu Ä‘á» chá»‰ thá»‹ tá»•ng há»£p" },
                    tasks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          assignee_name: { type: "string", description: "TÃªn ngÆ°á»i Ä‘Æ°á»£c gÃ¡n (náº¿u cÃ³)" },
                          priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
                          deadline_days: { type: "number", description: "Sá»‘ ngÃ y Ä‘á»ƒ hoÃ n thÃ nh" },
                          kpi_target: { type: "string", description: "Chá»‰ tiÃªu KPI liÃªn quan (náº¿u cÃ³)" },
                        },
                        required: ["title", "priority"],
                      },
                    },
                    kpi_targets: {
                      type: "object",
                      description: "CÃ¡c chá»‰ tiÃªu KPI tá»•ng thá»ƒ tá»« chá»‰ thá»‹",
                    },
                  },
                  required: ["directive_title", "tasks"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "extract_tasks" } },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        // Save directive with error status so raw text is preserved
        const { data: errorDirective } = await supabase
          .from("directives")
          .insert({
            company_id,
            issued_by: user_id,
            title: `[Lá»—i AI] Chá»‰ thá»‹ tá»« ${source_type} - ${new Date().toLocaleDateString("vi-VN")}`,
            content: text,
            source_type,
            source_data: { raw_text: text, ai_error: `${response.status}: ${errText}` },
            status: "draft",
          })
          .select()
          .single();

        if (response.status === 429) throw new Error("Rate limit exceeded, please try again later. Ná»™i dung gá»‘c Ä‘Ã£ Ä‘Æ°á»£c lÆ°u.");
        if (response.status === 402) throw new Error("Payment required, please add credits. Ná»™i dung gá»‘c Ä‘Ã£ Ä‘Æ°á»£c lÆ°u.");
        throw new Error(`AI error: ${response.status}. Ná»™i dung gá»‘c Ä‘Ã£ Ä‘Æ°á»£c lÆ°u vÃ o chá»‰ thá»‹ nhÃ¡p.`);
      }

      const aiResult = await response.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        // Save directive with raw text even if AI doesn't return structured data
        await supabase
          .from("directives")
          .insert({
            company_id,
            issued_by: user_id,
            title: `Chá»‰ thá»‹ tá»« ${source_type} - ${new Date().toLocaleDateString("vi-VN")}`,
            content: text,
            source_type,
            source_data: { raw_text: text, ai_error: "AI did not return structured data" },
            status: "draft",
          });
        throw new Error("AI khÃ´ng tráº£ vá» dá»¯ liá»‡u cÃ³ cáº¥u trÃºc. Ná»™i dung gá»‘c Ä‘Ã£ Ä‘Æ°á»£c lÆ°u vÃ o chá»‰ thá»‹ nhÃ¡p.");
      }

      const parsed = JSON.parse(toolCall.function.arguments);

      // Match assignee names to employee IDs BEFORE saving
      const tasksWithIds = parsed.tasks.map((t: any) => {
        let assigneeId = null;
        if (t.assignee_name && employees) {
          const match = employees.find((e: any) => 
            e.name?.toLowerCase().includes(t.assignee_name.toLowerCase())
          );
          if (match) assigneeId = match.id;
        }
        return { ...t, assignee_id: assigneeId };
      });

      // Create directive record with matched assignee IDs in source_data
      const extractedWithIds = { ...parsed, tasks: tasksWithIds };
      const { data: directive, error: dirErr } = await supabase
        .from("directives")
        .insert({
          company_id,
          issued_by: user_id,
          title: parsed.directive_title,
          content: text,
          source_type,
          source_data: { raw_text: text, ai_extracted: extractedWithIds },
          kpi_targets: parsed.kpi_targets || {},
          status: "draft",
          deadline: parsed.tasks?.[0]?.deadline_days 
            ? new Date(Date.now() + Math.max(...parsed.tasks.map((t: any) => t.deadline_days || 7)) * 86400000).toISOString()
            : null,
        })
        .select()
        .single();

      if (dirErr) throw dirErr;

      return new Response(JSON.stringify({
        directive,
        tasks: tasksWithIds,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ======= ACTION: dispatch_directive =======
    if (action === "dispatch_directive") {
      const { directive_id, company_id, user_id } = params;

      const { data: directive, error: dErr } = await supabase
        .from("directives")
        .select("*")
        .eq("id", directive_id)
        .single();
      if (dErr || !directive) throw new Error("Directive not found");

      const tasks = directive.source_data?.ai_extracted?.tasks || [];

      // Find all employees with org_unit for lookups
      const { data: allEmployees } = await supabase
        .from("perf_employees")
        .select("id, name, user_id, org_unit_id")
        .eq("company_id", directive.company_id)
        .eq("is_active", true);

      const employeeMap = new Map((allEmployees || []).map((e: any) => [e.id, e]));

      // Get manager role employees
      const { data: managerMembers } = await supabase
        .from("company_members")
        .select("user_id")
        .eq("company_id", directive.company_id)
        .in("role", ["admin", "manager"]);

      const managerUserIds = new Set((managerMembers || []).map((m: any) => m.user_id));
      const managerEmployees = (allEmployees || []).filter((e: any) => managerUserIds.has(e.user_id));

      // Assign to first available manager or keep null
      const assignedManager = managerEmployees[0] || null;

      // Create tasks from extracted data with org_unit_id
      const createdTasks = [];
      for (const task of tasks) {
        const assigneeId = task.assignee_id && employeeMap.has(task.assignee_id) ? task.assignee_id : (assignedManager?.id || null);
        const assigneeEmp = assigneeId ? employeeMap.get(assigneeId) : null;
        const { data: newTask } = await supabase.from("tasks").insert({
          company_id: directive.company_id,
          assigned_by: user_id,
          assigned_to: assigneeId,
          org_unit_id: assigneeEmp?.org_unit_id || null,
          title: task.title,
          description: task.description || null,
          priority: task.priority || "normal",
          source_type: "directive",
          source_id: directive_id,
          directive_id: directive_id,
          due_date: task.deadline_days
            ? new Date(Date.now() + (task.deadline_days || 7) * 86400000).toISOString()
            : null,
        }).select().single();
        if (newTask) createdTasks.push(newTask);
      }

      // Update directive status
      await supabase.from("directives").update({
        status: "dispatched",
        assigned_manager_id: assignedManager?.id || null,
      }).eq("id", directive_id);

      // Send notification to assigned manager
      if (assignedManager?.user_id) {
        await supabase.from("rag_notifications").insert({
          user_id: assignedManager.user_id,
          company_id: directive.company_id,
          type: "directive",
          title: "Chá»‰ thá»‹ má»›i tá»« lÃ£nh Ä‘áº¡o",
          message: `Báº¡n nháº­n Ä‘Æ°á»£c chá»‰ thá»‹: "${directive.title}" vá»›i ${createdTasks.length} Ä‘áº§u viá»‡c`,
          data: { directive_id, task_count: createdTasks.length },
        });
      }

      return new Response(JSON.stringify({
        directive_id,
        assigned_manager: assignedManager,
        tasks_created: createdTasks.length,
        tasks: createdTasks,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ======= ACTION: breakdown_wbs =======
    if (action === "breakdown_wbs") {
      const { directive_id, company_id, suggestions } = params;

      const { data: directive } = await supabase
        .from("directives").select("*").eq("id", directive_id).single();
      if (!directive) throw new Error("Directive not found");

      // Get employees with workload
      const { data: employees } = await supabase
        .from("perf_employees")
        .select("id, name, title, user_id, org_unit_id")
        .eq("company_id", directive.company_id)
        .eq("is_active", true);

      const validEmployeeIds = new Set((employees || []).map((e: any) => e.id));
      const employeeOrgMap = new Map((employees || []).map((e: any) => [e.id, e.org_unit_id]));

      // Get current task counts for workload balancing
      const employeeIds = (employees || []).map((e: any) => e.id);
      const { data: taskCounts } = await supabase
        .from("tasks")
        .select("assigned_to")
        .in("assigned_to", employeeIds)
        .not("status", "in", '("done","cancelled")');

      const workloadMap = new Map<string, number>();
      (taskCounts || []).forEach((t: any) => {
        workloadMap.set(t.assigned_to, (workloadMap.get(t.assigned_to) || 0) + 1);
      });

      // Check bookings for conflicts
      const now = new Date().toISOString();
      const weekLater = new Date(Date.now() + 7 * 86400000).toISOString();
      const { data: bookings } = await supabase
        .from("bookings")
        .select("created_by, start_time, end_time")
        .eq("company_id", directive.company_id)
        .gte("start_time", now)
        .lte("start_time", weekLater);

      // AI breakdown with workload context
      if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const employeeInfo = (employees || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        title: e.title,
        current_tasks: workloadMap.get(e.id) || 0,
      }));

      const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Báº¡n lÃ  AI quáº£n lÃ½ dá»± Ã¡n. Chia nhá» má»¥c tiÃªu thÃ nh WBS (Work Breakdown Structure).\nNhÃ¢n viÃªn vÃ  workload: ${JSON.stringify(employeeInfo)}\nGá»£i Ã½ tá»« quáº£n lÃ½: ${suggestions || 'KhÃ´ng cÃ³'}\nPhÃ¢n cÃ´ng dá»±a trÃªn workload (Æ°u tiÃªn ngÆ°á»i Ã­t viá»‡c).`,
            },
            { role: "user", content: `Chia nhá» chá»‰ thá»‹: "${directive.title}"\nNá»™i dung: ${directive.content}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_wbs",
              description: "Táº¡o Work Breakdown Structure",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        assigned_employee_id: { type: "string" },
                        priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
                        deadline_days: { type: "number" },
                      },
                      required: ["title", "priority"],
                    },
                  },
                },
                required: ["tasks"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_wbs" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate limit exceeded");
        if (response.status === 402) throw new Error("Payment required");
        throw new Error("AI error");
      }

      const aiResult = await response.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      const wbs = toolCall ? JSON.parse(toolCall.function.arguments) : { tasks: [] };

      // Create tasks from WBS â€” validate employee IDs and set org_unit_id
      const createdTasks = [];
      for (const task of wbs.tasks) {
        const assigneeId = task.assigned_employee_id && validEmployeeIds.has(task.assigned_employee_id)
          ? task.assigned_employee_id : null;
        const { data: newTask } = await supabase.from("tasks").insert({
          company_id: directive.company_id,
          assigned_by: directive.issued_by,
          assigned_to: assigneeId,
          org_unit_id: assigneeId ? (employeeOrgMap.get(assigneeId) || null) : null,
          title: task.title,
          description: task.description || null,
          priority: task.priority || "normal",
          source_type: "directive",
          directive_id: directive_id,
          due_date: task.deadline_days
            ? new Date(Date.now() + task.deadline_days * 86400000).toISOString()
            : null,
        }).select().single();
        if (newTask) createdTasks.push(newTask);
      }

      await supabase.from("directives").update({ status: "in_progress" }).eq("id", directive_id);

      return new Response(JSON.stringify({
        tasks_created: createdTasks.length,
        tasks: createdTasks,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ======= ACTION: check_escalation =======
    if (action === "check_escalation") {
      const { company_id } = params;
      if (!company_id) throw new Error("Missing company_id");

      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();

      // Find directives not dispatched after 2h
      const { data: staleDirectives } = await supabase
        .from("directives")
        .select("id, title, issued_by, created_at, escalation_count")
        .eq("company_id", company_id)
        .eq("status", "draft")
        .lt("created_at", twoHoursAgo);

      // Find overdue tasks
      const now = new Date().toISOString();
      const { data: overdueTasks } = await supabase
        .from("tasks")
        .select("id, title, assigned_to, due_date, directive_id")
        .eq("company_id", company_id)
        .lt("due_date", now)
        .not("status", "in", '("done","cancelled")')
        .limit(50);

      const notifications = [];

      // Send reminders for stale directives
      for (const d of (staleDirectives || [])) {
        await supabase.from("rag_notifications").insert({
          user_id: d.issued_by,
          company_id,
          type: "escalation",
          title: "Nháº¯c nhá»Ÿ: Chá»‰ thá»‹ chÆ°a phÃ¢n phá»‘i",
          message: `Chá»‰ thá»‹ "${d.title}" Ä‘Ã£ táº¡o hÆ¡n 2 giá» nhÆ°ng chÆ°a Ä‘Æ°á»£c phÃ¢n phá»‘i`,
          data: { directive_id: d.id },
        });
        await supabase.from("directives").update({
          escalation_count: (d.escalation_count || 0) + 1,
        }).eq("id", d.id);
        notifications.push({ type: "stale_directive", id: d.id, title: d.title });
      }

      // Send alerts for overdue tasks
      for (const t of (overdueTasks || [])) {
        if (t.assigned_to) {
          const { data: emp } = await supabase
            .from("perf_employees")
            .select("user_id")
            .eq("id", t.assigned_to)
            .single();
          if (emp?.user_id) {
            await supabase.from("rag_notifications").insert({
              user_id: emp.user_id,
              company_id,
              type: "escalation",
              title: "CÃ´ng viá»‡c quÃ¡ háº¡n",
              message: `Task "${t.title}" Ä‘Ã£ quÃ¡ háº¡n!`,
              data: { task_id: t.id },
            });
          }
        }
        notifications.push({ type: "overdue_task", id: t.id, title: t.title });
      }

      return new Response(JSON.stringify({
        stale_directives: (staleDirectives || []).length,
        overdue_tasks: (overdueTasks || []).length,
        notifications,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-task-dispatcher error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});




