import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, Kanban, CalendarDays, AlertTriangle, CheckSquare, UsersRound, Link2 } from "lucide-react";
import { useCRM } from "@/hooks/useCRM";
import { CRMOverview } from "@/components/crm/CRMOverview";
import { LeadsTab } from "@/components/crm/LeadsTab";
import { DealsKanban } from "@/components/crm/DealsKanban";
import { AppointmentsTab } from "@/components/crm/AppointmentsTab";
import { TicketsTab } from "@/components/crm/TicketsTab";
import { TasksTab } from "@/components/crm/TasksTab";
import { ContactsCompaniesTab } from "@/components/crm/ContactsCompaniesTab";
import { IntegrationsTab } from "@/components/crm/IntegrationsTab";

export default function CRM() {
  const {
    leads,
    createLead,
    updateLeadStatus,
    convertLeadToPartner,
    
    deals,
    createDeal,
    updateDealStage,
    
    appointments,
    createAppointment,
    updateAppointmentStatus,
    
    tickets,
    createTicket,
    updateTicketStatus,
    
    tasks,
    createTask,
    toggleTaskStatus,

    // Advanced features
    companies,
    createCompany,
    contacts,
    createContact,
    customFields,
    createCustomField,
    customFieldValues,
    saveCustomFieldValues,
    apiKeys,
    createApiKey,
    deleteApiKey,
    simulateWebhookIngest,

    // Integration settings
    posChatSettings,
    updatePosChatSettings,
    leadForms,
    createLeadForm,
    updateLeadFormMappings,
    automationRules,
    createAutomationRule,
    toggleAutomationRule
  } = useCRM();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6.5 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-1 pb-3 border-b">
        <h1 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          🎯 Phân hệ Pancake CRM
        </h1>
        <p className="text-xs text-muted-foreground">
          Quản lý quan hệ khách hàng toàn diện: từ tiếp cận tiềm năng, phễu cơ hội đến lịch hẹn gặp và bảo hành sau bán hàng.
        </p>
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        {/* Navigation list */}
        <div className="border-b">
          <TabsList className="bg-transparent h-10 p-0 gap-4 md:gap-6 border-none overflow-x-auto w-full justify-start">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 pb-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground bg-transparent gap-2"
            >
              <LayoutDashboard className="h-4 w-4 text-indigo-500" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value="leads"
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 pb-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground bg-transparent gap-2"
            >
              <Users className="h-4 w-4 text-blue-500" />
              Khách tiềm năng
            </TabsTrigger>
            <TabsTrigger
              value="contacts_companies"
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 pb-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground bg-transparent gap-2"
            >
              <UsersRound className="h-4 w-4 text-pink-500" />
              Liên hệ & Công ty
            </TabsTrigger>
            <TabsTrigger
              value="deals"
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 pb-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground bg-transparent gap-2"
            >
              <Kanban className="h-4 w-4 text-amber-500" />
              Phễu cơ hội (Deals)
            </TabsTrigger>
            <TabsTrigger
              value="appointments"
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 pb-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground bg-transparent gap-2"
            >
              <CalendarDays className="h-4 w-4 text-emerald-500" />
              Lịch hẹn & CSKH
            </TabsTrigger>
            <TabsTrigger
              value="tickets"
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 pb-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground bg-transparent gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Bảo hành & Sự cố
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 pb-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground bg-transparent gap-2"
            >
              <CheckSquare className="h-4 w-4 text-purple-500" />
              Nhiệm vụ
            </TabsTrigger>
            <TabsTrigger
              value="webhook_api"
              className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 pb-2 text-xs font-bold text-muted-foreground data-[state=active]:text-foreground bg-transparent gap-2"
            >
              <Link2 className="h-4 w-4 text-emerald-500" />
              Tích hợp & Tự động hóa
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="overview">
          <CRMOverview
            leads={leads}
            deals={deals}
            appointments={appointments}
            tickets={tickets}
            tasks={tasks}
            contacts={contacts}
            companies={companies}
          />
        </TabsContent>

        <TabsContent value="leads">
          <LeadsTab
            leads={leads}
            createLead={createLead}
            updateLeadStatus={updateLeadStatus}
            convertLeadToPartner={convertLeadToPartner}
            customFields={customFields}
            customFieldValues={customFieldValues}
            saveCustomFieldValues={saveCustomFieldValues}
            createCustomField={createCustomField}
          />
        </TabsContent>

        <TabsContent value="contacts_companies">
          <ContactsCompaniesTab
            contacts={contacts}
            companies={companies}
            createContact={createContact}
            createCompany={createCompany}
            mergeContacts={mergeContacts}
            appointments={appointments}
            deals={deals}
            tickets={tickets}
            tasks={tasks}
            createAppointment={createAppointment}
            createDeal={createDeal}
            createTicket={createTicket}
            createTask={createTask}
          />
        </TabsContent>

        <TabsContent value="deals">
          <DealsKanban
            deals={deals}
            createDeal={createDeal}
            updateDealStage={updateDealStage}
          />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsTab
            appointments={appointments}
            createAppointment={createAppointment}
            updateAppointmentStatus={updateAppointmentStatus}
          />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsTab
            tickets={tickets}
            createTicket={createTicket}
            updateTicketStatus={updateTicketStatus}
          />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab
            tasks={tasks}
            createTask={createTask}
            toggleTaskStatus={toggleTaskStatus}
          />
        </TabsContent>

        <TabsContent value="webhook_api">
          <IntegrationsTab
            apiKeys={apiKeys}
            createApiKey={createApiKey}
            deleteApiKey={deleteApiKey}
            simulateWebhookIngest={simulateWebhookIngest}
            posChatSettings={posChatSettings}
            updatePosChatSettings={updatePosChatSettings}
            leadForms={leadForms}
            createLeadForm={createLeadForm}
            updateLeadFormMappings={updateLeadFormMappings}
            automationRules={automationRules}
            createAutomationRule={createAutomationRule}
            toggleAutomationRule={toggleAutomationRule}
            createLead={createLead}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
