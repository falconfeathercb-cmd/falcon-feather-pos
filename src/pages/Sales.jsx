import { useEffect, useState } from "react";
import { Eye, Printer, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";
import ReceiptModal from "../components/ReceiptModal";
import { openAndPrintA4Receipt } from "../lib/receipt";

export default function Sales(){
  const [rows,setRows]=useState([]);
  const [selected,setSelected]=useState(null);
  const [message,setMessage]=useState("");

  async function load(){
    setMessage("");
    const {data,error}=await supabase
      .from("sales")
      .select("*,sale_items(*,products(name,barcode,cost_price))")
      .order("created_at",{ascending:false})
      .limit(100);

    if(error){
      setMessage(error.message);
      setRows([]);
      return;
    }

    setRows(data||[]);
  }

  useEffect(()=>{load()},[]);

  function viewSale(sale){
    setSelected({...sale,items:sale.sale_items||[]});
  }

  function printSale(e,sale){
    e.stopPropagation();
    try{
      openAndPrintA4Receipt({...sale,items:sale.sale_items||[]});
    }catch(error){
      alert(error.message);
    }
  }

  return <div className="page">
    <div className="pageHeader">
      <div><h1>Sales History</h1><p>Click a receipt to view the full bill and print it again.</p></div>
      <button className="secondaryBtn" onClick={load}><RefreshCw size={16}/> Refresh</button>
    </div>

    {message && <div className="errorBanner">{message}</div>}

    <section className="panel">
      <div className="tableWrap">
        <table>
          <thead><tr><th>Receipt</th><th>Date & Time</th><th>Payment</th><th>Total</th><th>Paid</th><th>Change</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(s=><tr key={s.id} className="clickableSaleRow" onClick={()=>viewSale(s)}>
              <td className="mono"><strong>{s.receipt_number}</strong></td>
              <td>{new Date(s.created_at).toLocaleString()}</td>
              <td>{s.payment_method}</td>
              <td><strong>LKR {Number(s.total||0).toFixed(2)}</strong></td>
              <td>LKR {Number(s.amount_paid||0).toFixed(2)}</td>
              <td>LKR {Number(s.balance||0).toFixed(2)}</td>
              <td>
                <div className="saleActionButtons">
                  <button title="View bill" onClick={(e)=>{e.stopPropagation();viewSale(s)}}><Eye size={16}/></button>
                  <button title="Print A4" onClick={(e)=>printSale(e,s)}><Printer size={16}/></button>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>

    <ReceiptModal sale={selected} onClose={()=>setSelected(null)}/>
  </div>
}
