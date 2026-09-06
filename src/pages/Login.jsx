import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, LockKeyhole, LogIn } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login(){
  const navigate=useNavigate();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(e){
    e.preventDefault(); setLoading(true); setMessage("");
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    setLoading(false);
    if(error){ setMessage(error.message); return; }
    navigate("/",{replace:true});
  }

  return <div className="authPage">
    <div className="authShell">
      <div className="authSide">
        <div className="authBrandLarge"><div className="authLogo">F</div><div><strong>Falcon Feather</strong><span>Book House & Communication</span></div></div>
        <div className="authStatement"><h2>Simple. Fast. Reliable.</h2><p>Manage sales, products and stock from one place.</p></div>
      </div>

      <form className="authCard" onSubmit={submit}>
        <div className="authHeading"><h1>Welcome back</h1><p>Sign in to Falcon Feather POS.</p></div>
        <label>Email Address<div className="authInputWrap"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div></label>
        <label>Password<div className="authInputWrap"><LockKeyhole size={17}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required/></div></label>
        {message && <div className="authError">{message}</div>}
        <button className="authPrimaryBtn" disabled={loading}><LogIn size={17}/>{loading?"Signing in...":"Sign In"}</button>
        <div className="authSwitch"><span>Don't have an account?</span><Link to="/register">Create account</Link></div>
      </form>
    </div>
  </div>;
}
