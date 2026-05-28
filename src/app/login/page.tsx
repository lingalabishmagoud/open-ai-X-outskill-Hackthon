"use client";

import { useState } from "react";
import { account } from "@/lib/appwrite";
import { ID, AppwriteException } from "appwrite";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Mail, KeyRound, ArrowRight, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Step 1: Send OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = await account.createEmailToken(ID.unique(), email, false);
      setUserId(token.userId);
      setStep("otp");
    } catch (err: unknown) {
      if (err instanceof AppwriteException) setError(err.message);
      else setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await account.createSession(userId, otp);
      router.push("/onboarding");
    } catch (err: unknown) {
      if (err instanceof AppwriteException) setError(err.message);
      else setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="glass auth-card">
        <div className="auth-logo">
          <div className="icon-wrap">
            <ShoppingBag size={32} color="#6366f1" />
          </div>
          <h1>HyperLocal</h1>
          <p>{step === "email" ? "Enter your email to get started" : `OTP sent to ${email}`}</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: "white"
          }}>1</div>
          <div style={{ height: 2, width: 40, background: step === "otp" ? "#6366f1" : "var(--border)" }} />
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: step === "otp" ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "var(--surface)",
            border: step === "otp" ? "none" : "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: step === "otp" ? "white" : "var(--muted)"
          }}>2</div>
        </div>

        {error && <div className="error-box">{error}</div>}

        {step === "email" ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="label">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: 40 }}
                  required
                />
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: 8 }}>
                We will send a 6-digit OTP to this email. No password needed.
              </p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Sending OTP…" : <><Mail size={17} /> Send OTP <ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="label">Enter 6-digit OTP</label>
              <div style={{ position: "relative" }}>
                <KeyRound size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input
                  className="input"
                  type="text"
                  placeholder="Enter the OTP from your email"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  style={{ paddingLeft: 40, letterSpacing: "0.2em", fontSize: "1.2rem", textAlign: "center" }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}
              >
                ← Change email
              </button>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Verifying…" : <><CheckCircle size={17} /> Verify & Continue <ArrowRight size={16} /></>}
            </button>

            <div style={{ textAlign: "center", marginTop: 16, fontSize: "0.8rem", color: "var(--muted)" }}>
              Didn&apos;t get the email? Check your spam folder.
            </div>
          </form>
        )}

        <div className="divider" style={{ marginTop: 24 }}>
          New here? You&apos;ll be registered automatically on first login.
        </div>
      </div>
    </div>
  );
}
