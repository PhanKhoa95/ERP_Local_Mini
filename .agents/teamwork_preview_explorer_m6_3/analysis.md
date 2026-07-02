# Analysis of Dialogs, Printing, and Barcode Scanning in Milestone 6

## Executive Summary
This analysis details the technical implementation of dialog modals, print triggering mechanisms (specifically K80/Pancake POS invoice layouts), and barcode/QR scanning simulation and search functionality within the ERP Local Mini project. 

---

## 1. Dialogs and Modals Implementation

### Core Component Structure
Dialogs in the codebase are built using **Radix UI Dialog primitives** configured with Tailwind CSS classes via Shadcn's layout patterns. The main dialog components are located at:
*   `src/components/ui/dialog.tsx`
*   `src/components/ui/alert-dialog.tsx`

The `src/components/ui/dialog.tsx` file exports the following standard components:
*   `Dialog` (maps to `DialogPrimitive.Root`)
*   `DialogTrigger` (triggers the open state)
*   `DialogContent` (handles layout positioning, overlays, and animations)
*   `DialogHeader`, `DialogTitle`, `DialogDescription` (semantic structure)
*   `DialogFooter` (actions layout, handles button alignments)
*   `DialogClose` (explicit close action)

### Workflow Dialogs
Dialogs are heavily utilized to manage complex packing workflows and stock transactions. Key implementations include:

1.  **Picking & Packing Dialogs (`src/components/inventory/PickingPackingTab.tsx`)**:
    *   **Create Dialog (`createDialogOpen`)**: Houses a split forms grid for warehouse selection, picker assignment, and notes, accompanied by a dynamic table of products added to the list. Implements responsive constraints (`max-w-2xl max-h-[90vh] overflow-y-auto`).
    *   **Detail Dialog (`detailDialogOpen`)**: Displays metadata, workflow progression actions, and a table of picking items (`ItemRow` subcomponents) to check off picked quantities.
2.  **OrderDetail Dialog (`src/components/orders/OrderDetailDialog.tsx`)**:
    *   Integrates multiple actions (editing, printing, status changes) inside a slide-in or modal container.
3.  **Stock Transaction Dialog (`src/components/inventory/StockTransactionDialog.tsx`)**:
    *   Utilizes a modal format containing dynamic inputs, autocomplete selectors, and calculations for converting UOMs.

---

## 2. K80 Invoice Printing Workflow

The project uses standard web APIs to print receipts without depending on third-party print packages (e.g. `react-to-print`). 

### Implementation Approaches

The codebase employs two distinct implementations of the print feature:

#### Method A: String Template Literal (`src/components/orders/OrderDetailDialog.tsx`)
In `OrderDetailDialog.tsx`, clicking the print button (or pressing **F4** as a keyboard shortcut) invokes `handlePrint()`.
1.  **Window Creation**: Opens a blank tab using `window.open("", "_blank")`.
2.  **HTML Generation**: Concatenates order items into rows and embeds them in a full HTML string template.
3.  **Print Styling**: Embeds specific CSS target styling matching the **K80 receipt width** (max width `320px` to fit 80mm thermal paper):
    ```css
    body { 
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
      font-size: 12px; 
      line-height: 1.4; 
      color: #333; 
      padding: 10px; 
      max-width: 320px; 
      margin: 0 auto; 
    }
    @media print {
      body { max-width: 100%; padding: 0; margin: 0; }
      @page { size: auto; margin: 0mm; }
    }
    ```
4.  **Triggering Print**: Writes to the document, closes the write stream, and triggers the print dialog after a brief timeout:
    ```typescript
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    ```

#### Method B: Hidden DOM Clone (`src/components/orders/PrintInvoice.tsx`)
`PrintInvoice.tsx` renders a hidden React print layout (`display: "none"`) referencing a React `useRef` hook (`printRef`).
1.  **Rendering**: The content is pre-rendered by React and hidden from the standard viewport.
2.  **Duplication**: When print is clicked, it grabs the inner HTML of the target reference (`printRef.current.innerHTML`).
3.  **Injection**: Opens a blank window, injects the copied HTML and styles, and executes `printWindow.print()` synchronously.

---

## 3. Barcode Scan Simulation & Search Functionality

Barcode scanning in the project serves two main use cases: VIP membership cards and rapid inventory/sales item matching.

### 1. VIP Membership QR/Barcode Simulation (`src/pages/POS.tsx`)
In the Point of Sale interface, scanning a VIP membership card is simulated programmatically:
*   **Trigger**: Clicking the "Giả lập Quét VIP" button triggers `handleSimulateQRScan()`.
*   **Behavior**: It searches the local customer list (`customers`) for a member classified under a specific promo segment (`loyalty` or `wholesale`).
*   **Result**: If found, it updates `selectedCustomer` state, updates the warehouse to the customer's default warehouse if configured, and shows a success toast: `"📡 Quét thẻ thành viên thành công"`.

### 2. Product Barcode / SKU Search Input
Physical barcode scanners mimic keyboard input, typing the barcode value rapidly followed by a carriage return (`Enter` or `Tab`). The project accommodates this via local input searching:
*   **POS Input (`#pos-product-search`)**: Users press `F3` to focus the search box. Typing/scanning a value filters `products` by matching `name` or `sku`.
*   **Stock Transaction Input (`StockTransactionDialog.tsx`)**: In the stock transaction rows, the product autocomplete input allows keyboard/scanner input:
    ```typescript
    const filteredProducts = products.filter(p => {
      const q = item.search_query.trim().toLowerCase();
      if (!q || item.product_id) return true;
      const barcode = (p as any).barcode || "";
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        barcode.toLowerCase().includes(q)
      );
    }).slice(0, 10);
    ```
    If a barcode matches, the user can press Enter/click to select the item.

### 3. Autocomplete Unit Tests
The local filtering functionality is covered by automated unit tests in `src/lib/__tests__/autocompleteStockSearch.test.ts`. This test verifies:
1.  Case-insensitive filtering by product names.
2.  Exact and partial matching by SKU.
3.  Exact and partial matching by product barcodes (e.g. matching `8931234567890` or `00000`).
4.  Correct handling when no product matches are found.
