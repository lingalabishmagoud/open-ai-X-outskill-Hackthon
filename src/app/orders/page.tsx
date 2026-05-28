"use client";

import { useEffect, useState } from "react";
import { account, databases, DB_ID, ORDERS_COL } from "@/lib/appwrite";
import { Query, Models } from "appwrite";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag, ArrowLeft, Package, Clock, CheckCircle,
  Truck, PackageCheck, ChevronDown, ChevronUp, MapPin, RefreshCw
} from "lucide-react";

interface OrderItem { name: string; qty: number; mrp: number; }
interface Order {
  $id: string;
  $createdAt: string;
  apartment_name: string;
  block_number: string;
  flat_number: string;
  time_slot: string;
  total_mrp: number;
  delivery_charge: number;
  status: string;
  items_json: string;
}

const STATUS_STEPS = [
  { key: "pending",          label: "Order Placed",      icon: <Clock size={18} />,        color: "#f97316" },
  { key: "packed",           label: "Packed & Ready",    icon: <PackageCheck size={18} />, color: "#6366f1" },
  { key: "out_for_delivery", label: "Out for Delivery",  icon: <Truck size={18} />,        color: "#3b82f6" },
  { key: "delivered",        label: "Delivered ✓",       icon: <CheckCircle size={18} />,  color: "#22c55e" },
];

const SLOT_LABELS: Record<string, string> = {
  morning: "🌅 Morning (8 AM – 11 AM)",
  afternoon: "☀️ Afternoon (12 PM – 3 PM)",
  evening: "🌆 Evening (6 PM – 9 PM)",
};

function StatusTracker({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "20px 0 4px" }}>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", flex: i < STATUS_STEPS.length - 1 ? 1 : "none" }}>
            {/* Circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: done ? step.color : "var(--surface)",
                border: `2px solid ${done ? step.color : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done ? "white" : "var(--muted)",
                flexShrink: 0,
                boxShadow: active ? `0 0 12px ${step.color}60` : "none",
                transition: "all 0.3s",
              }}>
                {step.icon}
              </div>
              <span style={{
                fontSize: "0.65rem", fontWeight: active ? 700 : 400,
                color: done ? "var(--text)" : "var(--muted)",
                textAlign: "center", maxWidth: 70, lineHeight: 1.3
              }}>
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {i < STATUS_STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 22,
                background: i < currentIdx ? STATUS_STEPS[i].color : "var(--border)",
                transition: "background 0.3s"
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    account.get().then(setUser).catch(() => router.push("/login"));
  }, [router]);

  const fetchOrders = async (uid: string) => {
    setLoading(true);
    try {
      const res = await databases.listDocuments(DB_ID, ORDERS_COL, [
        Query.equal("user_id", uid),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ]);
      setOrders(res.documents as unknown as Order[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders(user.$id);
  }, [user]);

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header className="glass" style={{
        padding: "14px 24px", borderRadius: 0,
        borderLeft: "none", borderRight: "none", borderTop: "none",
        display: "flex", alignItems: "center", gap: 16,
        position: "sticky", top: 0, zIndex: 100
      }}>
        <Link href="/shop" style={{ color: "var(--muted)", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "linear-gradient(135deg, #6366f1, #f97316)", padding: 7, borderRadius: 9 }}>
            <ShoppingBag size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800 }}>My Orders</span>
        </div>
        <button
          onClick={() => user && fetchOrders(user.$id)}
          style={{ marginLeft: "auto", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)", padding: "7px 14px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
            Loading your orders…
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <Package size={56} style={{ marginBottom: 16, color: "var(--muted)", opacity: 0.4 }} />
            <h2 style={{ fontWeight: 700, marginBottom: 8 }}>No orders yet</h2>
            <p style={{ color: "var(--muted)", marginBottom: 24 }}>Start shopping to see your orders here.</p>
            <Link href="/shop" className="btn btn-primary" style={{ width: "auto", padding: "12px 28px", display: "inline-flex", textDecoration: "none" }}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: 20 }}>
              {orders.length} order{orders.length > 1 ? "s" : ""} placed
            </p>

            {orders.map(order => {
              const items: OrderItem[] = JSON.parse(order.items_json || "[]");
              const isExpanded = expandedId === order.$id;
              const grandTotal = order.total_mrp + order.delivery_charge;
              const statusStep = STATUS_STEPS.find(s => s.key === order.status);

              return (
                <div key={order.$id} className="glass" style={{ borderRadius: 16, marginBottom: 16, overflow: "hidden" }}>
                  {/* Order Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : order.$id)}
                    style={{ padding: "18px 22px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
                  >
                    <div style={{ flex: 1 }}>
                      {/* Status badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: `${statusStep?.color}20`, color: statusStep?.color,
                          padding: "4px 12px", borderRadius: 999,
                          fontWeight: 700, fontSize: "0.8rem"
                        }}>
                          {statusStep?.icon}
                          {statusStep?.label || order.status}
                        </span>
                        <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
                          {new Date(order.$createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {/* Summary */}
                      <p style={{ fontWeight: 600, marginBottom: 2, fontSize: "0.95rem" }}>
                        {items.length} item{items.length > 1 ? "s" : ""} · <span style={{ color: "#22c55e" }}>₹{grandTotal}</span>
                      </p>
                      <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                        {order.apartment_name} — {order.block_number}, Flat {order.flat_number}
                      </p>
                    </div>
                    <div style={{ color: "var(--muted)", flexShrink: 0 }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid var(--border)", padding: "20px 22px" }}>

                      {/* Live Status Tracker */}
                      <StatusTracker status={order.status} />

                      {/* Items List */}
                      <h4 style={{ fontWeight: 700, marginBottom: 12, marginTop: 24, fontSize: "0.9rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Items</h4>
                      <div style={{ marginBottom: 20 }}>
                        {items.map((item, i) => (
                          <div key={i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 14px", borderRadius: 10,
                            background: "var(--surface)", marginBottom: 8, fontSize: "0.875rem"
                          }}>
                            <div>
                              <span style={{ fontWeight: 600 }}>{item.name}</span>
                              <span style={{ color: "var(--muted)", marginLeft: 8 }}>× {item.qty}</span>
                            </div>
                            <span style={{ fontWeight: 700 }}>₹{item.mrp * item.qty}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bill */}
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.875rem", color: "var(--muted)" }}>
                          <span>Items Total</span><span>₹{order.total_mrp}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.875rem", color: "var(--muted)" }}>
                          <span>Delivery Charge</span><span style={{ color: "#22c55e" }}>₹{order.delivery_charge}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.05rem", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                          <span>Grand Total</span><span style={{ color: "#22c55e" }}>₹{grandTotal}</span>
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "var(--surface)", fontSize: "0.85rem" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <MapPin size={16} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <p style={{ fontWeight: 600, marginBottom: 2 }}>{order.apartment_name}</p>
                            <p style={{ color: "var(--muted)" }}>{order.block_number}, Flat {order.flat_number}</p>
                            <p style={{ color: "#a5b4fc", marginTop: 4 }}>{SLOT_LABELS[order.time_slot] || order.time_slot}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
