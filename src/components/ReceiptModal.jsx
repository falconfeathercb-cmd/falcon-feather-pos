import { Printer, X, ReceiptText } from "lucide-react";
import { openAndPrintA4Receipt } from "../lib/receipt";

function money(value) {
  return `LKR ${Number(value || 0).toFixed(2)}`;
}

export default function ReceiptModal({ sale, onClose }) {
  if (!sale) return null;

  const items = sale.items || sale.sale_items || [];
  const paid = Number(sale.amount_paid ?? sale.paid ?? sale.total ?? 0);
  const change = Number(sale.balance ?? sale.change ?? Math.max(0, paid - Number(sale.total || 0)));

  function print() {
    try {
      openAndPrintA4Receipt({ ...sale, items });
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="modalOverlay receiptOverlay" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="receiptModal">
        <div className="modalHeader">
          <div>
            <span className="eyebrow">Falcon Feather</span>
            <h2><ReceiptText size={20}/> Receipt {sale.receipt_number || ""}</h2>
            <p>{new Date(sale.created_at || Date.now()).toLocaleString()}</p>
          </div>
          <button className="iconBtn" onClick={onClose}><X size={20}/></button>
        </div>

        <div className="receiptMetaGrid">
          <div><span>Payment Method</span><strong>{sale.payment_method || "-"}</strong></div>
          <div><span>Items</span><strong>{items.reduce((a, x) => a + Number(x.quantity || x.qty || 0), 0)}</strong></div>
        </div>

        <div className="receiptItems">
          <table>
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {items.length ? items.map((item, index) => {
                const qty = Number(item.quantity || item.qty || 0);
                const price = Number(item.unit_price ?? item.selling_price ?? 0);
                return (
                  <tr key={item.id || item.product_id || index}>
                    <td>
                      <strong>{item.products?.name || item.name || "Product"}</strong>
                      <small className="receiptBarcode">{item.products?.barcode || item.barcode || ""}</small>
                    </td>
                    <td>{qty}</td>
                    <td>{money(price)}</td>
                    <td><strong>{money(item.line_total ?? qty * price)}</strong></td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="4">No item details are available for this sale.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="receiptTotals">
          <div><span>Total</span><strong>{money(sale.total)}</strong></div>
          <div><span>Amount Paid</span><strong>{money(paid)}</strong></div>
          <div className="receiptGrand"><span>Change</span><strong>{money(change)}</strong></div>
        </div>

        <div className="receiptActions">
          <button className="primaryBtn" onClick={print}><Printer size={17}/> Print A4 Receipt</button>
          <button className="secondaryBtn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
