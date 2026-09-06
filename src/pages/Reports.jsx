import { useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCw, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../lib/supabase";

const money = (v) => `LKR ${Number(v || 0).toFixed(2)}`;

function localRange(mode, month, year) {
  if (mode === "monthly") {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 1, 0, 0, 0, 0);
    return { start, end, label: start.toLocaleDateString(undefined, { month: "long", year: "numeric" }) };
  }
  const y = Number(year);
  return {
    start: new Date(y, 0, 1, 0, 0, 0, 0),
    end: new Date(y + 1, 0, 1, 0, 0, 0, 0),
    label: String(y)
  };
}

export default function Reports() {
  const now = new Date();
  const [mode, setMode] = useState("monthly");
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const range = useMemo(() => localRange(mode, month, year), [mode, month, year]);

  async function load() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("sales")
      .select("*,sale_items(*,products(name,barcode,cost_price))")
      .gte("created_at", range.start.toISOString())
      .lt("created_at", range.end.toISOString())
      .order("created_at", { ascending: true });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      setSales([]);
      return;
    }

    setSales(data || []);
  }

  useEffect(() => { load(); }, [mode, month, year]);

  const summary = useMemo(() => {
    let revenue = 0;
    let cogs = 0;
    let itemCount = 0;

    sales.forEach((sale) => {
      revenue += Number(sale.total || 0);
      (sale.sale_items || []).forEach((item) => {
        const qty = Number(item.quantity || 0);
        itemCount += qty;
        const itemCost = Number(item.cost_price ?? item.products?.cost_price ?? 0);
        cogs += qty * itemCost;
      });
    });

    const profit = revenue - cogs;
    return {
      revenue,
      cogs,
      profit,
      loss: Math.max(0, -profit),
      transactions: sales.length,
      itemCount
    };
  }, [sales]);

  const rows = useMemo(() => {
    const groups = new Map();

    sales.forEach((sale) => {
      const d = new Date(sale.created_at);
      const key = mode === "monthly"
        ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
        : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

      if (!groups.has(key)) groups.set(key, { key, revenue: 0, cogs: 0, transactions: 0 });

      const g = groups.get(key);
      g.revenue += Number(sale.total || 0);
      g.transactions += 1;
      (sale.sale_items || []).forEach((item) => {
        g.cogs += Number(item.quantity || 0) * Number(item.cost_price ?? item.products?.cost_price ?? 0);
      });
    });

    return Array.from(groups.values()).map((g) => ({
      ...g,
      profit: g.revenue - g.cogs
    }));
  }, [sales, mode]);

  function downloadCsv() {
    const lines = [
      ["Falcon Feather Profit & Loss Report"],
      ["Period", range.label],
      [],
      ["Revenue", summary.revenue.toFixed(2)],
      ["Cost of Goods Sold", summary.cogs.toFixed(2)],
      ["Net Profit / Loss", summary.profit.toFixed(2)],
      ["Transactions", summary.transactions],
      [],
      [mode === "monthly" ? "Date" : "Month", "Transactions", "Revenue", "COGS", "Profit/Loss"],
      ...rows.map(r => [r.key, r.transactions, r.revenue.toFixed(2), r.cogs.toFixed(2), r.profit.toFixed(2)])
    ];

    const csv = lines.map(row => row.map(cell => `"${String(cell ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `falcon-feather-${mode}-profit-loss-${range.label.replaceAll(" ","-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFontSize(18);
    doc.text("Falcon Feather", 14, 18);
    doc.setFontSize(11);
    doc.text("Profit & Loss Report", 14, 25);
    doc.text(`Period: ${range.label}`, 14, 31);

    autoTable(doc, {
      startY: 38,
      head: [["Summary", "Amount"]],
      body: [
        ["Revenue", money(summary.revenue)],
        ["Cost of Goods Sold", money(summary.cogs)],
        ["Net Profit / Loss", money(summary.profit)],
        ["Transactions", String(summary.transactions)],
        ["Items Sold", String(summary.itemCount)]
      ]
    });

    const y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : 82;
    autoTable(doc, {
      startY: y,
      head: [[mode === "monthly" ? "Date" : "Month", "Transactions", "Revenue", "COGS", "Profit/Loss"]],
      body: rows.map(r => [
        r.key,
        String(r.transactions),
        money(r.revenue),
        money(r.cogs),
        money(r.profit)
      ])
    });

    doc.save(`falcon-feather-${mode}-profit-loss-${range.label.replaceAll(" ","-")}.pdf`);
  }

  return (
    <div className="page">
      <div className="pageHeader reportsHeader">
        <div>
          <h1>Profit & Loss Reports</h1>
          <p>View and download monthly or yearly financial performance.</p>
        </div>
        <button className="secondaryBtn" onClick={load} disabled={loading}>
          <RefreshCw size={16}/>{loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <section className="panel reportControls">
        <div className="reportMode">
          <button className={mode === "monthly" ? "active" : ""} onClick={() => setMode("monthly")}>Monthly Report</button>
          <button className={mode === "yearly" ? "active" : ""} onClick={() => setMode("yearly")}>Yearly Report</button>
        </div>

        <div className="reportDateControl">
          {mode === "monthly" ? (
            <label>Month<input type="month" value={month} onChange={(e) => setMonth(e.target.value)}/></label>
          ) : (
            <label>Year<input type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(e.target.value)}/></label>
          )}
        </div>

        <div className="reportDownloads">
          <button className="secondaryBtn" onClick={downloadCsv}><Download size={16}/> Download CSV</button>
          <button className="primaryBtn" onClick={downloadPdf}><FileText size={16}/> Download PDF</button>
        </div>
      </section>

      {message && <div className="errorBanner">{message}</div>}

      <div className="reportStats">
        <div className="reportStat"><div className="reportStatIcon"><WalletCards size={20}/></div><div><span>Revenue</span><strong>{money(summary.revenue)}</strong><small>{summary.transactions} transactions</small></div></div>
        <div className="reportStat"><div className="reportStatIcon"><TrendingDown size={20}/></div><div><span>Cost of Goods Sold</span><strong>{money(summary.cogs)}</strong><small>Based on product cost prices</small></div></div>
        <div className={`reportStat ${summary.profit < 0 ? "lossCard" : "profitCard"}`}><div className="reportStatIcon"><TrendingUp size={20}/></div><div><span>Net Profit / Loss</span><strong>{money(summary.profit)}</strong><small>{summary.profit >= 0 ? "Profit" : `Loss ${money(summary.loss)}`}</small></div></div>
      </div>

      <section className="panel reportTablePanel">
        <div className="panelHeader">
          <div><h2>{range.label}</h2><p>{mode === "monthly" ? "Daily" : "Monthly"} financial breakdown.</p></div>
        </div>
        <div className="tableWrap">
          <table>
            <thead><tr><th>{mode === "monthly" ? "Date" : "Month"}</th><th>Transactions</th><th>Revenue</th><th>COGS</th><th>Profit / Loss</th></tr></thead>
            <tbody>
              {rows.length ? rows.map(r => (
                <tr key={r.key}>
                  <td><strong>{r.key}</strong></td>
                  <td>{r.transactions}</td>
                  <td>{money(r.revenue)}</td>
                  <td>{money(r.cogs)}</td>
                  <td><strong className={r.profit < 0 ? "negativeMoney" : "positiveMoney"}>{money(r.profit)}</strong></td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="emptyTableCell">No sales found for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="reportFootnote">
        Profit = Sales Revenue − Cost of Goods Sold. Product cost prices must be maintained accurately for reliable profit/loss results.
      </div>
    </div>
  );
}
