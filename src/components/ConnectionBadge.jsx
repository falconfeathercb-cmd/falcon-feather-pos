import { useEffect,useState } from "react";
import { supabase } from "../lib/supabase";

export default function ConnectionBadge(){
  const [ok,setOk]=useState(null);
  async function check(){
    const {error}=await supabase.from("categories").select("id").limit(1);
    setOk(!error);
  }
  useEffect(()=>{check()},[]);
  return <button className={`connectionBadge ${ok===true?"ok":ok===false?"bad":""}`} onClick={check}>
    <span></span>{ok===null?"Checking...":ok?"Supabase Connected":"Connection Failed"}
  </button>
}
