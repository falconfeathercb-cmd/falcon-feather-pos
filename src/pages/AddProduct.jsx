import { useEffect,useState,useRef } from "react";
import { supabase } from "../lib/supabase";
import JsBarcode from "jsbarcode";

export default function AddProduct(){
  const [cats,setCats]=useState([]),[saved,setSaved]=useState(null),[msg,setMsg]=useState("");
  const [form,setForm]=useState({name:"",category_id:"",barcode:"",cost_price:"",selling_price:"",stock_quantity:"0",reorder_level:"10",description:""});
  const barcodeRef=useRef(null);
  useEffect(()=>{supabase.from("categories").select("*").order("name").then(({data})=>setCats(data||[]))},[]);
  useEffect(()=>{if(saved?.barcode&&barcodeRef.current)JsBarcode(barcodeRef.current,saved.barcode,{format:"CODE128",height:55,fontSize:12})},[saved]);
  function c(e){setForm({...form,[e.target.name]:e.target.value})}
  async function save(e){
    e.preventDefault();setMsg("");
    const {data,error}=await supabase.from("products").insert({
      name:form.name,category_id:form.category_id||null,barcode:form.barcode||null,barcode_type:form.barcode?"MANUFACTURER":"INTERNAL",
      cost_price:Number(form.cost_price||0),selling_price:Number(form.selling_price||0),stock_quantity:Number(form.stock_quantity||0),
      reorder_level:Number(form.reorder_level||10),description:form.description||null,is_active:true
    }).select().single();
    if(error){setMsg(error.message);return}
    setSaved(data);setMsg("Product saved successfully.");
  }
  return <div className="page">
    <div className="pageHeader"><div><h1>Add Product</h1><p>Create a new stock item and barcode.</p></div></div>
    {msg&&<div className="successBanner">{msg}</div>}
    <div className="formLayout">
      <form className="panel formPanel" onSubmit={save}>
        <div className="sectionTitle"><h2>Product Information</h2><p>Basic details for this item.</p></div>
        <div className="formGrid">
          <label className="full">Product Name<input name="name" value={form.name} onChange={c} required/></label>
          <label>Category<select name="category_id" value={form.category_id} onChange={c}><option value="">Select category</option>{cats.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Existing Barcode<input name="barcode" value={form.barcode} onChange={c} placeholder="Leave blank to auto-generate"/></label>
          <label>Cost Price<input name="cost_price" type="number" step=".01" value={form.cost_price} onChange={c}/></label>
          <label>Selling Price<input name="selling_price" type="number" step=".01" value={form.selling_price} onChange={c} required/></label>
          <label>Opening Stock<input name="stock_quantity" type="number" value={form.stock_quantity} onChange={c}/></label>
          <label>Reorder Level<input name="reorder_level" type="number" value={form.reorder_level} onChange={c}/></label>
          <label className="full">Description<textarea name="description" rows="4" value={form.description} onChange={c}/></label>
        </div>
        <button className="primaryBtn">Save Product</button>
      </form>
      <aside className="panel barcodePreview">
        <div className="sectionTitle"><h2>Barcode Label</h2><p>Generated after saving.</p></div>
        {saved?<div className="barcodeSheet"><strong>{saved.name}</strong><span>LKR {Number(saved.selling_price).toFixed(2)}</span><svg ref={barcodeRef}/><small>{saved.barcode_type}</small></div>:<div className="emptyPreview">No barcode generated yet.</div>}
      </aside>
    </div>
  </div>
}
