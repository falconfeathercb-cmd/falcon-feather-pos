import { useEffect,useState } from "react";
import { supabase } from "../lib/supabase";
export default function StockIn(){
  const [products,setProducts]=useState([]),[product,setProduct]=useState(""),[qty,setQty]=useState(1),[note,setNote]=useState(""),[msg,setMsg]=useState("");
  async function load(){const {data}=await supabase.from("products").select("id,name,barcode,stock_quantity").order("name");setProducts(data||[])}
  useEffect(()=>{load()},[]);
  async function submit(e){e.preventDefault();const {error}=await supabase.rpc("add_stock",{p_product_id:product,p_quantity:Number(qty),p_note:note||"Stock received"});setMsg(error?error.message:"Stock received successfully.");if(!error)load()}
  return <div className="page"><div className="pageHeader"><div><h1>Stock Receiving</h1><p>Add supplier deliveries to inventory.</p></div></div>
  {msg&&<div className={msg.includes("successfully")?"successBanner":"errorBanner"}>{msg}</div>}
  <form className="panel compactForm" onSubmit={submit}><label>Product<select value={product} onChange={e=>setProduct(e.target.value)} required><option value="">Choose product...</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.barcode} · Current {p.stock_quantity}</option>)}</select></label><label>Quantity<input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)}/></label><label>Reference / Note<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Invoice, supplier or note"/></label><button className="primaryBtn">Receive Stock</button></form></div>
}
