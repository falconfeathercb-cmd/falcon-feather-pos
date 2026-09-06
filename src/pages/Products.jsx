import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, X, Package, Boxes, Pencil, Truck, Save, RotateCcw, Barcode as BarcodeIcon } from "lucide-react";
import JsBarcode from "jsbarcode";
import { supabase } from "../lib/supabase";

export default function Products(){
  const [rows,setRows]=useState([]);
  const [categories,setCategories]=useState([]);
  const [q,setQ]=useState("");
  const [selected,setSelected]=useState(null);
  const [editing,setEditing]=useState(false);
  const [editForm,setEditForm]=useState(null);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const barcodeRef=useRef(null);

  async function load(){
    const [{data:products},{data:cats}]=await Promise.all([
      supabase.from("products").select("*,categories(name)").order("name"),
      supabase.from("categories").select("*").order("name")
    ]);
    setRows(products||[]); setCategories(cats||[]);
    if(selected){ const fresh=(products||[]).find(x=>x.id===selected.id); if(fresh)setSelected(fresh); }
  }

  useEffect(()=>{load()},[]);
  useEffect(()=>{
    if(selected?.barcode && barcodeRef.current && !editing){
      try{ JsBarcode(barcodeRef.current,selected.barcode,{format:"CODE128",width:1.7,height:52,fontSize:12,margin:7}); }catch{}
    }
  },[selected,editing]);

  function openProduct(p){ setSelected(p); setEditing(false); setMessage(""); }
  function startEdit(){
    setEditForm({
      name:selected.name||"", category_id:selected.category_id||"", barcode:selected.barcode||"",
      barcode_type:selected.barcode_type||"INTERNAL", cost_price:selected.cost_price??0,
      selling_price:selected.selling_price??0, stock_quantity:selected.stock_quantity??0,
      reorder_level:selected.reorder_level??10, description:selected.description||"", is_active:selected.is_active??true
    });
    setEditing(true); setMessage("");
  }
  function cancelEdit(){ setEditing(false); setEditForm(null); setMessage(""); }
  function change(e){ const {name,value,type,checked}=e.target; setEditForm(prev=>({...prev,[name]:type==="checkbox"?checked:value})); }

  async function save(){
    if(!editForm.name.trim()){ setMessage("Product name is required."); return; }
    setSaving(true); setMessage("");
    const payload={
      name:editForm.name.trim(), category_id:editForm.category_id||null, barcode:editForm.barcode.trim()||null,
      barcode_type:editForm.barcode_type||"INTERNAL", cost_price:Number(editForm.cost_price||0),
      selling_price:Number(editForm.selling_price||0), stock_quantity:Number(editForm.stock_quantity||0),
      reorder_level:Number(editForm.reorder_level||0), description:editForm.description.trim()||null,
      is_active:Boolean(editForm.is_active), updated_at:new Date().toISOString()
    };
    const {data,error}=await supabase.from("products").update(payload).eq("id",selected.id).select("*,categories(name)").single();
    setSaving(false);
    if(error){ setMessage(error.message); return; }
    setSelected(data); setEditing(false); setEditForm(null); setMessage("Product updated successfully."); await load();
  }

  const filtered=rows.filter(p=>(p.name||"").toLowerCase().includes(q.toLowerCase())||(p.barcode||"").toLowerCase().includes(q.toLowerCase()));

  return <div className="page">
    <div className="pageHeader"><div><h1>Product Catalogue</h1><p>Manage all books and stationery products.</p></div><Link to="/products/new" className="primaryBtn"><Plus size={17}/> Add Product</Link></div>
    <section className="panel">
      <div className="toolbar"><div className="searchField"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search product name or barcode..."/></div></div>
      <div className="tableWrap"><table><thead><tr><th>Product</th><th>Barcode</th><th>Category</th><th>Cost</th><th>Selling</th><th>Stock</th><th>Status</th></tr></thead><tbody>
        {filtered.map(p=><tr key={p.id} className="productRow" onClick={()=>openProduct(p)}><td><strong>{p.name}</strong></td><td className="mono">{p.barcode}</td><td>{p.categories?.name||"-"}</td><td>LKR {Number(p.cost_price||0).toFixed(2)}</td><td>LKR {Number(p.selling_price||0).toFixed(2)}</td><td>{p.stock_quantity}</td><td><span className={`pill ${p.stock_quantity===0?"red":p.stock_quantity<=p.reorder_level?"amber":"green"}`}>{p.stock_quantity===0?"Out of Stock":p.stock_quantity<=p.reorder_level?"Low Stock":"In Stock"}</span></td></tr>)}
      </tbody></table></div>
    </section>

    {selected && <div className="productDrawerOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
      <aside className="productDrawer">
        <div className="drawerHeader"><div><span className="drawerLabel">{editing?"Edit Product":"Product Details"}</span><h2>{editing?editForm?.name||selected.name:selected.name}</h2></div><button className="drawerClose" onClick={()=>setSelected(null)}><X size={20}/></button></div>
        {message && <div className={message.includes("successfully")?"drawerSuccess":"drawerError"}>{message}</div>}

        {!editing ? <>
          <div className="drawerScroll">
            <div className="productHero"><div className="productHeroIcon"><Package size={30}/></div><div><strong>{selected.name}</strong><span>{selected.categories?.name||"Uncategorized"}</span></div></div>
            <div className="drawerSection"><h3>Barcode</h3><div className="barcodeCard"><svg ref={barcodeRef}></svg><span className="mono">{selected.barcode}</span><small>{selected.barcode_type||"INTERNAL"}</small></div></div>
            <div className="drawerSection"><h3>Pricing</h3><div className="detailGrid"><div><span>Cost Price</span><strong>LKR {Number(selected.cost_price||0).toFixed(2)}</strong></div><div><span>Selling Price</span><strong>LKR {Number(selected.selling_price||0).toFixed(2)}</strong></div></div></div>
            <div className="drawerSection"><h3>Inventory</h3><div className="detailGrid"><div><span>Current Stock</span><strong>{selected.stock_quantity}</strong></div><div><span>Reorder Level</span><strong>{selected.reorder_level}</strong></div></div><div className="stockStatusBox"><Boxes size={18}/><div><span>Stock Status</span><strong>{selected.stock_quantity===0?"Out of Stock":selected.stock_quantity<=selected.reorder_level?"Low Stock":"Healthy Stock"}</strong></div></div></div>
            <div className="drawerSection"><h3>Description</h3><p className="productDescription">{selected.description||"No description has been added."}</p></div>
            <div className="drawerSection"><h3>System Information</h3><div className="systemInfo"><div><span>Product ID</span><code>{selected.id}</code></div><div><span>Created</span><strong>{selected.created_at?new Date(selected.created_at).toLocaleString():"-"}</strong></div><div><span>Last Updated</span><strong>{selected.updated_at?new Date(selected.updated_at).toLocaleString():"-"}</strong></div></div></div>
          </div>
          <div className="drawerActions"><button className="secondaryBtn" onClick={startEdit}><Pencil size={16}/> Edit Product</button><Link to="/stock-in" className="primaryBtn"><Truck size={16}/> Add Stock</Link></div>
        </> : <>
          <div className="drawerScroll"><div className="editDrawerForm">
            <label>Product Name<input name="name" value={editForm.name} onChange={change}/></label>
            <label>Category<select name="category_id" value={editForm.category_id} onChange={change}><option value="">Uncategorized</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>Barcode<div className="inputWithIcon"><BarcodeIcon size={16}/><input name="barcode" value={editForm.barcode} onChange={change}/></div></label>
            <label>Barcode Type<select name="barcode_type" value={editForm.barcode_type} onChange={change}><option value="MANUFACTURER">Manufacturer</option><option value="INTERNAL">Internal</option></select></label>
            <div className="editTwoCol"><label>Cost Price<input name="cost_price" type="number" min="0" step=".01" value={editForm.cost_price} onChange={change}/></label><label>Selling Price<input name="selling_price" type="number" min="0" step=".01" value={editForm.selling_price} onChange={change}/></label></div>
            <div className="editTwoCol"><label>Current Stock<input name="stock_quantity" type="number" min="0" value={editForm.stock_quantity} onChange={change}/></label><label>Reorder Level<input name="reorder_level" type="number" min="0" value={editForm.reorder_level} onChange={change}/></label></div>
            <label>Description<textarea name="description" rows="5" value={editForm.description} onChange={change}></textarea></label>
            <label className="toggleRow"><input name="is_active" type="checkbox" checked={editForm.is_active} onChange={change}/><span>Active Product</span></label>
            <div className="editNote">For normal supplier deliveries, use Stock Receiving so the stock movement is recorded. Use direct stock editing only for corrections.</div>
          </div></div>
          <div className="drawerActions"><button className="secondaryBtn" onClick={cancelEdit} disabled={saving}><RotateCcw size={16}/> Cancel</button><button className="primaryBtn" onClick={save} disabled={saving}><Save size={16}/> {saving?"Saving...":"Save Changes"}</button></div>
        </>}
      </aside>
    </div>}
  </div>;
}
