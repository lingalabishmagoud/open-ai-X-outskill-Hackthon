"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, LayoutDashboard, Package, Users, ShoppingCart,
  LogOut, Plus, Trash2, ChevronDown, ChevronUp, Clock, RefreshCw,
  X, Check, AlertCircle, Lock, Pencil, Save, Brain, TrendingUp, AlertTriangle, Building2, Image as ImageIcon, ScanBarcode
} from "lucide-react";

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET;
const API = "/api/admin";

interface Order {
  $id: string; $createdAt: string;
  user_id: string; apartment_name: string; block_number: string;
  flat_number: string; time_slot: string; total_mrp: number;
  delivery_charge: number; status: string; items_json: string;
}
interface Product {
  $id: string; name: string; category: string;
  mrp: number; wholesale_price: number; image_url: string; quantity?: number; vendorId?: string; barcode?: string;
}
interface AppwriteUser {
  $id: string; email: string; name: string; $createdAt: string;
}

const SLOT_LABELS: Record<string, string> = {
  morning: "🌅 8AM–11AM", afternoon: "☀️ 12PM–3PM", evening: "🌆 6PM–9PM"
};
const STATUS_COLORS: Record<string, string> = {
  pending: "#f97316", packed: "#6366f1", out_for_delivery: "#3b82f6", delivered: "#22c55e"
};

function useAdminFetch<T>(resource: string, authed: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}?resource=${resource}`, { headers: { "x-admin-secret": ADMIN_SECRET || "" } });
      const json = await res.json();
      setData(json);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [resource, authed]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [passError, setPassError] = useState("");
  const [tab, setTab] = useState<"dashboard" | "orders" | "products" | "users" | "ai-forecasts" | "communities" | "banners" | "intakes" | "deliveries">("dashboard");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [deliveryCityId, setDeliveryCityId] = useState<string>("ALL");
  const [deliverySlot, setDeliverySlot] = useState<string>("evening");
  const [expandedApt, setExpandedApt] = useState<string | null>(null);
  
  // Apartment Modal State
  const [addAptModal, setAddAptModal] = useState<{ open: boolean; cityId: string; cityName: string; id?: string }>({ open: false, cityId: "", cityName: "" });
  const [aptForm, setAptForm] = useState({ id: "", name: "", imageUrl: "", mapsUrl: "" });

  // Banner Modal State
  const [addBannerModal, setAddBannerModal] = useState(false);
  const [bannerForm, setBannerForm] = useState({ id: "", title: "", imageUrl: "", targetCityId: "ALL", targetApartmentId: "ALL", link: "" });

  // Add product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", category: "Groceries", mrp: "", wholesale_price: "", image_url: "" });
  const [addingProduct, setAddingProduct] = useState(false);

  // Edit product
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", mrp: "", wholesale_price: "", image_url: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = (p: Product) => {
    setEditingId(p.$id);
    setEditForm({ name: p.name, category: p.category, mrp: String(p.mrp), wholesale_price: String(p.wholesale_price || ""), image_url: p.image_url || "" });
  };

  const handleSaveEdit = async (id: string) => {
    setSavingEdit(true);
    await adminPost({
      action: "update", resource: "product", id,
      data: { name: editForm.name, category: editForm.category, mrp: parseFloat(editForm.mrp), wholesale_price: parseFloat(editForm.wholesale_price) || 0, image_url: editForm.image_url }
    });
    setSavingEdit(false);
    setEditingId(null);
    reloadProducts();
  };

  const { data: ordersData, loading: ordersLoading, reload: reloadOrders } = useAdminFetch<{ documents: Order[] }>("orders", authed);
  const { data: productsData, loading: productsLoading, reload: reloadProducts } = useAdminFetch<{ documents: Product[] }>("products", authed);
  const { data: usersData, loading: usersLoading, reload: reloadUsers } = useAdminFetch<{ users: AppwriteUser[] }>("users", authed);
  const { data: citiesData, reload: reloadCities } = useAdminFetch<{ documents: any[] }>("cities", authed);
  const { data: aptsData, reload: reloadApts } = useAdminFetch<{ documents: any[] }>("apartments", authed);
  const { data: bannersData, reload: reloadBanners } = useAdminFetch<{ documents: any[] }>("banners", authed);
  const { data: intakesData, reload: reloadIntakes } = useAdminFetch<{ documents: any[] }>("intakes", authed);
  const { data: vendorsData } = useAdminFetch<{ documents: any[] }>("vendors", authed);

  const orders = ordersData?.documents || [];
  const products = productsData?.documents || [];
  const users = usersData?.users || [];
  const cities = citiesData?.documents || [];
  const apartments = aptsData?.documents || [];
  const banners = bannersData?.documents || [];
  const intakes = intakesData?.documents || [];
  const vendors = vendorsData?.documents || [];

  const adminPost = async (body: any) => {
    const res = await fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET || "" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === ADMIN_SECRET) { setAuthed(true); setPassError(""); }
    else setPassError("Wrong password. Try again.");
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await adminPost({ action: "update", resource: "order", id, data: { status } });
    reloadOrders();
  };

  const updateOrderItemVendor = async (orderId: string, itemId: string, newVendorId: string) => {
    const order = orders.find(o => o.$id === orderId);
    if (!order) return;
    const items = JSON.parse(order.items_json || "[]");
    const updatedItems = items.map((i: any) => {
      if (i.id === itemId) {
        return { ...i, vendorId: newVendorId, status: newVendorId ? "assigned" : "pending" };
      }
      return i;
    });
    await adminPost({ action: "update", resource: "order", id: orderId, data: { items_json: JSON.stringify(updatedItems) } });
    reloadOrders();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await adminPost({ action: "delete", resource: "product", id });
    reloadProducts();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await adminPost({ action: "delete", resource: "user", id });
    reloadUsers();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingProduct(true);
    await adminPost({
      action: "create", resource: "product",
      data: { ...newProduct, mrp: parseFloat(newProduct.mrp), wholesale_price: parseFloat(newProduct.wholesale_price) }
    });
    setNewProduct({ name: "", category: "Groceries", mrp: "", wholesale_price: "", image_url: "" });
    setShowAddProduct(false);
    setAddingProduct(false);
    reloadProducts();
  };

  // Group orders by time slot
  const grouped = orders.reduce((acc: Record<string, Order[]>, o) => {
    const key = o.time_slot || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const todayRevenue = orders.reduce((s, o) => s + o.total_mrp + o.delivery_charge, 0);

  if (!authed) {
    return (
      <div className="page-center">
        <div className="glass auth-card">
          <div className="auth-logo">
            <div className="icon-wrap">
              <Lock size={32} color="#6366f1" />
            </div>
            <h1>Admin Panel</h1>
            <p>HyperLocal Mission Control</p>
          </div>
          {passError && <div className="error-box">{passError}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="label">Admin Password</label>
              <input className="input" type="password" placeholder="Enter admin password" value={pass} onChange={e => setPass(e.target.value)} required autoFocus />
            </div>
            <button type="submit" className="btn btn-primary">
              <Lock size={16} /> Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "orders", label: `Orders (${orders.length})`, icon: <ShoppingCart size={18} /> },
    { id: "products", label: `Products (${products.length})`, icon: <Package size={18} /> },
    { id: "users", label: `Users (${users.length})`, icon: <Users size={18} /> },
    { id: "deliveries", label: "Deliveries", icon: <Package size={18} /> },
    { id: "communities", label: "Communities", icon: <Building2 size={18} /> },
    { id: "banners", label: "Ad Banners", icon: <ImageIcon size={18} /> },
    { id: "intakes", label: "Vendor Intakes", icon: <ScanBarcode size={18} /> },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      {/* Sidebar */}
      <aside className="glass" style={{ width: 220, flexShrink: 0, padding: "24px 12px", borderRadius: 0, borderTop: "none", borderBottom: "none", borderLeft: "none", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 12px", marginBottom: 32 }}>
          <div style={{ background: "linear-gradient(135deg, #6366f1, #f97316)", padding: 8, borderRadius: 10 }}>
            <ShoppingBag size={18} color="white" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", display: "block" }}>HyperLocal</span>
            <span style={{ color: "#6366f1", fontSize: "0.7rem", fontWeight: 600 }}>ADMIN PANEL</span>
          </div>
        </div>

        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id as typeof tab)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 14px", borderRadius: 10, marginBottom: 4,
              border: "none", cursor: "pointer", textAlign: "left", width: "100%",
              background: tab === item.id ? "rgba(99,102,241,0.2)" : "transparent",
              color: tab === item.id ? "white" : "var(--muted)",
              fontWeight: tab === item.id ? 600 : 400, fontSize: "0.875rem",
              borderLeft: tab === item.id ? "3px solid #6366f1" : "3px solid transparent",
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}

        <button
          onClick={() => setAuthed(false)}
          style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", color: "var(--muted)", fontSize: "0.875rem" }}
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "32px 28px", overflowY: "auto" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginBottom: 24 }}>Dashboard Overview</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Total Orders", value: orders.length, color: "#6366f1", icon: <ShoppingCart size={24} /> },
                { label: "Pending Orders", value: pendingCount, color: "#f97316", icon: <Clock size={24} /> },
                { label: "Total Products", value: products.length, color: "#22c55e", icon: <Package size={24} /> },
                { label: "Total Customers", value: users.length, color: "#3b82f6", icon: <Users size={24} /> },
                { label: "Total Revenue", value: `₹${todayRevenue}`, color: "#a855f7", icon: <ShoppingBag size={24} /> },
              ].map((stat, i) => (
                <div key={i} className="glass" style={{ padding: 20, borderRadius: 12 }}>
                  <div style={{ color: stat.color, marginBottom: 12 }}>{stat.icon}</div>
                  <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: 4 }}>{stat.label}</p>
                  <p style={{ fontWeight: 800, fontSize: "1.6rem" }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Orders grouped by slot */}
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Orders by Time Slot</h2>
            {Object.entries(grouped).map(([slot, slotOrders]) => (
              <div key={slot} className="glass" style={{ padding: 20, borderRadius: 12, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700 }}>{SLOT_LABELS[slot] || slot}</span>
                  <span style={{ background: "rgba(99,102,241,0.2)", padding: "2px 12px", borderRadius: 999, fontSize: "0.8rem", color: "#a5b4fc" }}>
                    {slotOrders.length} orders
                  </span>
                </div>
                {slotOrders.map(o => (
                  <div key={o.$id} style={{ padding: "10px", borderRadius: 8, background: "var(--surface)", marginBottom: 8, fontSize: "0.875rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{o.apartment_name} — {o.block_number}, Flat {o.flat_number}</span>
                      <span style={{ color: STATUS_COLORS[o.status] || "var(--muted)", fontWeight: 600 }}>● {o.status}</span>
                    </div>
                    <span style={{ color: "var(--muted)" }}>₹{o.total_mrp + o.delivery_charge}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === "orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 style={{ fontWeight: 800, fontSize: "1.6rem" }}>All Orders</h1>
              <button onClick={reloadOrders} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)", padding: "8px 14px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
            {ordersLoading ? <p style={{ color: "var(--muted)" }}>Loading…</p> : orders.map(order => (
              <div key={order.$id} className="glass" style={{ marginBottom: 12, borderRadius: 12, overflow: "hidden" }}>
                <div
                  onClick={() => setExpandedOrder(expandedOrder === order.$id ? null : order.$id)}
                  style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ fontWeight: 700 }}>{order.apartment_name}</span>
                    <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{order.block_number}, Flat {order.flat_number}</span>
                    <span style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", padding: "2px 10px", borderRadius: 999, fontSize: "0.75rem" }}>{SLOT_LABELS[order.time_slot]}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ color: STATUS_COLORS[order.status] || "var(--muted)", fontWeight: 600, fontSize: "0.875rem" }}>● {order.status}</span>
                    <span style={{ fontWeight: 700 }}>₹{order.total_mrp + order.delivery_charge}</span>
                    {expandedOrder === order.$id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                {expandedOrder === order.$id && (
                  <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border)" }}>
                    <div style={{ marginTop: 16, marginBottom: 16 }}>
                      <h4 style={{ color: "var(--text)", marginBottom: 12, fontWeight: 700 }}>Order Items & Fulfillment</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {JSON.parse(order.items_json || "[]").filter((i: any) => i.id !== "_metadata_").map((i: any) => {
                          // Find vendors who sell this product and have enough stock
                          const norm = (s: string) => (s || "").toLowerCase().replace(/\s+/g, ' ').trim();
                          const matchingProducts = products.filter(p => 
                            (p.$id === i.id || norm(p.name) === norm(i.name)) && 
                            (p.quantity || 0) >= i.qty
                          );
                          
                          return (
                            <div key={i.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)" }}>
                              <div>
                                <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{i.name}</p>
                                <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 4 }}>
                                  Qty: {i.qty} • Status: <span style={{ color: i.status === "packed" ? "#22c55e" : i.status === "assigned" ? "#3b82f6" : "#f59e0b", fontWeight: 700 }}>{(i.status || "pending").toUpperCase()}</span>
                                </p>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <select 
                                  className="input" 
                                  value={i.vendorId || ""} 
                                  onChange={e => updateOrderItemVendor(order.$id, i.id, e.target.value)}
                                  disabled={i.status === "packed"}
                                  style={{ padding: "8px 12px", borderRadius: 8, fontSize: "0.85rem", width: 220 }}
                                >
                                  <option value="">-- Do Not Assign --</option>
                                  {matchingProducts.map((p, idx) => {
                                    const vendorName = vendors.find(v => v.$id === p.vendorId)?.name || "Unknown";
                                    return <option key={`${p.vendorId}-${idx}`} value={p.vendorId || ""}>{vendorName} (Stock: {p.quantity})</option>;
                                  })}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                        {JSON.parse(order.items_json || "[]").filter((i: any) => i.id === "_metadata_" && i.instructions).map((i: any) => (
                          <div key="meta" style={{ padding: 12, background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 8, fontSize: "0.85rem", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <strong>Instructions:</strong> {i.instructions}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                      {["pending", "packed", "out_for_delivery", "delivered"].map(s => (
                        <button
                          key={s}
                          onClick={() => updateOrderStatus(order.$id, s)}
                          style={{
                            padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem",
                            background: order.status === s ? STATUS_COLORS[s] : "var(--surface)",
                            color: order.status === s ? "white" : "var(--muted)",
                          }}
                        >
                          {order.status === s && <Check size={12} style={{ marginRight: 4 }} />}{s.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 style={{ fontWeight: 800, fontSize: "1.6rem" }}>Products ({products.length})</h1>
              <button onClick={() => setShowAddProduct(!showAddProduct)} className="btn btn-primary" style={{ width: "auto", padding: "10px 20px" }}>
                <Plus size={16} /> Add Product
              </button>
            </div>

            {/* Add Product Form */}
            {showAddProduct && (
              <div className="glass" style={{ padding: 24, borderRadius: 12, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <h2 style={{ fontWeight: 700 }}>Add New Product</h2>
                  <button onClick={() => setShowAddProduct(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={18} /></button>
                </div>
                <form onSubmit={handleAddProduct}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="form-group">
                      <label className="label">Product Name *</label>
                      <input className="input" required value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Amul Butter 100g" />
                    </div>
                    <div className="form-group">
                      <label className="label">Category *</label>
                      <select className="input" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                        {["Groceries", "Dairy", "Snacks", "Beverages", "Personal Care", "Medicines", "Stationery", "Household", "Baby & Kids", "Fresh Produce"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="label">MRP (₹) *</label>
                      <input className="input" type="number" required value={newProduct.mrp} onChange={e => setNewProduct(p => ({ ...p, mrp: e.target.value }))} placeholder="e.g. 58" />
                    </div>
                    <div className="form-group">
                      <label className="label">Wholesale Price (₹)</label>
                      <input className="input" type="number" value={newProduct.wholesale_price} onChange={e => setNewProduct(p => ({ ...p, wholesale_price: e.target.value }))} placeholder="e.g. 48" />
                    </div>
                    <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                      <label className="label">Image URL</label>
                      <input className="input" type="url" value={newProduct.image_url} onChange={e => setNewProduct(p => ({ ...p, image_url: e.target.value }))} placeholder="https://images.unsplash.com/..." />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={addingProduct} style={{ width: "auto", marginTop: 8 }}>
                    {addingProduct ? "Adding…" : <><Plus size={16} /> Add Product</>}
                  </button>
                </form>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {productsLoading ? <p style={{ color: "var(--muted)" }}>Loading…</p> : products.map(p => (
                <div key={p.$id} className="glass" style={{ borderRadius: 12, overflow: "hidden" }}>
                  {/* Image */}
                  <div style={{ position: "relative" }}>
                    <img
                      src={editingId === p.$id ? (editForm.image_url || p.image_url || "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300") : (p.image_url || "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300")}
                      alt={p.name}
                      style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                      onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300"; }}
                    />
                    {/* Edit / Cancel toggle */}
                    <button
                      onClick={() => editingId === p.$id ? setEditingId(null) : startEdit(p)}
                      style={{ position: "absolute", top: 8, right: 8, background: editingId === p.$id ? "rgba(239,68,68,0.8)" : "rgba(0,0,0,0.6)", border: "none", color: "white", padding: "5px 10px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 600 }}
                    >
                      {editingId === p.$id ? <><X size={12} /> Cancel</> : <><Pencil size={12} /> Edit</>}
                    </button>
                  </div>

                  <div style={{ padding: 14 }}>
                    {editingId === p.$id ? (
                      /* ── EDIT MODE ── */
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>
                          <label className="label" style={{ fontSize: "0.72rem" }}>Product Name</label>
                          <input className="input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ padding: "8px 10px", fontSize: "0.85rem" }} />
                        </div>
                        <div>
                          <label className="label" style={{ fontSize: "0.72rem" }}>Category</label>
                          <select className="input" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ padding: "8px 10px", fontSize: "0.85rem" }}>
                            {["Groceries","Dairy","Snacks","Beverages","Personal Care","Medicines","Stationery","Household","Baby & Kids","Fresh Produce"].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <label className="label" style={{ fontSize: "0.72rem" }}>MRP (₹)</label>
                            <input className="input" type="number" value={editForm.mrp} onChange={e => setEditForm(f => ({ ...f, mrp: e.target.value }))} style={{ padding: "8px 10px", fontSize: "0.85rem" }} />
                          </div>
                          <div>
                            <label className="label" style={{ fontSize: "0.72rem" }}>Wholesale (₹)</label>
                            <input className="input" type="number" value={editForm.wholesale_price} onChange={e => setEditForm(f => ({ ...f, wholesale_price: e.target.value }))} style={{ padding: "8px 10px", fontSize: "0.85rem" }} />
                          </div>
                        </div>
                        <div>
                          <label className="label" style={{ fontSize: "0.72rem" }}>Image URL</label>
                          <input className="input" type="url" value={editForm.image_url} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." style={{ padding: "8px 10px", fontSize: "0.85rem" }} />
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <button
                            onClick={() => handleSaveEdit(p.$id)}
                            disabled={savingEdit}
                            style={{ flex: 1, background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", color: "white", padding: "9px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                          >
                            <Save size={14} /> {savingEdit ? "Saving…" : "Save Changes"}
                          </button>
                          <button onClick={() => deleteProduct(p.$id)} style={{ background: "rgba(239,68,68,0.15)", border: "none", color: "#f87171", padding: "9px 12px", borderRadius: 8, cursor: "pointer", display: "flex" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── VIEW MODE ── */
                      <>
                        <span style={{ fontSize: "0.7rem", color: "#a5b4fc", background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: 999 }}>{p.category}</span>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: "8px 0 6px" }}>{p.name}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ color: "#22c55e", fontWeight: 700 }}>₹{p.mrp} MRP</span>
                            {p.wholesale_price && <span style={{ color: "var(--muted)", fontSize: "0.75rem", marginLeft: 6 }}>₹{p.wholesale_price} WS</span>}
                          </div>
                          <button onClick={() => deleteProduct(p.$id)} style={{ background: "rgba(239,68,68,0.15)", border: "none", color: "#f87171", padding: "6px", borderRadius: 6, cursor: "pointer", display: "flex" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 style={{ fontWeight: 800, fontSize: "1.6rem" }}>Customers ({users.length})</h1>
              <button onClick={reloadUsers} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)", padding: "8px 14px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
            {usersLoading ? <p style={{ color: "var(--muted)" }}>Loading…</p> : (
              <div className="glass" style={{ borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Name", "Email", "Joined", "Action"].map(h => (
                        <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.$id} style={{ borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <td style={{ padding: "14px 20px", fontWeight: 500 }}>{u.name || "—"}</td>
                        <td style={{ padding: "14px 20px", color: "var(--muted)" }}>{u.email}</td>
                        <td style={{ padding: "14px 20px", color: "var(--muted)", fontSize: "0.8rem" }}>{new Date(u.$createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <button onClick={() => deleteUser(u.$id)} style={{ background: "rgba(239,68,68,0.15)", border: "none", color: "#f87171", padding: "6px 12px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem" }}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {users.length === 0 && !usersLoading && (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
                <AlertCircle size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                <p>No customers yet</p>
              </div>
            )}
          </div>
        )}
        {/* ── AI FORECASTS ── */}
        {tab === "ai-forecasts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 style={{ fontWeight: 800, fontSize: "1.6rem", display: "flex", alignItems: "center", gap: 10 }}>
                <Brain size={28} color="#a855f7" /> AI Predictive Insights
              </h1>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Heatmap / High Demand */}
              <div className="glass" style={{ padding: 24, borderRadius: 16, borderLeft: "4px solid #f97316" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, color: "#f97316" }}>
                  <TrendingUp size={24} />
                  <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>Demand Spikes Detected</h2>
                </div>
                <p style={{ color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--text)" }}>🔥 High Demand Alert:</strong> The AI model has detected a 40% spike in orders for <b>Amul Milk</b> and <b>Eggs</b> from <em>Prestige Apartments</em> for the upcoming Sunday morning slot based on historical weekend data.
                </p>
                <div style={{ background: "var(--surface)", padding: 12, borderRadius: 8, fontSize: "0.85rem" }}>
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>Auto-Action Taken:</span> Instructed Vendor A to hold 50 extra units for the Sunday Morning slot.
                </div>
              </div>

              {/* Low Stock Warning */}
              <div className="glass" style={{ padding: 24, borderRadius: 16, borderLeft: "4px solid #ef4444" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, color: "#ef4444" }}>
                  <AlertTriangle size={24} />
                  <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>Inventory Depletion Risk</h2>
                </div>
                <p style={{ color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--text)" }}>📉 Low Stock Warning:</strong> <b>Aashirvaad Atta (5kg)</b> is depleting 2x faster than normal in the Evening slot across all clustered zones.
                </p>
                <div style={{ background: "var(--surface)", padding: 12, borderRadius: 8, fontSize: "0.85rem" }}>
                  <span style={{ color: "#3b82f6", fontWeight: 700 }}>Auto-Action Taken:</span> Dynamically rerouting excess incoming orders to Vendor B in the neighboring zone to prevent fulfillment failure.
                </div>
              </div>
              
              {/* Density Optimization */}
              <div className="glass" style={{ padding: 24, borderRadius: 16, borderLeft: "4px solid #3b82f6", gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, color: "#3b82f6" }}>
                  <Package size={24} />
                  <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>Hyper-Density Logistics Optimization</h2>
                </div>
                <p style={{ color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
                  The routing algorithm has successfully clustered 85% of evening orders into 3 major apartment blocks. 
                  Delivery cost per order is currently projected at <b>₹1.20</b> (down from industry standard ₹40).
                </p>
                <div style={{ width: "100%", height: 8, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: "85%", height: "100%", background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", borderRadius: 4 }}></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>
                  <span>0% Density</span>
                  <span>85% Density</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMMUNITIES ── */}
        {tab === "communities" && (
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginBottom: 24 }}>Community Manager</h1>
            <button onClick={async () => {
              const name = prompt("Enter City Name:");
              if (name) {
                await adminPost({ action: "create", resource: "cities", data: { name } });
                reloadCities();
              }
            }} className="btn btn-primary" style={{ width: "auto", marginBottom: 24 }}><Plus size={16}/> Add City</button>
            <div style={{ display: "grid", gap: 20 }}>
              {cities.map(city => (
                <div key={city.$id} className="glass" style={{ padding: 20, borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>{city.name}</h2>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={async () => {
                        const newName = prompt("Edit City Name:", city.name);
                        if (newName) {
                          await adminPost({ action: "update", resource: "cities", id: city.$id, data: { name: newName } });
                          reloadCities();
                        }
                      }} style={{ background: "transparent", color: "#6366f1", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>Edit</button>
                      <button onClick={async () => {
                        if (confirm(`Delete city ${city.name}?`)) {
                          await adminPost({ action: "delete", resource: "cities", id: city.$id });
                          reloadCities();
                        }
                      }} style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>Delete</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                    {apartments.filter(a => a.cityId === city.$id).map(apt => (
                      <div key={apt.$id} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", padding: "8px 12px", borderRadius: 8, fontSize: "0.9rem", border: "1px solid var(--border)" }}>
                        <strong>{apt.name}</strong>
                        <button onClick={() => {
                          setAptForm({ id: apt.$id, name: apt.name, imageUrl: apt.imageUrl || "", mapsUrl: apt.mapsUrl || "" });
                          setAddAptModal({ open: true, cityId: city.$id, cityName: city.name, id: apt.$id });
                        }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: "0.75rem", padding: 0 }}>✎</button>
                        <button onClick={async () => {
                          if(confirm(`Delete apartment ${apt.name}?`)){
                            await adminPost({ action: "delete", resource: "apartments", id: apt.$id });
                            reloadApts();
                          }
                        }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.75rem", padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setAptForm({ id: "", name: "", imageUrl: "", mapsUrl: "" }); setAddAptModal({ open: true, cityId: city.$id, cityName: city.name }); }} style={{ background: "none", border: "1px solid #6366f1", color: "#6366f1", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem" }}>
                    + Add Apartment
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BANNERS ── */}
        {tab === "banners" && (
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginBottom: 24 }}>Ad Banners Engine</h1>
            <button onClick={() => { setBannerForm({ id: "", title: "", imageUrl: "", targetCityId: "ALL", targetApartmentId: "ALL", link: "" }); setAddBannerModal(true); }} className="btn btn-primary" style={{ width: "auto", marginBottom: 24 }}><Plus size={16}/> New Banner</button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {banners.map(b => (
                <div key={b.$id} className="glass" style={{ borderRadius: 12, overflow: "hidden" }}>
                  <img src={b.imageUrl || "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300"} alt={b.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontWeight: 700 }}>{b.title}</h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: 4 }}>Target: {b.targetCityId} / {b.targetApartmentId}</p>
                    {b.link && <p style={{ color: "#6366f1", fontSize: "0.8rem", marginTop: 4 }}>🔗 {b.link}</p>}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button onClick={() => {
                        setBannerForm({ id: b.$id, title: b.title, imageUrl: b.imageUrl, targetCityId: b.targetCityId || "ALL", targetApartmentId: b.targetApartmentId || "ALL", link: b.link || "" });
                        setAddBannerModal(true);
                      }} style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem" }}>Edit</button>
                      <button onClick={async () => {
                        await adminPost({ action: "delete", resource: "banners", id: b.$id });
                        reloadBanners();
                      }} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem" }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INTAKES ── */}
        {tab === "intakes" && (
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginBottom: 24 }}>Vendor Intakes (Barcode Scans)</h1>
            <div style={{ display: "grid", gap: 12 }}>
              {intakes.map(i => {
                const vendorName = vendors.find(v => v.$id === i.vendorId)?.name || "Unknown Vendor";
                const liveProduct = products.find(p => p.vendorId === i.vendorId && p.barcode === i.barcode);
                const displayQty = liveProduct && liveProduct.quantity !== undefined ? liveProduct.quantity : i.quantity;
                return (
                <div key={i.$id} className="glass" style={{ padding: 16, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontWeight: 700 }}>{i.productName}</h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 4 }}>Barcode: {i.barcode} • Live Qty: <span style={{ color: "#22c55e", fontWeight: 700 }}>{displayQty}</span></p>
                    <span style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 600 }}>
                      Requested by: {vendorName}
                    </span>
                  </div>
                  {i.status === 'pending' ? (
                    <button onClick={async () => {
                      const meta = i.metadata_json ? JSON.parse(i.metadata_json) : {};
                      await adminPost({ action: "update", resource: "intakes", id: i.$id, data: { status: "approved" } });
                      
                      // Push to Master Catalog so other vendors get it instantly!
                      await adminPost({
                        action: "create",
                        resource: "master_catalog",
                        data: {
                          barcode: i.barcode,
                          name: i.productName,
                          category: meta.category || "All",
                          mrp: meta.mrp || 0,
                          wholesale_price: meta.wholesale_price || 0,
                          image_url: meta.imageUrl || ""
                        }
                      }).catch(() => console.log("Already in master catalog or error"));

                      reloadIntakes();
                      reloadProducts();
                    }} className="btn btn-primary" style={{ width: "auto", padding: "8px 16px" }}>Approve to Catalog</button>
                  ) : (
                    <span style={{ color: "#22c55e", fontWeight: 700, padding: "8px 16px", background: "rgba(34,197,94,0.1)", borderRadius: 8 }}>Approved</span>
                  )}
                </div>
              )})}
              {intakes.length === 0 && <p style={{ color: "var(--muted)" }}>No vendor intakes pending.</p>}
            </div>
          </div>
        )}

        {/* ── DELIVERIES DISPATCH ── */}
        {tab === "deliveries" && (
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginBottom: 24 }}>Deliveries Dispatch</h1>
            <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center" }}>
              <select 
                className="input" 
                value={deliveryCityId} 
                onChange={e => setDeliveryCityId(e.target.value)} 
                style={{ width: 250, padding: "10px 16px", borderRadius: 8 }}
              >
                <option value="ALL">All Cities</option>
                {cities.map(c => <option key={c.$id} value={c.$id}>{c.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                {["morning", "afternoon", "evening"].map(slot => (
                  <button
                    key={slot}
                    onClick={() => setDeliverySlot(slot)}
                    style={{
                      padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, textTransform: "capitalize",
                      background: deliverySlot === slot ? "#6366f1" : "var(--surface)",
                      color: deliverySlot === slot ? "white" : "var(--muted)", border: "none"
                    }}
                  >{slot}</button>
                ))}
              </div>
            </div>
            
            <div style={{ display: "grid", gap: 16 }}>
              {(() => {
                const slotOrders = grouped[deliverySlot] || [];
                // Filter by city if selected
                const filteredOrders = deliveryCityId === "ALL" ? slotOrders : slotOrders.filter(o => {
                  const apt = apartments.find(a => a.name === o.apartment_name);
                  return apt && apt.cityId === deliveryCityId;
                });

                const byApt = filteredOrders.reduce((acc, o) => {
                  const apt = o.apartment_name || "Unknown";
                  if(!acc[apt]) acc[apt] = [];
                  acc[apt].push(o);
                  return acc;
                }, {} as Record<string, Order[]>);

                const apts = Object.keys(byApt);
                if (apts.length === 0) return <p style={{ color: "var(--muted)" }}>No orders scheduled for this selection.</p>;

                return apts.map(apt => {
                  const aptOrders = byApt[apt];
                  const isExpanded = expandedApt === apt;
                  const deliveredCount = aptOrders.filter(o => o.status === "delivered").length;
                  const totalCount = aptOrders.length;
                  return (
                    <div key={apt} className="glass" style={{ borderRadius: 12, overflow: "hidden" }}>
                      <div 
                        onClick={() => setExpandedApt(isExpanded ? null : apt)}
                        style={{ padding: 20, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: isExpanded ? "rgba(99,102,241,0.1)" : "transparent" }}
                      >
                        <h2 style={{ fontWeight: 800, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: 10 }}>
                          <Building2 size={20} color="#6366f1" /> {apt}
                        </h2>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <span style={{ fontWeight: 700, color: deliveredCount === totalCount ? "#22c55e" : "var(--text)", fontSize: "0.9rem" }}>
                            Deliveries: {deliveredCount}/{totalCount} Completed
                          </span>
                          <span style={{ fontWeight: 700, color: "#22c55e", borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>{aptOrders.length} Orders</span>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: 20, borderTop: "1px solid var(--border)" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                            <thead>
                              <tr style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                                <th style={{ paddingBottom: 8 }}>Flat/Block</th>
                                <th style={{ paddingBottom: 8 }}>Status</th>
                                <th style={{ paddingBottom: 8 }}>Customer ID</th>
                                <th style={{ paddingBottom: 8 }}>Items Ordered</th>
                                <th style={{ paddingBottom: 8 }}>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {aptOrders.map(o => (
                                <tr key={o.$id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                  <td style={{ padding: "12px 0", fontWeight: 700 }}>Flat {o.flat_number}, {o.block_number}</td>
                                  <td style={{ padding: "12px 0" }}>
                                    {o.status === "delivered" && <span style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 800 }}>Delivered</span>}
                                    {o.status === "out_for_delivery" && <span style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 800 }}>Out for Delivery</span>}
                                    {o.status === "packed" && <span style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 800 }}>Packed</span>}
                                    {(o.status === "pending" || !o.status) && <span style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 800 }}>Pending</span>}
                                  </td>
                                  <td style={{ padding: "12px 0", color: "var(--muted)" }}>{o.user_id?.slice(0,8)}...</td>
                                  <td style={{ padding: "12px 0", color: "var(--muted)" }}>
                                    {JSON.parse(o.items_json || "[]").map((i:any) => `${i.qty}x ${i.name}`).join(", ")}
                                  </td>
                                  <td style={{ padding: "12px 0", fontWeight: 700, color: "#22c55e" }}>₹{o.total_mrp + o.delivery_charge}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </main>

      {/* Apartment Modal */}
      {addAptModal.open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setAddAptModal({ open: false, cityId: "", cityName: "" })} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
          <div className="glass animate-in" style={{ position: "relative", zIndex: 1, padding: 32, borderRadius: 20, width: "100%", maxWidth: 480 }}>
            <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: 8 }}>Add Apartment</h2>
            <p style={{ color: "var(--muted)", marginBottom: 24 }}>Adding to {addAptModal.cityName}</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (addAptModal.id) {
                await adminPost({ action: "update", resource: "apartments", id: addAptModal.id, data: { name: aptForm.name, imageUrl: aptForm.imageUrl, mapsUrl: aptForm.mapsUrl } });
              } else {
                if (apartments.some(a => a.name.toLowerCase() === aptForm.name.toLowerCase() && a.cityId === addAptModal.cityId)) {
                  alert("An apartment with this name already exists in this city!");
                  return;
                }
                await adminPost({ action: "create", resource: "apartments", data: { cityId: addAptModal.cityId, name: aptForm.name, imageUrl: aptForm.imageUrl, mapsUrl: aptForm.mapsUrl } });
              }
              setAddAptModal({ open: false, cityId: "", cityName: "" });
              setAptForm({ id: "", name: "", imageUrl: "", mapsUrl: "" });
              reloadApts();
            }}>
              <div className="form-group">
                <label className="label">Apartment Name *</label>
                <input className="input" required value={aptForm.name} onChange={e => setAptForm({...aptForm, name: e.target.value})} placeholder="e.g. Prestige Lakeside Habitat" />
              </div>
              <div className="form-group">
                <label className="label">Cover Image URL *</label>
                <input className="input" required type="url" value={aptForm.imageUrl} onChange={e => setAptForm({...aptForm, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="label">Google Maps URL *</label>
                <input className="input" required type="url" value={aptForm.mapsUrl} onChange={e => setAptForm({...aptForm, mapsUrl: e.target.value})} placeholder="https://maps.app.goo.gl/..." />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setAddAptModal({ open: false, cityId: "", cityName: "" })} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Apartment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {addBannerModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setAddBannerModal(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
          <div className="glass animate-in" style={{ position: "relative", zIndex: 1, padding: 32, borderRadius: 20, width: "100%", maxWidth: 480 }}>
            <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: 24 }}>Create Ad Banner</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (bannerForm.id) {
                await adminPost({ action: "update", resource: "banners", id: bannerForm.id, data: { title: bannerForm.title, imageUrl: bannerForm.imageUrl, targetCityId: bannerForm.targetCityId, targetApartmentId: bannerForm.targetApartmentId, link: bannerForm.link } });
              } else {
                await adminPost({ action: "create", resource: "banners", data: { title: bannerForm.title, imageUrl: bannerForm.imageUrl, targetCityId: bannerForm.targetCityId, targetApartmentId: bannerForm.targetApartmentId, link: bannerForm.link } });
              }
              setAddBannerModal(false);
              setBannerForm({ id: "", title: "", imageUrl: "", targetCityId: "ALL", targetApartmentId: "ALL", link: "" });
              reloadBanners();
            }}>
              <div className="form-group">
                <label className="label">Banner Title *</label>
                <input className="input" required value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} placeholder="e.g. 50% Off Diwali Sale" />
              </div>
              <div className="form-group">
                <label className="label">Banner Image URL *</label>
                <input className="input" required type="url" value={bannerForm.imageUrl} onChange={e => setBannerForm({...bannerForm, imageUrl: e.target.value})} placeholder="https://..." />
              </div>

              <div className="form-group">
                <label className="label">Redirect Link (Optional)</label>
                <input className="input" value={bannerForm.link} onChange={e => setBannerForm({...bannerForm, link: e.target.value})} placeholder="e.g. ?search=maggi or /shop" />
              </div>
              
              <div className="form-group">
                <label className="label">Target City</label>
                <select className="input" value={bannerForm.targetCityId} onChange={e => setBannerForm({...bannerForm, targetCityId: e.target.value, targetApartmentId: "ALL"})}>
                  <option value="ALL">ALL CITIES</option>
                  {cities.map(c => <option key={c.$id} value={c.$id}>{c.name}</option>)}
                </select>
              </div>
              
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="label">Target Apartment</label>
                <select className="input" value={bannerForm.targetApartmentId} onChange={e => setBannerForm({...bannerForm, targetApartmentId: e.target.value})} disabled={bannerForm.targetCityId === "ALL"}>
                  <option value="ALL">ALL APARTMENTS IN CITY</option>
                  {apartments.filter(a => a.cityId === bannerForm.targetCityId).map(a => (
                    <option key={a.$id} value={a.$id}>{a.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setAddBannerModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Publish Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
