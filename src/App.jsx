import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import Inventory from "./pages/Inventory";
import StockIn from "./pages/StockIn";
import Alerts from "./pages/Alerts";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App(){
  const [session,setSession]=useState(undefined);

  useEffect(()=>{
    let active=true;

    async function load(){
      const { data:{session} } = await supabase.auth.getSession();
      if(active) setSession(session);
    }

    load();

    const { data:{subscription} } = supabase.auth.onAuthStateChange((_event,nextSession)=>{
      setSession(nextSession);
    });

    return ()=>{
      active=false;
      subscription.unsubscribe();
    };
  },[]);

  if(session===undefined){
    return <div className="appLoading"><div className="loadingLogo">F</div><strong>Falcon Feather POS</strong><span>Loading...</span></div>;
  }

  return <Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>

    <Route element={session ? <Layout session={session}/> : <Navigate to="/login" replace/>}>
      <Route path="/" element={<Dashboard/>}/>
      <Route path="/pos" element={<POS/>}/>
      <Route path="/products" element={<Products/>}/>
      <Route path="/products/new" element={<AddProduct/>}/>
      <Route path="/inventory" element={<Inventory/>}/>
      <Route path="/stock-in" element={<StockIn/>}/>
      <Route path="/alerts" element={<Alerts/>}/>
      <Route path="/sales" element={<Sales/>}/>
      <Route path="/reports" element={<Reports/>}/>
      <Route path="/settings" element={<Settings/>}/>
    </Route>

    <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace/>}/>
  </Routes>;
}
