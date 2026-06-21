import { QueryClient } from "@tanstack/react-query";

/** Invalidate all query keys affected when orders change */
export function invalidateOrderRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["orders"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
  queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
  queryClient.invalidateQueries({ queryKey: ["journal_lines"] });
  queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
  queryClient.invalidateQueries({ queryKey: ["today-completed-tasks"] });
  queryClient.invalidateQueries({ queryKey: ["payment-transactions"] });
  queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
}

/** Invalidate all query keys affected when partners change */
export function invalidatePartnerRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["partners"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
}

/** Invalidate all query keys affected when products change */
export function invalidateProductRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["products"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
}

/** Invalidate all query keys affected when accounting entries change */
export function invalidateAccountingRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
  queryClient.invalidateQueries({ queryKey: ["journal_lines"] });
  queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
}

/** Invalidate all query keys affected when warehouse/stock changes */
export function invalidateWarehouseRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["warehouse-stock"] });
  queryClient.invalidateQueries({ queryKey: ["warehouse-stock-full"] });
  queryClient.invalidateQueries({ queryKey: ["products"] });
  queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
}

/** Invalidate all query keys affected when payment transactions change */
export function invalidatePaymentRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["payment-transactions"] });
  queryClient.invalidateQueries({ queryKey: ["debt-summary"] });
  queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  queryClient.invalidateQueries({ queryKey: ["orders"] });
  queryClient.invalidateQueries({ queryKey: ["partners"] });
  queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
  queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
}

/** Invalidate keys affected when contracts change (sign, milestone payment) */
export function invalidateContractRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["smart-contracts"] });
  queryClient.invalidateQueries({ queryKey: ["contract-milestones"] });
  queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
  queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
  queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  queryClient.invalidateQueries({ queryKey: ["payment-transactions"] });
}

/** Invalidate keys affected when bookings change (service revenue) */
export function invalidateBookingRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["bookings"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
  queryClient.invalidateQueries({ queryKey: ["payment-transactions"] });
}

/** Invalidate keys when production orders complete */
export function invalidateProductionRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["production-orders"] });
  queryClient.invalidateQueries({ queryKey: ["warehouse-stock"] });
  queryClient.invalidateQueries({ queryKey: ["warehouse-stock-full"] });
  queryClient.invalidateQueries({ queryKey: ["products"] });
  queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
}

/** Invalidate keys when sales agent leads/conversations change */
export function invalidateSalesAgentRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["sales-leads"] });
  queryClient.invalidateQueries({ queryKey: ["sales-conversations"] });
  queryClient.invalidateQueries({ queryKey: ["sales-messages"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
}
