import { useEffect,useState } from "react";
import { supabase } from "../lib/supabase";
export default function Alerts(){
  const [rows,setRows]=useState([]);
  async function load(){const {data}=await supabase.from("inventory_alerts").select("*,products(name,barcode)").eq("is_resolved",false).order("created_at",{ascending:false});setRows(data||[])}
  useEffect(()=>{load()},[]);
  return <div className="page"><div className="pageHeader"><div><h1>Stock Alerts</h1><p>Products requiring replenishment.</p></div><button className="secondaryBtn" onClick={load}>Refresh</button></div>
  <section className="panel"><div className="tableWrap"><table><thead><tr><th>Product</th><th>Barcode</th><th>Alert</th><th>Current Stock</th><th>Message</th></tr></thead><tbody>{rows.map(a=><tr key={a.id}><td><strong>{a.products?.name}</strong></td><td className="mono">{a.products?.barcode}</td><td><span className={`pill ${a.alert_type==="OUT_OF_STOCK"?"red":"amber"}`}>{a.alert_type}</span></td><td>{a.stock_quantity}</td><td>{a.message}</td></tr>)}</tbody></table></div></section></div>
}
