import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Search, ScanLine, ShoppingCart, Trash2, Plus, Minus,
  CreditCard, Banknote, WalletCards, X, ReceiptText, Printer
} from "lucide-react";
import ReceiptModal from "../components/ReceiptModal";
import { buildA4ReceiptHtml } from "../lib/receipt";

export default function POS() {
  const [products,setProducts]=useState([]);
  const [categories,setCategories]=useState([]);
  const [category,setCategory]=useState("ALL");
  const [search,setSearch]=useState("");
  const [barcode,setBarcode]=useState("");
  const [cart,setCart]=useState([]);
  const [paymentOpen,setPaymentOpen]=useState(false);
  const [payment,setPayment]=useState("CASH");
  const [paid,setPaid]=useState("");
  const [message,setMessage]=useState("");
  const [lastSale,setLastSale]=useState(null);
  const [autoPrint,setAutoPrint]=useState(true);
  const scanRef=useRef(null);

  async function loadProducts(){
    const [{data:p},{data:c}] = await Promise.all([
      supabase.from("products").select("*,categories(name)").eq("is_active",true).order("name"),
      supabase.from("categories").select("*").order("name")
    ]);
    setProducts(p||[]);
    setCategories(c||[]);
  }

  useEffect(()=>{ loadProducts(); scanRef.current?.focus(); },[]);

  const filtered = useMemo(()=>products.filter(p=>{
    const catOk = category==="ALL" || p.category_id===category;
    const q = search.trim().toLowerCase();
    const searchOk = !q || p.name.toLowerCase().includes(q) || (p.barcode||"").toLowerCase().includes(q);
    return catOk && searchOk;
  }),[products,category,search]);

  function addToCart(product){
    setMessage("");
    if(product.stock_quantity<=0){ setMessage("This item is out of stock."); return; }

    setCart(prev=>{
      const existing=prev.find(x=>x.id===product.id);
      if(existing){
        if(existing.qty>=product.stock_quantity){
          setMessage("No more stock available for this item.");
          return prev;
        }
        return prev.map(x=>x.id===product.id ? {...x,qty:x.qty+1} : x);
      }
      return [...prev,{...product,qty:1}];
    });
  }

  async function handleScan(e){
    e.preventDefault();
    const code=barcode.trim();
    if(!code) return;

    const local=products.find(p=>p.barcode===code);
    if(local) addToCart(local);
    else {
      const {data}=await supabase.from("products").select("*").eq("barcode",code).eq("is_active",true).maybeSingle();
      if(data) addToCart(data);
      else setMessage("Barcode not found.");
    }

    setBarcode("");
    scanRef.current?.focus();
  }

  function changeQty(id,delta){
    setCart(prev=>prev.map(x=>{
      if(x.id!==id) return x;
      return {...x, qty:Math.max(1,Math.min(x.stock_quantity,x.qty+delta))};
    }));
  }

  const total=cart.reduce((a,x)=>a+x.qty*Number(x.selling_price),0);
  const change=Math.max(0,Number(paid||0)-total);

  async function completeSale(){
    setMessage("");
    if(!cart.length){ setMessage("Cart is empty."); return; }

    // Open immediately from the user's click so Safari/Chrome do not block it.
    const printWindow = autoPrint ? window.open("", "_blank", "width=900,height=1100") : null;
    if(printWindow){
      printWindow.document.write("<p style='font-family:Arial;padding:30px'>Preparing Falcon Feather receipt...</p>");
    }

    const cartSnapshot = cart.map(x=>({...x}));

    const {data,error}=await supabase.rpc("checkout_sale",{
      p_items:cartSnapshot.map(x=>({
        product_id:x.id,
        quantity:x.qty,
        unit_price:Number(x.selling_price)
      })),
      p_payment_method:payment,
      p_amount_paid:Number(paid||total)
    });

    if(error){
      if(printWindow) printWindow.close();
      setMessage(error.message);
      return;
    }

    const receipt = {
      id: data?.sale_id || data?.id,
      receipt_number: data?.receipt_number || "SALE",
      created_at: new Date().toISOString(),
      payment_method: payment,
      total: Number(data?.total ?? total),
      subtotal: total,
      discount: 0,
      amount_paid: Number(paid || data?.amount_paid || total),
      balance: Number(data?.balance ?? Math.max(0, Number(paid||total)-total)),
      items: cartSnapshot.map(x=>({
        product_id:x.id,
        name:x.name,
        barcode:x.barcode,
        quantity:x.qty,
        unit_price:Number(x.selling_price),
        line_total:x.qty*Number(x.selling_price)
      }))
    };

    setLastSale(receipt);
    setCart([]);
    setPaid("");
    setPaymentOpen(false);
    await loadProducts();

    if(autoPrint && printWindow){
      printWindow.document.open();
      printWindow.document.write(buildA4ReceiptHtml(receipt));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(()=>printWindow.print(),350);
    }
  }

  return (
    <div className="posPage">
      <div className="posLeft">
        <div className="posHeader">
          <div><h1>Point of Sale</h1><p>Scan, search or select products.</p></div>
          <div className="registerBadge">Register 01 · Open</div>
        </div>

        <form className="scanBar" onSubmit={handleScan}>
          <ScanLine size={20}/>
          <input ref={scanRef} value={barcode} onChange={e=>setBarcode(e.target.value)} placeholder="Scan barcode or enter code..." />
          <button>Enter</button>
        </form>

        <div className="searchBar">
          <Search size={18}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..." />
        </div>

        <div className="categoryTabs">
          <button className={category==="ALL"?"active":""} onClick={()=>setCategory("ALL")}>All Items</button>
          {categories.map(c=>(
            <button key={c.id} className={category===c.id?"active":""} onClick={()=>setCategory(c.id)}>
              {c.name}
            </button>
          ))}
        </div>

        <div className="productGrid">
          {filtered.map(p=>(
            <button key={p.id} className="productCard" onClick={()=>addToCart(p)}>
              <div className="productInitial">{p.name.charAt(0).toUpperCase()}</div>
              <div className="productInfo">
                <strong>{p.name}</strong>
                <span>{p.categories?.name || "Uncategorized"}</span>
                <small className="mono">{p.barcode}</small>
              </div>
              <div className="productBottom">
                <b>LKR {Number(p.selling_price).toFixed(2)}</b>
                <span className={p.stock_quantity<=p.reorder_level?"stockLow":"stockOk"}>
                  {p.stock_quantity} in stock
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <aside className="cartPanel">
        <div className="cartHeader">
          <div><h2>Current Sale</h2><span>{cart.reduce((a,x)=>a+x.qty,0)} items</span></div>
          <button className="iconBtn" onClick={()=>setCart([])}><Trash2 size={18}/></button>
        </div>

        {message && <div className="posMessage">{message}</div>}

        <div className="cartItems">
          {!cart.length ? (
            <div className="emptyCart">
              <ShoppingCart size={38}/>
              <strong>No items yet</strong>
              <span>Scan or select a product.</span>
            </div>
          ) : cart.map(x=>(
            <div className="cartItem" key={x.id}>
              <div className="cartItemTop">
                <div><strong>{x.name}</strong><small>{x.barcode}</small></div>
                <button className="removeBtn" onClick={()=>setCart(c=>c.filter(i=>i.id!==x.id))}><X size={16}/></button>
              </div>
              <div className="cartItemBottom">
                <div className="qtyControl">
                  <button onClick={()=>changeQty(x.id,-1)}><Minus size={14}/></button>
                  <span>{x.qty}</span>
                  <button onClick={()=>changeQty(x.id,1)}><Plus size={14}/></button>
                </div>
                <span>LKR {Number(x.selling_price).toFixed(2)} ea.</span>
                <strong>LKR {(x.qty*Number(x.selling_price)).toFixed(2)}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="cartSummary">
          <div><span>Subtotal</span><strong>LKR {total.toFixed(2)}</strong></div>
          <div><span>Discount</span><strong>LKR 0.00</strong></div>
          <div className="grandTotal"><span>Total</span><strong>LKR {total.toFixed(2)}</strong></div>
        </div>

        <button className="checkoutBtn" disabled={!cart.length} onClick={()=>setPaymentOpen(true)}>
          <WalletCards size={20}/> Pay LKR {total.toFixed(2)}
        </button>
      </aside>

      {paymentOpen && (
        <div className="modalOverlay">
          <div className="paymentModal">
            <div className="modalHeader">
              <div><h2>Take Payment</h2><p>Complete the current sale.</p></div>
              <button className="iconBtn" onClick={()=>setPaymentOpen(false)}><X size={20}/></button>
            </div>

            <div className="payTotal"><span>Amount Due</span><strong>LKR {total.toFixed(2)}</strong></div>

            <div className="paymentMethods">
              <button className={payment==="CASH"?"active":""} onClick={()=>setPayment("CASH")}><Banknote size={22}/><span>Cash</span></button>
              <button className={payment==="CARD"?"active":""} onClick={()=>setPayment("CARD")}><CreditCard size={22}/><span>Card</span></button>
              <button className={payment==="BANK_TRANSFER"?"active":""} onClick={()=>setPayment("BANK_TRANSFER")}><WalletCards size={22}/><span>Transfer</span></button>
            </div>

            {payment==="CASH" && (
              <>
                <label className="fieldLabel">
                  Cash Received
                  <input className="bigInput" type="number" step=".01" value={paid} onChange={e=>setPaid(e.target.value)} placeholder={total.toFixed(2)} />
                </label>
                <div className="changeBox"><span>Change Due</span><strong>LKR {change.toFixed(2)}</strong></div>
              </>
            )}

            <label className="autoPrintRow">
              <input type="checkbox" checked={autoPrint} onChange={e=>setAutoPrint(e.target.checked)}/>
              <Printer size={16}/>
              <span>Automatically open A4 print dialog after payment</span>
            </label>

            <button className="completeBtn" onClick={completeSale}>Complete Transaction</button>
          </div>
        </div>
      )}

      {lastSale && (
        <div className="saleToast">
          <ReceiptText size={19}/>
          <div><strong>Sale completed</strong><span>Receipt {lastSale.receipt_number}</span></div>
          <button onClick={()=>setLastSale(null)}><X size={16}/></button>
        </div>
      )}

      <ReceiptModal sale={lastSale} onClose={()=>setLastSale(null)}/>
    </div>
  );
}
