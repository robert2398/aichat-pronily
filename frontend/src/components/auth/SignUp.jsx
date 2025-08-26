import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Field from "./Field";
import PrimaryButton from "./PrimaryButton";
import DividerOr from "./DividerOr";
import GoogleButton from "./GoogleButton";
import { useNavigate, useLocation } from "react-router-dom";

export default function SignUp(){
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Create an Account</h1>
      <div className="space-y-6">
        <Field label="Email Id" placeholder="Enter email" value={email} onChange={setEmail} />
        <Field label="Password" placeholder="Enter password" value={pw} onChange={setPw} type={show? 'text':'password'} rightIcon={show ? <Eye className="h-5 w-5"/> : <EyeOff className="h-5 w-5"/>} onRightIconClick={()=>setShow(v=>!v)} />
        <PrimaryButton onClick={()=>console.log('SignUp attempt',{email})}>Sign Up</PrimaryButton>
        <DividerOr />
        <GoogleButton label="Continue with Google" />
  <p className="text-center text-sm text-white/70">Have an account? <button className="text-pink-400 hover:text-pink-300" onClick={()=>navigate('/signin',{state:{background:location}})}>Sign In</button></p>
      </div>
    </div>
  );
}
