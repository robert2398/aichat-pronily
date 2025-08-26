import React, { useState } from "react";
import Field from "./Field";
import PrimaryButton from "./PrimaryButton";
import { useNavigate, useLocation } from "react-router-dom";

export default function ForgotPassword(){
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Reset Password</h1>
      <div className="space-y-6">
        <Field label="Email Id" placeholder="Enter email" value={email} onChange={setEmail} />
        <PrimaryButton onClick={()=>console.log('Reset request',{email})}>Send Reset Link</PrimaryButton>
  <p className="text-center text-sm text-white/70">Remembered your password? <button className="text-pink-400 hover:text-pink-300" onClick={()=>navigate('/signin',{state:{background:location}})}>Sign In</button></p>
      </div>
    </div>
  );
}
