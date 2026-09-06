import { useEffect,useState } from "react";
import { supabase } from "../lib/supabase";
import { Package, ShoppingBag, Banknote, TriangleAlert, Boxes } from "lucide-react";
import StatCard from "../components/StatCard";

export default function Dashboard(){
  const [stats,setStats]=useState({products:0,sales:0,revenue:0,low:0});
  const [lowRows,setLowRows]=useState([]);

  async function load(){
    const today=new Date(); today.setHours(0,0,0,0);
    const [p,s]=await Promise.all([
      supabase.from("products").select("*").eq("is_active",true),
      supabase.from("sales").select("*").gte("created_at",today.toISOString())
    ]);
    const products=p.data||[], sales=s.data||[];
    setStats({
      products:products.length,
      sales:sales.length,
      revenue:sales.reduce((a,b)=>a+Number(b.total||0),0),
      low:products.filter(x=>x.stock_quantity<=x.reorder_level).length
    });
    setLowRows(products.filter(x=>x.stock_quantity<=x.reorder_level).slice(0,8));
  }

  useEffect(()=>{load()},[]);

  return <div className="page">
    <div className="pageHeader">
      <div><h1>Store Overview</h1><p>Monitor sales, inventory and stock health.</p></div>
      <button className="secondaryBtn" onClick={load}>Refresh</button>
    </div>

    <div className="statGrid">
      <StatCard title="Today's Revenue" value={`LKR ${stats.revenue.toLocaleString(undefined,{minimumFractionDigits:2})}`} caption="Gross sales" icon={Banknote}/>
      <StatCard title="Transactions" value={stats.sales} caption="Completed today" icon={ShoppingBag}/>
      <StatCard title="Products" value={stats.products} caption="Active catalogue" icon={Package}/>
      <StatCard title="Low Stock" value={stats.low} caption="Needs attention" icon={TriangleAlert} alert={stats.low>0}/>
    </div>

    <div className="dashboardGrid">
      <section className="panel">
        <div className="panelHeader"><div><h2>Low Stock Watchlist</h2><p>Products requiring replenishment.</p></div></div>
        <div className="tableWrap"><table>
          <thead><tr><th>Product</th><th>Barcode</th><th>Stock</th><th>Reorder</th><th>Status</th></tr></thead>
          <tbody>{lowRows.map(p=><tr key={p.id}>
            <td><strong>{p.name}</strong></td><td className="mono">{p.barcode}</td>
            <td>{p.stock_quantity}</td><td>{p.reorder_level}</td>
            <td><span className={`pill ${p.stock_quantity===0?"red":"amber"}`}>{p.stock_quantity===0?"Out of Stock":"Low Stock"}</span></td>
          </tr>)}</tbody>
        </table></div>
      </section>

      <section className="panel quickPanel">
        <div className="panelHeader"><div><h2>Quick Actions</h2><p>Common store tasks.</p></div></div>
        <a href="/pos" className="quickAction"><ShoppingBag size={20}/><div><strong>Open POS</strong><span>Start a sale</span></div></a>
        <a href="/products/new" className="quickAction"><Package size={20}/><div><strong>Add Product</strong><span>Create new item</span></div></a>
        <a href="/stock-in" className="quickAction"><Boxes size={20}/><div><strong>Receive Stock</strong><span>Update inventory</span></div></a>
      </section>
    </div>
  </div>
}
