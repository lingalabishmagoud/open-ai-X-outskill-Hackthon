"use client";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { Models } from "appwrite";
import Link from "next/link";
import { ShoppingBag, LogOut, Zap, Clock, Shield, ChevronRight, Search, Package, MapPin, ScanBarcode, CheckCircle, Smartphone, ArrowRight } from "lucide-react";

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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "white",
      overflowX: "hidden",
      fontFamily: "'Inter', sans-serif"
    }}>
      <style>{`
        .hero-bg {
          position: absolute;
          top: 0; left: 0; right: 0; height: 100vh;
          background: radial-gradient(circle at 20% 30%, rgba(99,102,241,0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 70%, rgba(249,115,22,0.15) 0%, transparent 50%);
          z-index: 0;
          pointer-events: none;
        }
        .anim-fade-up {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(30px);
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }
        
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        .floating {
          animation: float 4s ease-in-out infinite;
        }

        .glass-card {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);
        }

        .gradient-text {
          background: linear-gradient(135deg, #818cf8, #f97316);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cred-box {
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 12px;
          margin-top: 16px;
          border: 1px solid rgba(255,255,255,0.05);
          font-family: monospace;
          font-size: 0.85rem;
          color: #94a3b8;
        }
      `}</style>

      <div className="hero-bg"></div>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        padding: "16px 32px",
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "linear-gradient(135deg, #6366f1, #f97316)", padding: 8, borderRadius: 12, boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
            <Zap size={24} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.4rem", letterSpacing: "-0.5px" }}>HyperLocal</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {user ? (
            <>
              <span style={{ color: "#94a3b8", fontSize: "0.9rem", fontWeight: 500, display: "none" }}>👋 {user.email}</span>
              <Link href="/orders" style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "white", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, transition: "background 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.1)"} onMouseLeave={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
                <Package size={16} /> My Orders
              </Link>
              <button onClick={handleLogout} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "background 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="rgba(239, 68, 68, 0.2)"} onMouseLeave={(e)=>e.currentTarget.style.background="rgba(239, 68, 68, 0.1)"}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <Link href="/login" style={{ padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", textDecoration: "none", fontWeight: 700, boxShadow: "0 4px 12px rgba(99,102,241,0.3)", transition: "transform 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={(e)=>e.currentTarget.style.transform="scale(1)"}>
              Login / Register
            </Link>
          )}
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        
        {/* HERO SECTION */}
        <section style={{ textAlign: "center", marginBottom: 80 }}>
          <div className="anim-fade-up delay-1" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(249,115,22,0.1)",
            border: "1px solid rgba(249,115,22,0.2)",
            color: "#fdba74",
            padding: "8px 20px",
            borderRadius: 999,
            fontSize: "0.85rem",
            fontWeight: 700,
            marginBottom: 32
          }}>
            <span style={{ position: "relative", display: "flex", width: 10, height: 10 }}>
              <span style={{ animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite", position: "absolute", inlineSize: "100%", blockSize: "100%", borderRadius: "50%", background: "#f97316", opacity: 0.7 }}></span>
              <span style={{ position: "relative", inlineSize: "10px", blockSize: "10px", borderRadius: "50%", background: "#f97316" }}></span>
            </span>
            Next-Gen Multi-Vendor Batch Delivery
          </div>

          <h1 className="anim-fade-up delay-2" style={{ fontSize: "clamp(3rem, 6vw, 5rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: "-0.03em" }}>
            The Future of <br/>
            <span className="gradient-text">Hyper-Density Delivery.</span>
          </h1>

          <p className="anim-fade-up delay-3" style={{ color: "#94a3b8", fontSize: "1.15rem", lineHeight: 1.6, maxWidth: 600, margin: "0 auto 40px" }}>
            A complete ecosystem connecting customers in apartment blocks with multiple local vendors, routed intelligently to a single rider for zero-hassle batch delivery.
          </p>

          <div className="anim-fade-up delay-4" style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            {user ? (
              <Link href="/shop" style={{ padding: "16px 36px", borderRadius: 16, background: "white", color: "black", textDecoration: "none", fontWeight: 800, fontSize: "1.1rem", display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 10px 25px rgba(255,255,255,0.2)" }}>
                <Search size={20} /> Open Customer App
              </Link>
            ) : (
              <Link href="/login" style={{ padding: "16px 36px", borderRadius: 16, background: "white", color: "black", textDecoration: "none", fontWeight: 800, fontSize: "1.1rem", display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 10px 25px rgba(255,255,255,0.2)" }}>
                Experience the App <ChevronRight size={20} />
              </Link>
            )}
          </div>
        </section>

        {/* DEMO ACCESS PORTALS - MOVED TO TOP */}
        <section className="anim-fade-up delay-5" style={{ marginBottom: 120 }}>
          <h2 style={{ textAlign: "center", fontWeight: 900, fontSize: "2.5rem", marginBottom: 16 }}>Demo Access Portals</h2>
          <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: 60, maxWidth: 600, margin: "0 auto" }}>
            The credentials below are hardcoded or intentionally left open purely for <strong>Hackathon Demo Purposes</strong> so you can test all views seamlessly.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
            
            {/* Customer App */}
            <div className="glass-card" style={{ padding: 32, display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ background: "rgba(99,102,241,0.1)", width: 56, height: 56, borderRadius: "20%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <ShoppingBag size={28} color="#818cf8" />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 8 }}>Customer App</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", flex: 1 }}>The storefront where users place orders.</p>
              
              <div className="cred-box">
                <div style={{ color: "white", marginBottom: 8, fontWeight: 700 }}>Demo Credentials:</div>
                <div>User 1: test1@gmail.com / 12345678</div>
                <div>User 2: test2@gmail.com / 12345678</div>
              </div>
              <Link href="/shop" style={{ marginTop: 24, padding: "12px", background: "white", color: "black", textAlign: "center", borderRadius: 12, fontWeight: 700, textDecoration: "none" }}>Open App</Link>
            </div>

            {/* Admin App */}
            <div className="glass-card" style={{ padding: 32, display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ background: "rgba(236,72,153,0.1)", width: 56, height: 56, borderRadius: "20%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Shield size={28} color="#f472b6" />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 8 }}>Admin Panel</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", flex: 1 }}>Control center for routing orders.</p>
              
              <div className="cred-box">
                <div style={{ color: "white", marginBottom: 8, fontWeight: 700 }}>Demo Credentials:</div>
                <div>Password:</div>
                <div><strong>hyperlocal@admin2024</strong></div>
              </div>
              <Link href="/admin" style={{ marginTop: 24, padding: "12px", background: "#f472b6", color: "white", textAlign: "center", borderRadius: 12, fontWeight: 700, textDecoration: "none" }}>Open Admin</Link>
            </div>

            {/* Vendor App */}
            <div className="glass-card" style={{ padding: 32, display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ background: "rgba(34,197,94,0.1)", width: 56, height: 56, borderRadius: "20%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Package size={28} color="#34d399" />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 8 }}>Vendor Portal</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", flex: 1 }}>Where store owners pack items.</p>
              
              <div className="cred-box">
                <div style={{ color: "white", marginBottom: 8, fontWeight: 700 }}>Demo Credentials:</div>
                <div>Phone: <strong>9292108888</strong></div>
                <div>PIN: <strong>1234</strong></div>
              </div>
              <Link href="/vendor" style={{ marginTop: 24, padding: "12px", background: "#34d399", color: "#064e3b", textAlign: "center", borderRadius: 12, fontWeight: 700, textDecoration: "none" }}>Open Vendor</Link>
            </div>

            {/* Rider App */}
            <div className="glass-card" style={{ padding: 32, display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ background: "rgba(249,115,22,0.1)", width: 56, height: 56, borderRadius: "20%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Zap size={28} color="#fb923c" />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 8 }}>Rider App</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", flex: 1 }}>Batch delivery and verification.</p>
              
              <div className="cred-box">
                <div style={{ color: "white", marginBottom: 8, fontWeight: 700 }}>Demo Credentials:</div>
                <div>PIN:</div>
                <div><strong>rider123</strong></div>
              </div>
              <Link href="/rider" style={{ marginTop: 24, padding: "12px", background: "#fb923c", color: "#431407", textAlign: "center", borderRadius: 12, fontWeight: 700, textDecoration: "none" }}>Open Rider</Link>
            </div>

          </div>
        </section>

        {/* DETAILED WORKFLOW TIMELINE - MOVED TO BOTTOM */}
        <section className="anim-fade-up delay-5" style={{ marginBottom: 120 }}>
          <h2 style={{ textAlign: "center", fontWeight: 900, fontSize: "2.5rem", marginBottom: 20 }}>How The Ecosystem Works</h2>
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "1.1rem", marginBottom: 60, maxWidth: 800, margin: "0 auto 60px" }}>
            A deep-dive into the architecture of our 4-app ecosystem. We solve the fragmentation of local retail by acting as a smart routing layer between customers, multiple local vendors, and a single delivery rider.
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32 }}>
            
            <div className="glass-card" style={{ padding: 40, position: "relative", display: "flex", gap: 32, alignItems: "flex-start" }}>
              <div className="floating" style={{ background: "rgba(99,102,241,0.2)", minWidth: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Smartphone size={40} color="#818cf8" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 12, color: "#818cf8" }}>1. Customer App (The Request Layer)</h3>
                <p style={{ color: "#cbd5e1", lineHeight: 1.7, fontSize: "1.05rem" }}>
                  Customers living in verified apartment complexes open the app and browse hyper-local inventory. Instead of ordering for immediate on-demand delivery (which is expensive and inefficient), they select a <strong>guaranteed time slot</strong> (e.g., Morning, Afternoon, Evening). The system automatically batches their orders with their neighbors' orders, creating massive logistical density.
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 40, position: "relative", display: "flex", gap: 32, alignItems: "flex-start" }}>
              <div className="floating" style={{ animationDelay: "0.5s", background: "rgba(236,72,153,0.2)", minWidth: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={40} color="#f472b6" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 12, color: "#f472b6" }}>2. Admin Dashboard (The Brain)</h3>
                <p style={{ color: "#cbd5e1", lineHeight: 1.7, fontSize: "1.05rem" }}>
                  The Admin Dashboard acts as the central intelligence of the operation. Once a time slot closes, it aggregates all apartment orders. It then cross-references the required products against the live inventory of all registered local vendors. The system <strong>smartly routes specific item requests</strong> to the optimal vendors to minimize distance and prevent stockouts.
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 40, position: "relative", display: "flex", gap: 32, alignItems: "flex-start" }}>
              <div className="floating" style={{ animationDelay: "1s", background: "rgba(34,197,94,0.2)", minWidth: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Package size={40} color="#34d399" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 12, color: "#34d399" }}>3. Vendor Portal (The Fulfillment Layer)</h3>
                <p style={{ color: "#cbd5e1", lineHeight: 1.7, fontSize: "1.05rem" }}>
                  Local shop owners receive only their specific portion of the aggregated orders. They use the built-in Barcode Scanner in the Vendor App to verify they are packing the exact requested items. Once an item is scanned and packed, the system updates the global manifest, signaling the routing engine that the item is ready for pickup.
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 40, position: "relative", display: "flex", gap: 32, alignItems: "flex-start" }}>
              <div className="floating" style={{ animationDelay: "1.5s", background: "rgba(249,115,22,0.2)", minWidth: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ScanBarcode size={40} color="#fb923c" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 12, color: "#fb923c" }}>4. Rider App (The Final Mile)</h3>
                <p style={{ color: "#cbd5e1", lineHeight: 1.7, fontSize: "1.05rem" }}>
                  The rider receives a consolidated, hyper-efficient manifest for an entire apartment complex. They visit the assigned local vendors, pick up the packed items, and navigate to the apartment block. At the customer's doorstep, the rider performs a <strong>final barcode scan</strong> of every item to guarantee 100% accuracy before handing over the delivery, eliminating missing item disputes.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* SPECIAL SCENARIO EXPLANATION */}
        <section className="anim-fade-up delay-5" style={{ paddingBottom: 60 }}>
          <div style={{ background: "linear-gradient(145deg, #1e293b, #0f172a)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 32, padding: "48px", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <span style={{ display: "inline-block", background: "rgba(99,102,241,0.2)", color: "#818cf8", padding: "6px 16px", borderRadius: 100, fontWeight: 800, fontSize: "0.85rem", marginBottom: 16 }}>CASE STUDY</span>
                <h2 style={{ fontWeight: 900, fontSize: "2rem", marginBottom: 16 }}>The Multi-Vendor Edge</h2>
                <p style={{ color: "#cbd5e1", fontSize: "1.1rem", lineHeight: 1.7, maxWidth: 800 }}>
                  Consider a customer who orders a specific item, like <strong>"Parle G"</strong>. In our ecosystem:
                </p>
              </div>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <div style={{ flex: "1 1 300px", background: "rgba(0,0,0,0.3)", padding: 24, borderRadius: 20, borderLeft: "4px solid #6366f1" }}>
                  <h4 style={{ color: "white", fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}><ArrowRight size={16} color="#818cf8"/> Step 1: System Check</h4>
                  <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>The system detects that <em>Ramesh Kirana</em> and <em>SuperMart</em> both carry Parle G in their live inventory.</p>
                </div>
                <div style={{ flex: "1 1 300px", background: "rgba(0,0,0,0.3)", padding: 24, borderRadius: 20, borderLeft: "4px solid #f472b6" }}>
                  <h4 style={{ color: "white", fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}><ArrowRight size={16} color="#f472b6"/> Step 2: Admin Route</h4>
                  <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>The Admin manually or automatically assigns the exact product ID to <em>Ramesh Kirana</em> based on proximity or stock availability.</p>
                </div>
                <div style={{ flex: "1 1 300px", background: "rgba(0,0,0,0.3)", padding: 24, borderRadius: 20, borderLeft: "4px solid #34d399" }}>
                  <h4 style={{ color: "white", fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}><ArrowRight size={16} color="#34d399"/> Step 3: Secure Handoff</h4>
                  <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>The Rider app guides the rider to Ramesh Kirana, requiring a barcode scan of the exact Parle G packet to ensure no mix-ups before doorstep delivery.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
