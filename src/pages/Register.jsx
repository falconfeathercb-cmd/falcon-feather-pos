import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, LockKeyhole, UserPlus } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Register(){
  const navigate=useNavigate();
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [message,setMessage]=useState("");
  const [success,setSuccess]=useState(false);
  const [loading,setLoading]=useState(false);

  async function submit(e){
    e.preventDefault(); setMessage(""); setSuccess(false);
    if(password.length<6){ setMessage("Password must contain at least 6 characters."); return; }
    if(password!==confirm){ setMessage("Passwords do not match."); return; }

    setLoading(true);
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()}}});
    setLoading(false);
    if(error){ setMessage(error.message); return; }

    if(data.session){ navigate("/",{replace:true}); return; }
    setSuccess(true);
    setMessage("Account created. Confirm your email if Supabase email confirmation is enabled, then sign in.");
  }

  return <div className="authPage">
    <div className="authShell">
      <div className="authSide">
        <div className="authBrandLarge"><div className="authLogo">F</div><div><strong>Falcon Feather</strong><span>Book House & Communication</span></div></div>
        <div className="authStatement"><h2>Create your POS account.</h2><p>Register with a normal email and password.</p></div>
      </div>
      <form className="authCard" onSubmit={submit}>
        <div className="authHeading"><h1>Create account</h1><p>Register to access Falcon Feather POS.</p></div>
        <label>Full Name<div className="authInputWrap"><User size={17}/><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required/></div></label>
        <label>Email Address<div className="authInputWrap"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div></label>
        <label>Password<div className="authInputWrap"><LockKeyhole size={17}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} placeholder="Minimum 6 characters" required/></div></label>
        <label>Confirm Password<div className="authInputWrap"><LockKeyhole size={17}/><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={6} placeholder="Repeat password" required/></div></label>
        {message && <div className={success?"authSuccess":"authError"}>{message}</div>}
        <button className="authPrimaryBtn" disabled={loading}><UserPlus size={17}/>{loading?"Creating...":"Create Account"}</button>
        <div className="authSwitch"><span>Already have an account?</span><Link to="/login">Sign in</Link></div>
      </form>
    </div>
  </div>;
}
