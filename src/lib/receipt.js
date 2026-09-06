function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function money(value) {
  return `LKR ${Number(value || 0).toFixed(2)}`;
}

export function buildA4ReceiptHtml(receipt) {
  const items = receipt.items || [];
  const rows = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <strong>${esc(item.name || item.products?.name || "Product")}</strong>
        <div class="muted">${esc(item.barcode || item.products?.barcode || "")}</div>
      </td>
      <td class="num">${Number(item.quantity || item.qty || 0)}</td>
      <td class="num">${money(item.unit_price ?? item.selling_price)}</td>
      <td class="num">${money(
        item.line_total ??
        Number(item.quantity || item.qty || 0) * Number(item.unit_price ?? item.selling_price ?? 0)
      )}</td>
    </tr>
  `).join("");

  const paid = Number(receipt.amount_paid ?? receipt.paid ?? receipt.total ?? 0);
  const total = Number(receipt.total || 0);
  const balance = Number(receipt.balance ?? receipt.change ?? Math.max(0, paid - total));

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(receipt.receipt_number || "Receipt")}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #111827;
      background: white;
      font-size: 12px;
    }
    .sheet { width: 100%; min-height: 270mm; padding: 2mm; }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      border-bottom: 2px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand h1 { margin: 0 0 4px; font-size: 24px; }
    .brand p, .meta p { margin: 2px 0; color: #4b5563; }
    .meta { text-align: right; }
    .meta strong { color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th {
      background: #f3f4f6;
      text-align: left;
      border: 1px solid #d1d5db;
      padding: 8px;
    }
    td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
    .num { text-align: right; white-space: nowrap; }
    .muted { color: #6b7280; font-size: 10px; margin-top: 3px; }
    .summary {
      width: 330px;
      margin-left: auto;
      margin-top: 16px;
    }
    .summary .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .summary .total {
      font-size: 17px;
      font-weight: 700;
      border-top: 2px solid #111827;
      border-bottom: 0;
      margin-top: 4px;
      padding-top: 10px;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #d1d5db;
      padding-top: 12px;
      text-align: center;
      color: #6b7280;
    }
    @media print {
      .sheet { min-height: auto; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <h1>Falcon Feather</h1>
        <p>Book House &amp; Communication</p>
        <p>Main Store · Register 01</p>
      </div>
      <div class="meta">
        <p><strong>RECEIPT / INVOICE</strong></p>
        <p>Receipt: ${esc(receipt.receipt_number || receipt.id || "-")}</p>
        <p>Date: ${esc(new Date(receipt.created_at || Date.now()).toLocaleString())}</p>
        <p>Payment: ${esc(receipt.payment_method || "CASH")}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:42px">#</th>
          <th>Item</th>
          <th class="num" style="width:70px">Qty</th>
          <th class="num" style="width:110px">Unit Price</th>
          <th class="num" style="width:120px">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="5">No item details available.</td></tr>`}
      </tbody>
    </table>

    <div class="summary">
      <div class="row"><span>Subtotal</span><strong>${money(receipt.subtotal ?? total)}</strong></div>
      <div class="row"><span>Discount</span><strong>${money(receipt.discount ?? 0)}</strong></div>
      <div class="row total"><span>Total</span><strong>${money(total)}</strong></div>
      <div class="row"><span>Amount Paid</span><strong>${money(paid)}</strong></div>
      <div class="row"><span>Change</span><strong>${money(balance)}</strong></div>
    </div>

    <div class="footer">
      <strong>Thank you for shopping at Falcon Feather.</strong>
      <p>This A4 receipt can be printed using Epson, Canon, HP or any printer configured on this computer.</p>
    </div>
  </div>
</body>
</html>`;
}

export function openAndPrintA4Receipt(receipt, existingWindow = null) {
  const popup = existingWindow || window.open("", "_blank", "width=900,height=1100");
  if (!popup) {
    throw new Error("The print window was blocked by the browser. Please allow pop-ups and try again.");
  }

  popup.document.open();
  popup.document.write(buildA4ReceiptHtml(receipt));
  popup.document.close();
  popup.focus();

  window.setTimeout(() => {
    popup.print();
  }, 350);

  return popup;
}
