import { useEffect,useState } from "react";
import { supabase } from "../lib/supabase";
export default function Inventory(){
  const [rows,setRows]=useState([]);
  async function load(){const {data}=await supabase.from("products").select("*,categories(name)").order("stock_quantity");setRows(data||[])}
  useEffect(()=>{load()},[]);
  return <div className="page"><div className="pageHeader"><div><h1>Inventory</h1><p>Live stock availability across the store.</p></div><button className="secondaryBtn" onClick={load}>Refresh</button></div>
  <section className="panel"><div className="tableWrap"><table><thead><tr><th>Barcode</th><th>Product</th><th>Category</th><th>On Hand</th><th>Reorder Point</th><th>Status</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td className="mono">{p.barcode}</td><td><strong>{p.name}</strong></td><td>{p.categories?.name||"-"}</td><td>{p.stock_quantity}</td><td>{p.reorder_level}</td><td><span className={`pill ${p.stock_quantity===0?"red":p.stock_quantity<=p.reorder_level?"amber":"green"}`}>{p.stock_quantity===0?"Out":p.stock_quantity<=p.reorder_level?"Low":"Healthy"}</span></td></tr>)}</tbody></table></div></section></div>
}
