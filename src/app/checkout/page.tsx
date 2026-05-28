"use client";

import { useState } from "react";
import { databases, DB_ID, ORDERS_COL } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useCart } from "@/context/CartContext";
import { account } from "@/lib/appwrite";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, MapPin, Clock, ArrowLeft, CheckCircle, Receipt } from "lucide-react";
import { useEffect } from "react";
import { Models } from "appwrite";

const TIME_SLOTS = [
  { id: "morning", label: "Morning", time: "8:00 AM – 11:00 AM", emoji: "🌅" },
  { id: "afternoon", label: "Afternoon", time: "12:00 PM – 3:00 PM", emoji: "☀️" },
  { id: "evening", label: "Evening", time: "6:00 PM – 9:00 PM", emoji: "🌆" },
];

export default function CheckoutPage() {
  const { items, totalMRP, clearCart } = useCart();
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [apartmentName, setApartmentName] = useState("");
  const [blockNumber, setBlockNumber] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("evening");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    account.get().then(setUser).catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("hk_user_settings");
      if (data) {
        const parsed = JSON.parse(data);
        setApartmentName(parsed.apartmentName);
        setInstructions(parsed.instructions || "");
      } else {
        const leg = localStorage.getItem("hk_user_community");
        if (leg) {
          const parsed = JSON.parse(leg);
          setApartmentName(parsed.apartmentName);
          setBlockNumber(parsed.block);
          setFlatNumber(parsed.flat);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!success && items.length === 0 && user) {
      router.push("/shop");
    }
  }, [items, success, user, router]);

  const deliveryCharge = totalMRP < 200 ? 10 : totalMRP < 500 ? 20 : 30;
  const grandTotal = totalMRP + deliveryCharge;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const orderData = {
        user_id: user.$id,
        apartment_name: apartmentName,
        block_number: blockNumber,
        flat_number: flatNumber,
        map_link: mapLink,
        time_slot: selectedSlot,
        total_mrp: totalMRP,
        delivery_charge: deliveryCharge,
        status: "pending",
        items_json: JSON.stringify([
          ...items.map(i => ({
            id: i.id, name: i.name, mrp: i.mrp, qty: i.quantity, vendorId: i.vendorId
          })),
          { id: "_metadata_", name: "_metadata_", instructions }
        ]),
      };

      const doc = await databases.createDocument(DB_ID, ORDERS_COL, ID.unique(), orderData);
      setOrderId(doc.$id);
      clearCart();
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (success) {
    return (
      <div className="page-center" style={{ background: "var(--bg)" }}>
        <div className="glass auth-card" style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ display: "inline-flex", padding: 20, borderRadius: "50%", background: "rgba(34,197,94,0.2)", marginBottom: 20 }}>
            <CheckCircle size={48} color="#22c55e" />
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 12 }}>Order Placed! 🎉</h1>
          <p style={{ color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
            Your order has been received. We will consolidate all apartment orders and deliver them in your selected time slot.
          </p>
          <div className="glass" style={{ padding: 20, marginBottom: 24, textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.875rem" }}>
              <span style={{ color: "var(--muted)" }}>Order ID</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{orderId.slice(0, 16)}…</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.875rem" }}>
              <span style={{ color: "var(--muted)" }}>Delivery Address</span>
              <span style={{ textAlign: "right" }}>{flatNumber}, {blockNumber}, {apartmentName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <span style={{ color: "var(--muted)" }}>Time Slot</span>
              <span>{TIME_SLOTS.find(s => s.id === selectedSlot)?.emoji} {TIME_SLOTS.find(s => s.id === selectedSlot)?.time}</span>
            </div>
          </div>
          <Link href="/shop" className="btn btn-primary" style={{ display: "flex", textDecoration: "none" }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "0 0 60px" }}>
      {/* Header */}
      <header className="glass" style={{ padding: "14px 24px", borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/shop" style={{ color: "var(--muted)", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "linear-gradient(135deg, #6366f1, #f97316)", padding: 7, borderRadius: 9 }}>
            <ShoppingBag size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800 }}>Checkout</span>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        {/* LEFT: Form */}
        <form onSubmit={handlePlaceOrder}>
          {error && <div className="error-box" style={{ marginBottom: 20 }}>{error}</div>}

          {/* Delivery Address */}
          <div className="glass" style={{ padding: 28, marginBottom: 20, borderRadius: 16 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <MapPin size={20} color="#6366f1" /> Delivery Address
            </h2>
            <div className="form-group">
              <label className="label">Apartment / Society Name *</label>
              <input className="input" type="text" placeholder="e.g. Prestige Lakeside Habitat" value={apartmentName} onChange={e => setApartmentName(e.target.value)} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="form-group">
                <label className="label">Block / Tower *</label>
                <input className="input" type="text" placeholder="e.g. Tower A, Block 3" value={blockNumber} onChange={e => setBlockNumber(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Flat Number *</label>
                <input className="input" type="text" placeholder="e.g. 502, 12B" value={flatNumber} onChange={e => setFlatNumber(e.target.value)} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Google Maps Link (optional)</label>
              <input className="input" type="url" placeholder="https://maps.google.com/..." value={mapLink} onChange={e => setMapLink(e.target.value)} />
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: 6 }}>
                Helps our rider find you faster inside the complex
              </p>
            </div>
          </div>

          {/* Time Slot */}
          <div className="glass" style={{ padding: 28, borderRadius: 16 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={20} color="#6366f1" /> Choose Delivery Time Slot
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TIME_SLOTS.map(slot => (
                <label
                  key={slot.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: 16, borderRadius: 12, cursor: "pointer",
                    border: `2px solid ${selectedSlot === slot.id ? "#6366f1" : "var(--border)"}`,
                    background: selectedSlot === slot.id ? "rgba(99,102,241,0.1)" : "var(--surface)",
                    transition: "all 0.2s"
                  }}
                >
                  <input
                    type="radio" name="slot" value={slot.id}
                    checked={selectedSlot === slot.id}
                    onChange={() => setSelectedSlot(slot.id)}
                    style={{ display: "none" }}
                  />
                  <span style={{ fontSize: "1.8rem" }}>{slot.emoji}</span>
                  <div>
                    <p style={{ fontWeight: 700 }}>{slot.label}</p>
                    <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{slot.time}</p>
                  </div>
                  {selectedSlot === slot.id && (
                    <CheckCircle size={20} color="#6366f1" style={{ marginLeft: "auto" }} />
                  )}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 20, fontSize: "1rem", padding: "14px" }}>
            {loading ? "Placing Order…" : "Place Order & Confirm"}
          </button>
        </form>

        {/* RIGHT: Bill Summary */}
        <div>
          <div className="glass" style={{ padding: 24, borderRadius: 16, position: "sticky", top: 80 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <Receipt size={20} color="#6366f1" /> Bill Summary
            </h2>
            <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: "0.875rem" }}>
                  <div style={{ flex: 1, marginRight: 8 }}>
                    <p style={{ fontWeight: 500 }}>{item.name}</p>
                    <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>× {item.quantity}</p>
                  </div>
                  <span style={{ fontWeight: 600 }}>₹{item.mrp * item.quantity}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.875rem", color: "var(--muted)" }}>
                <span>Items Total</span><span>₹{totalMRP}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.875rem", color: "var(--muted)" }}>
                <span>Delivery Charge</span>
                <span style={{ color: "#22c55e" }}>₹{deliveryCharge} {deliveryCharge === 10 && "✨"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.2rem", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <span>Grand Total</span>
                <span style={{ color: "#22c55e" }}>₹{grandTotal}</span>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", fontSize: "0.8rem", color: "#86efac" }}>
              💚 You save on delivery by scheduling! Our batched delivery model keeps costs ultra-low.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
