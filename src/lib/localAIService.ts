/**
 * Mock local AI service function execution for local demo mode.
 */
export async function handleLocalFunctionInvoke(functionName: string, options?: any): Promise<any> {
  console.log(`[localAIService] Invoking local AI function "${functionName}" with options:`, options);

  // Return simulated data depending on the function invoked
  switch (functionName) {
    case "parse-receipt":
    case "parse-orders":
      return {
        data: {
          text: "Simulated AI response for order parsing",
          status: "success",
          orders: [
            {
              customerName: "John Doe",
              sku: "MOCK-SKU-1",
              quantity: 2,
              price: 150000,
              rawText: options?.body?.text || "Mock order data",
            }
          ]
        }
      };
    
    case "resolve-sku":
      return {
        data: {
          text: "Simulated AI response for SKU resolution",
          status: "success",
          resolvedSku: "MOCK-SKU-RESOLVED",
          confidence: 0.95
        }
      };

    case "resolve-identities":
      return {
        data: {
          text: "Simulated AI response for identity resolution",
          status: "success",
          matches: []
        }
      };

    default:
      return {
        data: {
          text: "Simulated AI response",
          status: "success",
          details: `Mock execution for function: ${functionName}`
        }
      };
  }
}
