"use client";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { Models } from "appwrite";
import Link from "next/link";
import { ShoppingBag, LogOut, Zap, Clock, Shield, ChevronRight, Search, Package } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    account.get()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await account.deleteSession("current");
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--muted)" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top left, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(249,115,22,0.1) 0%, transparent 60%), var(--bg)"
    }}>
      {/* Header */}
      <header className="glass" style={{
        position: "sticky", top: 0, zIndex: 100,
        padding: "14px 24px",
        borderRadius: 0,
        borderLeft: "none", borderRight: "none", borderTop: "none",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg, #6366f1, #f97316)", padding: 8, borderRadius: 10 }}>
            <ShoppingBag size={20} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.2rem" }}>HyperLocal</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>👋 {user.email}</span>
              <Link href="/orders" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
                <Package size={15} /> My Orders
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary" style={{ width: "auto", padding: "10px 20px", fontSize: "0.9rem" }}>
              Login / Register
            </Link>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-block",
            background: "rgba(249,115,22,0.15)",
            border: "1px solid rgba(249,115,22,0.3)",
            color: "#fdba74",
            padding: "6px 16px",
            borderRadius: 999,
            fontSize: "0.8rem",
            fontWeight: 600,
            marginBottom: 20
          }}>
            ⚡ Hyper-Density Delivery — Built for Apartments
          </div>

          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            Groceries. Medicines.<br />Stationery. Everything.<br />
            <span style={{ background: "linear-gradient(90deg, #6366f1, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Delivered on your schedule.
            </span>
          </h1>

          <p style={{ color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 36px" }}>
            Select a delivery time slot. We batch all orders in your apartment complex and deliver together — ultra-low cost, zero security hassle.
          </p>

          {user ? (
            <div>
              <div className="success-box" style={{ display: "inline-block", marginBottom: 24 }}>
                ✅ Logged in as <strong>{user.email}</strong>
              </div>
              <br />
              <Link href="/shop" className="btn btn-primary" style={{ width: "auto", padding: "14px 32px", fontSize: "1rem", display: "inline-flex" }}>
                <Search size={18} /> Browse Products <ChevronRight size={18} />
              </Link>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary" style={{ width: "auto", padding: "14px 32px", fontSize: "1rem", display: "inline-flex" }}>
              Get Started — It&apos;s Free <ChevronRight size={18} />
            </Link>
          )}
        </div>

        {/* Entry Points for all apps */}
        <div style={{ marginTop: 64, borderTop: "1px solid var(--border)", paddingTop: 40 }}>
          <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: "1.8rem", marginBottom: 32 }}>System Access Portals</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Link href="/shop" className="glass" style={{ padding: 24, textAlign: "center", textDecoration: "none", borderRadius: 16, display: "block" }}>
              <div style={{ background: "rgba(99,102,241,0.1)", width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShoppingBag size={28} color="#6366f1" />
              </div>
              <h3 style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Customer App</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Browse and order</p>
            </Link>
            <Link href="/vendor" className="glass" style={{ padding: 24, textAlign: "center", textDecoration: "none", borderRadius: 16, display: "block" }}>
              <div style={{ background: "rgba(34,197,94,0.1)", width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Package size={28} color="#22c55e" />
              </div>
              <h3 style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Vendor Portal</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Barcode intake & packing</p>
            </Link>
            <Link href="/rider" className="glass" style={{ padding: 24, textAlign: "center", textDecoration: "none", borderRadius: 16, display: "block" }}>
              <div style={{ background: "rgba(249,115,22,0.1)", width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={28} color="#f97316" />
              </div>
              <h3 style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Rider App</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Batch delivery routing</p>
            </Link>
            <Link href="/admin" className="glass" style={{ padding: 24, textAlign: "center", textDecoration: "none", borderRadius: 16, display: "block" }}>
              <div style={{ background: "rgba(236,72,153,0.1)", width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={28} color="#ec4899" />
              </div>
              <h3 style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Admin Dashboard</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>System management</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
