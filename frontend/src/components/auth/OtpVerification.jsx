import React, { useState } from "react";
import OtpInput from "./OtpInput";
import PrimaryButton from "./PrimaryButton";

export default function OtpVerification(){
  const [code, setCode] = useState('');
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">OTP Verification</h1>
      <p className="text-white/80">We sent a reset link to <span className="text-white font-semibold">contact@.com</span> enter 5 digit code that mentioned in the email</p>
      <OtpInput length={5} onComplete={(c)=>setCode(c)} />
      <PrimaryButton onClick={()=>console.log('Verify code', code || '(incomplete)')}>Verify Code</PrimaryButton>
    </div>
  );
}
