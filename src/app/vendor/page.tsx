"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Package, ShoppingCart, TrendingUp, LogOut, LayoutDashboard, ScanBarcode, Store, 
  Search, Camera, Plus, Edit2, CheckCircle2, AlertTriangle, AlertCircle, PlayCircle 
} from "lucide-react";

const API = "/api/admin";

export default function VendorPortal() {
  const [mounted, setMounted] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<any>(null);
  
  // Login State
  const [vendorPass, setVendorPass] = useState("");
  const [vendorCity, setVendorCity] = useState("ALL");
  const [cities, setCities] = useState<any[]>([]);
  const [loginError, setLoginError] = useState("");

  // Data
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [intakes, setIntakes] = useState<any[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  
  // UI State
  const [tab, setTab] = useState<"dashboard" | "picklist" | "intake" | "pos" | "inventory">("dashboard");
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success">("idle");
  const [posCart, setPosCart] = useState<{barcode: string, name: string, qty: number, price: number}[]>([]);

  // Modals
  const [alertModal, setAlertModal] = useState<{open: boolean, title: string, message: string, type: "success"|"error"|"info"}>({open: false, title: "", message: "", type: "info"});
  const [enterBarcodeModal, setEnterBarcodeModal] = useState<{open: boolean, mode: "intake" | "pos"}>({open: false, mode: "intake"});
  const [barcodeValue, setBarcodeValue] = useState("");
  
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ barcode: "", name: "", imageUrl: "", qty: 1, price: 0, mrp: 0, category: "All" });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const storedId = localStorage.getItem("hk_vendor_id");
    if (storedId) {
      setCurrentVendor({ $id: storedId });
    }
  }, []);

  const fetchData = async () => {
    try {
      const h = { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" };
      const [cRes, vRes, oRes, pRes, iRes, mRes] = await Promise.all([
        fetch(`${API}?resource=cities`, { headers: h }).then(r => r.json()),
        fetch(`${API}?resource=vendors`, { headers: h }).then(r => r.json()),
        fetch(`${API}?resource=orders`, { headers: h }).then(r => r.json()),
        fetch(`${API}?resource=products`, { headers: h }).then(r => r.json()),
        fetch(`${API}?resource=intakes`, { headers: h }).then(r => r.json()),
        fetch(`${API}?resource=master_catalog`, { headers: h }).then(r => r.json()),
      ]);
      setCities(cRes.documents || []);
      setVendors(vRes.documents || []);
      setOrders(oRes.documents || []);
      setProducts(pRes.documents || []);
      setIntakes(iRes.documents || []);
      setMasterCatalog(mRes.documents || []);
    } catch (e) {
      console.error(e);
    }
  };

  const showAlert = (title: string, message: string, type: "success"|"error"|"info" = "info") => {
    setAlertModal({ open: true, title, message, type });
  };

  // --- LOGIN LOGIC ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = vendors.find(v => v.password === vendorPass && (vendorCity === "ALL" || v.cityId === vendorCity));
    if (found) {
      setCurrentVendor(found);
      localStorage.setItem("hk_vendor_id", found.$id);
    } else {
      setLoginError("Invalid credentials or city selection.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("hk_vendor_id");
    setCurrentVendor(null);
  };

  // --- SCANNER & BARCODE LOGIC ---
  useEffect(() => {
    let scanner: any = null;
    if (scanStatus === "scanning") {
      const html5Qrcode = require("html5-qrcode");
      const ScannerClass = html5Qrcode.Html5QrcodeScanner;
      scanner = new ScannerClass("reader", { fps: 10, qrbox: { width: 250, height: 100 } }, false);
      scanner.render((text: string) => {
        scanner.clear();
        setScanStatus("success");
        handleBarcodeProcessing(text, tab === "pos" ? "pos" : "intake");
        setTimeout(() => setScanStatus("idle"), 1500);
      }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(()=>console.log("Scanner clear error")); };
  }, [scanStatus, tab]);

  const handleBarcodeProcessing = async (text: string, mode: "pos" | "intake") => {
    // 1. Check vendor's live inventory first
    const existingProduct = products.find(p => p.vendorId === currentVendor.$id && p.name.includes(text)); // Ideal if we stored barcode in products, but we'll use name match or check master catalog.
    
    // Check Master Catalog
    const masterItem = masterCatalog.find(m => m.barcode === text);

    if (mode === "pos") {
      if (masterItem) {
        setPosCart(prev => {
          const ex = prev.find(i => i.barcode === text);
          if (ex) return prev.map(i => i.barcode === text ? { ...i, qty: i.qty + 1 } : i);
          return [...prev, { barcode: text, name: masterItem.name, qty: 1, price: masterItem.wholesale_price || masterItem.mrp || 0 }];
        });
      } else {
        // Fallback for POS: ask to intake first
        showAlert("Not Found", "This item is not in the system. Please add it via Digital Shelf Intake first.", "error");
      }
      return;
    }

    if (mode === "intake") {
      // 1. Auto-fill from master catalog if it exists!
      if (masterItem) {
        setManualForm({ 
          barcode: text, name: masterItem.name, imageUrl: masterItem.image_url || "", 
          qty: 1, price: masterItem.wholesale_price || 0, mrp: masterItem.mrp || 0, category: masterItem.category || "All" 
        });
        setManualModalOpen(true);
        return;
      }

      // 2. Lookup OpenFoodFacts
      try {
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${text}.json`);
        const offJson = await offRes.json();
        if (offJson.status === 1) {
          setManualForm({ 
            barcode: text, name: offJson.product.product_name, imageUrl: offJson.product.image_url || "", 
            qty: 1, price: 0, mrp: 0, category: "Groceries" 
          });
          setManualModalOpen(true);
        } else {
          setManualForm({ barcode: text, name: "", imageUrl: "", qty: 1, price: 0, mrp: 0, category: "All" });
          setManualModalOpen(true);
        }
      } catch (err) {
        setManualForm({ barcode: text, name: "", imageUrl: "", qty: 1, price: 0, mrp: 0, category: "All" });
        setManualModalOpen(true);
      }
    }
  };

  const handleManualIntakeSubmit = async () => {
    if(!manualForm.name || manualForm.price <= 0 || manualForm.qty <= 0) return showAlert("Error", "Please fill all required fields correctly.", "error");
    setManualModalOpen(false);
    
    await fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" },
      body: JSON.stringify({ 
        action: "create", resource: "intakes", 
        data: { 
          barcode: manualForm.barcode || Date.now().toString(),
          productName: manualForm.name, quantity: manualForm.qty, status: "pending", vendorId: currentVendor?.$id,
          metadata_json: JSON.stringify({ imageUrl: manualForm.imageUrl, category: manualForm.category, mrp: manualForm.mrp, wholesale_price: manualForm.price })
        } 
      })
    });
    showAlert("Sent for Approval", `Sent ${manualForm.qty}x ${manualForm.name} to Admin!`, "success");
    fetchData(); 
  };

  const handleEditSubmit = async () => {
    if(!editForm.name || editForm.wholesale_price < 0) return showAlert("Error", "Invalid fields.", "error");
    await fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" },
      body: JSON.stringify({ action: "update", resource: "product", id: editForm.$id, data: { 
        name: editForm.name, category: editForm.category, mrp: editForm.mrp, 
        wholesale_price: editForm.wholesale_price, image_url: editForm.image_url 
      } })
    });
    setEditModalOpen(false);
    showAlert("Success", "Product updated successfully.", "success");
    fetchData();
  };

  // --- DERIVED DATA ---
  const vendorProducts = products.filter(p => p.vendorId === currentVendor?.$id);
  const vendorPendingIntakes = intakes.filter(i => i.vendorId === currentVendor?.$id && i.status === "pending");
  
  // Quick hack: assume orders containing our products represent our deliveries (in reality we need order-vendor mapping)
  const pendingDeliveriesCount = orders.filter(o => o.status !== "delivered").length;
  const totalSales = vendorProducts.reduce((acc, p) => acc + (p.wholesale_price * 10), 0); // Mock analytics

  if (!mounted) return null;

  if (!currentVendor) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        <div style={{ background: "#1e293b", padding: 40, borderRadius: 24, width: "100%", maxWidth: 400, border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)", width: 64, height: 64, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Store size={32} color="white" />
            </div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Vendor Portal</h1>
            <p style={{ color: "#94a3b8" }}>Sign in to manage your inventory</p>
          </div>
          {loginError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: "0.9rem", textAlign: "center", border: "1px solid rgba(239,68,68,0.2)" }}>{loginError}</div>}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Select City</label>
              <select className="input" value={vendorCity} onChange={e => setVendorCity(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "#0f172a", border: "1px solid #334155", color: "white" }}>
                <option value="ALL">Any City</option>
                {cities.map(c => <option key={c.$id} value={c.$id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 32 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Access Password</label>
              <input className="input" type="password" value={vendorPass} onChange={e => setVendorPass(e.target.value)} placeholder="Enter vendor password" required style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "#0f172a", border: "1px solid #334155", color: "white" }} />
            </div>
            <button type="submit" style={{ width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg, #10b981, #3b82f6)", color: "white", fontWeight: 700, fontSize: "1rem", border: "none", cursor: "pointer" }}>
              Enter Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "picklist", label: "Pick-List", icon: <Package size={20} /> },
    { id: "intake", label: "Digital Intake", icon: <ScanBarcode size={20} /> },
    { id: "pos", label: "Walk-in POS", icon: <ShoppingCart size={20} /> },
    { id: "inventory", label: "Live Inventory", icon: <Store size={20} /> },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", display: "flex" }}>
      
      {/* --- SIDEBAR --- */}
      <aside style={{ width: 260, background: "#1e293b", borderRight: "1px solid #334155", padding: "24px 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, padding: "0 8px" }}>
          <div style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)", padding: 8, borderRadius: 10 }}><Store size={20} color="white" /></div>
          <div>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", display: "block" }}>VendorHub</span>
            <span style={{ color: "#3b82f6", fontSize: "0.75rem", fontWeight: 700, letterSpacing: 1 }}>PRO PORTAL</span>
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.2s",
                background: tab === item.id ? "rgba(59,130,246,0.15)" : "transparent",
                color: tab === item.id ? "#3b82f6" : "#94a3b8",
                fontWeight: tab === item.id ? 700 : 500
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <button onClick={handleLogout} style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "none", cursor: "pointer", background: "transparent", color: "#ef4444", fontWeight: 600 }}>
          <LogOut size={20} /> Secure Logout
        </button>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={{ flex: 1, padding: "40px", overflowY: "auto", height: "100vh" }}>
        
        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="animate-in">
            <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 32 }}>Overview</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 40 }}>
              <div style={{ background: "#1e293b", padding: 24, borderRadius: 20, border: "1px solid #334155", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: -20, top: -20, opacity: 0.05 }}><TrendingUp size={120} /></div>
                <p style={{ color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>Estimated Revenue</p>
                <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#10b981" }}>₹{totalSales.toLocaleString()}</h2>
              </div>
              <div style={{ background: "#1e293b", padding: 24, borderRadius: 20, border: "1px solid #334155" }}>
                <p style={{ color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>Pending Pick-List</p>
                <h2 style={{ fontSize: "2.5rem", fontWeight: 800 }}>{pendingDeliveriesCount} <span style={{ fontSize: "1rem", color: "#94a3b8" }}>orders</span></h2>
              </div>
              <div style={{ background: "#1e293b", padding: 24, borderRadius: 20, border: "1px solid #334155" }}>
                <p style={{ color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>Live Catalog Size</p>
                <h2 style={{ fontSize: "2.5rem", fontWeight: 800 }}>{vendorProducts.length} <span style={{ fontSize: "1rem", color: "#94a3b8" }}>items</span></h2>
              </div>
            </div>
            
            <div style={{ background: "#1e293b", padding: 32, borderRadius: 24, border: "1px solid #334155" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>Pending Admin Approvals</h3>
              {vendorPendingIntakes.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No pending items. You are all caught up!</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {vendorPendingIntakes.map(i => (
                    <div key={i.$id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, background: "rgba(249,115,22,0.1)", borderRadius: 12, border: "1px solid rgba(249,115,22,0.2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ background: "rgba(249,115,22,0.2)", width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><AlertCircle size={20} color="#f97316" /></div>
                        <div>
                          <p style={{ fontWeight: 700, color: "white" }}>{i.productName}</p>
                          <p style={{ fontSize: "0.85rem", color: "#f97316" }}>Waiting for Admin Approval</p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800 }}>Qty: {i.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* INVENTORY */}
        {tab === "inventory" && (
          <div className="animate-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
              <div>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>Digital Catalog</h1>
                <p style={{ color: "#94a3b8" }}>Manage your synced products and edit details.</p>
              </div>
              <button onClick={() => setTab("intake")} style={{ background: "#3b82f6", color: "white", padding: "10px 20px", borderRadius: 12, border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={18} /> Add New Item
              </button>
            </div>
            
            <div style={{ background: "#1e293b", borderRadius: 24, border: "1px solid #334155", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid #334155" }}>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontWeight: 600 }}>Image</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontWeight: 600 }}>Product Name</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontWeight: 600 }}>Category</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontWeight: 600 }}>MRP</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontWeight: 600 }}>Wholesale</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorProducts.map(p => (
                    <tr key={p.$id} style={{ borderBottom: "1px solid #334155", transition: "background 0.2s" }} className="hover-row">
                      <td style={{ padding: "16px 24px" }}>
                        {p.image_url ? (
                          <><img src={p.image_url} onError={(e)=>{e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling!.setAttribute('style','display:block;width:48px;height:48px;border-radius:12px;background:#334155');}} alt={p.name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} /><div style={{display:'none'}}/></>
                        ) : <div style={{ width: 48, height: 48, borderRadius: 12, background: "#334155" }} />}
                      </td>
                      <td style={{ padding: "16px 24px", fontWeight: 700, fontSize: "1.05rem" }}>{p.name}</td>
                      <td style={{ padding: "16px 24px", color: "#cbd5e1" }}>
                        <span style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", padding: "4px 10px", borderRadius: 20, fontSize: "0.85rem", fontWeight: 600 }}>{p.category || "All"}</span>
                      </td>
                      <td style={{ padding: "16px 24px", fontWeight: 600, color: "#94a3b8", textDecoration: "line-through" }}>₹{p.mrp}</td>
                      <td style={{ padding: "16px 24px", fontWeight: 800, color: "#10b981", fontSize: "1.1rem" }}>₹{p.wholesale_price}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <button onClick={() => { setEditForm({...p}); setEditModalOpen(true); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #334155", color: "white", padding: "8px 16px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                          <Edit2 size={14} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vendorPendingIntakes.map(i => {
                    const meta = i.metadata_json ? JSON.parse(i.metadata_json) : {};
                    return (
                      <tr key={i.$id} style={{ borderBottom: "1px solid #334155", background: "rgba(249,115,22,0.05)" }} className="hover-row">
                        <td style={{ padding: "16px 24px" }}>
                          {meta.imageUrl ? (
                            <><img src={meta.imageUrl} onError={(e)=>{e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling!.setAttribute('style','display:block;width:48px;height:48px;border-radius:12px;background:#334155');}} alt={i.productName} style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} /><div style={{display:'none'}}/></>
                          ) : <div style={{ width: 48, height: 48, borderRadius: 12, background: "#334155" }} />}
                        </td>
                        <td style={{ padding: "16px 24px", fontWeight: 700, fontSize: "1.05rem" }}>
                          {i.productName} <br/>
                          <span style={{ fontSize: "0.8rem", color: "#f97316", background: "rgba(249,115,22,0.1)", padding: "2px 6px", borderRadius: 4, marginTop: 4, display: "inline-block" }}>Pending Approval (Qty: {i.quantity})</span>
                        </td>
                        <td style={{ padding: "16px 24px", color: "#cbd5e1" }}>
                          <span style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", padding: "4px 10px", borderRadius: 20, fontSize: "0.85rem", fontWeight: 600 }}>{meta.category || "Unknown"}</span>
                        </td>
                        <td style={{ padding: "16px 24px", fontWeight: 600, color: "#94a3b8", textDecoration: "line-through" }}>₹{meta.mrp || 0}</td>
                        <td style={{ padding: "16px 24px", fontWeight: 800, color: "#10b981", fontSize: "1.1rem" }}>₹{meta.wholesale_price || 0}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ color: "#94a3b8", fontSize: "0.9rem", fontWeight: 600 }}>Awaiting Admin</span>
                        </td>
                      </tr>
                    );
                  })}
                  {vendorProducts.length === 0 && vendorPendingIntakes.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No products in your catalog.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INTAKE SCANNER */}
        {tab === "intake" && (
          <div className="animate-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: 8 }}>Digital Shelf Intake</h1>
              <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>Scan or enter barcodes to add items to your digital inventory.</p>
            </div>
            
            <div style={{ background: "#1e293b", padding: 32, borderRadius: 32, border: "1px solid #334155", width: "100%", maxWidth: 480, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
              <div style={{ width: "100%", height: 280, background: "#0f172a", borderRadius: 20, border: "2px dashed #334155", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, overflow: "hidden", position: "relative" }}>
                {scanStatus === "idle" && (
                  <div style={{ textAlign: "center", color: "#94a3b8" }}>
                    <Camera size={48} style={{ opacity: 0.5, margin: "0 auto 16px" }} />
                    <p style={{ fontWeight: 600 }}>Camera Ready</p>
                  </div>
                )}
                {scanStatus === "scanning" && <div id="reader" style={{ width: "100%", height: "100%", background: "black" }}></div>}
                {scanStatus === "success" && <div style={{ color: "#10b981", textAlign: "center" }}><CheckCircle2 size={64} style={{ margin: "0 auto 16px" }} /><p style={{ fontWeight: 800, fontSize: "1.2rem" }}>Barcode Found!</p></div>}
              </div>
              
              <div style={{ display: "flex", gap: 16 }}>
                <button disabled={scanStatus !== "idle"} onClick={() => setScanStatus("scanning")} style={{ flex: 1, padding: "16px", borderRadius: 16, background: "#10b981", color: "white", fontWeight: 800, border: "none", cursor: scanStatus === "idle" ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "1.1rem" }}>
                  <PlayCircle size={20} /> Start Scanner
                </button>
                <button disabled={scanStatus !== "idle"} onClick={() => { setBarcodeValue(""); setEnterBarcodeModal({open: true, mode: "intake"}); }} style={{ flex: 1, padding: "16px", borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid #334155", color: "white", fontWeight: 700, cursor: scanStatus === "idle" ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Type Barcode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WALK-IN POS */}
        {tab === "pos" && (
          <div className="animate-in" style={{ display: "flex", gap: 32, height: "100%" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>Walk-in POS</h1>
              <p style={{ color: "#94a3b8", marginBottom: 32 }}>Scan items at the counter to bill customers instantly.</p>
              
              <div style={{ background: "#1e293b", padding: 24, borderRadius: 24, border: "1px solid #334155", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700 }}>Active Scanner</h3>
                  <button onClick={() => { setBarcodeValue(""); setEnterBarcodeModal({open: true, mode: "pos"}); }} style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <Edit2 size={16}/> Manual Entry
                  </button>
                </div>
                <div style={{ width: "100%", height: 200, background: "#0f172a", borderRadius: 16, border: "2px dashed #334155", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {scanStatus === "idle" ? (
                    <button onClick={() => setScanStatus("scanning")} style={{ background: "#10b981", color: "white", padding: "12px 24px", borderRadius: 12, border: "none", fontWeight: 700, cursor: "pointer" }}>Start POS Scanner</button>
                  ) : scanStatus === "scanning" ? (
                    <div id="reader" style={{ width: "100%", height: "100%" }}></div>
                  ) : (
                    <p style={{ color: "#10b981", fontWeight: 800 }}>Added to Cart!</p>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ width: 400, background: "#1e293b", borderRadius: 24, border: "1px solid #334155", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: 24, borderBottom: "1px solid #334155", background: "rgba(0,0,0,0.2)" }}>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Current Bill</h2>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                {posCart.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", marginTop: 40 }}>
                    <ShoppingCart size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
                    <p>Cart is empty. Scan items to add.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {posCart.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", padding: 16, borderRadius: 12, border: "1px solid #334155" }}>
                        <div>
                          <p style={{ fontWeight: 700 }}>{item.name}</p>
                          <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{item.qty} x ₹{item.price}</p>
                        </div>
                        <p style={{ fontWeight: 800, color: "#10b981", fontSize: "1.1rem" }}>₹{item.qty * item.price}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: 24, background: "rgba(0,0,0,0.2)", borderTop: "1px solid #334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: "1.2rem", fontWeight: 800 }}>
                  <span>Total Due</span>
                  <span style={{ color: "#10b981" }}>₹{posCart.reduce((a, b) => a + (b.qty * b.price), 0)}</span>
                </div>
                <button disabled={posCart.length === 0} onClick={() => { setPosCart([]); showAlert("Bill Generated", "Payment collected successfully.", "success"); }} style={{ width: "100%", padding: 16, borderRadius: 12, background: "#3b82f6", color: "white", border: "none", fontWeight: 800, fontSize: "1.1rem", cursor: posCart.length ? "pointer" : "not-allowed", opacity: posCart.length ? 1 : 0.5 }}>
                  Collect Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- ALL CUSTOM MODALS --- */}

      {/* 1. Barcode Entry Modal (Shared by POS and Intake) */}
      {enterBarcodeModal.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="animate-in" style={{ background: "#1e293b", border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", width: "90%", maxWidth: 360, borderRadius: 24, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #334155", background: "rgba(0,0,0,0.2)" }}>
              <h2 style={{ fontWeight: 800, fontSize: "1.2rem" }}>Enter Barcode Manually</h2>
            </div>
            <div style={{ padding: 24 }}>
              <input autoFocus className="input" value={barcodeValue} onChange={e => setBarcodeValue(e.target.value)} placeholder="e.g. 8901058862141" style={{ width: "100%", padding: "16px", borderRadius: 12, background: "#0f172a", border: "2px solid #3b82f6", color: "white", fontSize: "1.2rem", textAlign: "center", letterSpacing: 2, marginBottom: 20 }}
                onKeyDown={(e) => { if (e.key === "Enter" && barcodeValue) { setEnterBarcodeModal({open: false, mode: "intake"}); handleBarcodeProcessing(barcodeValue, enterBarcodeModal.mode); } }}
              />
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setEnterBarcodeModal({open: false, mode: "intake"})} style={{ flex: 1, padding: 14, borderRadius: 12, background: "transparent", color: "#94a3b8", border: "1px solid #334155", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button disabled={!barcodeValue} onClick={() => { setEnterBarcodeModal({open: false, mode: "intake"}); handleBarcodeProcessing(barcodeValue, enterBarcodeModal.mode); }} style={{ flex: 1, padding: 14, borderRadius: 12, background: "#3b82f6", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>Lookup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Manual Intake Form Modal */}
      {manualModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="animate-in" style={{ background: "#1e293b", border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", width: "90%", maxWidth: 480, borderRadius: 24, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #334155", background: "rgba(0,0,0,0.2)" }}>
              <h2 style={{ fontWeight: 800, fontSize: "1.3rem" }}>Add Product to Catalog</h2>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: 4 }}>Barcode: {manualForm.barcode}</p>
            </div>
            <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Product Name *</label>
                <input className="input" required value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} placeholder="e.g. Santoor Sandalwood Soap 150g" style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#0f172a", border: "1px solid #334155", color: "white" }} />
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Category</label>
                  <select className="input" value={manualForm.category} onChange={e => setManualForm({...manualForm, category: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#0f172a", border: "1px solid #334155", color: "white" }}>
                    <option value="Groceries">Groceries</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Household">Household</option>
                    <option value="All">Other</option>
                  </select>
                </div>
                <div style={{ width: 100 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Qty *</label>
                  <input className="input" type="number" min={1} value={manualForm.qty} onChange={e => setManualForm({...manualForm, qty: parseInt(e.target.value)||1})} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#0f172a", border: "1px solid #334155", color: "white" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Printed MRP *</label>
                  <input className="input" type="number" min={0} value={manualForm.mrp} onChange={e => setManualForm({...manualForm, mrp: parseFloat(e.target.value)||0})} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#0f172a", border: "1px solid #334155", color: "white" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Selling Price *</label>
                  <input className="input" type="number" min={0} value={manualForm.price} onChange={e => setManualForm({...manualForm, price: parseFloat(e.target.value)||0})} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#0f172a", border: "2px solid #10b981", color: "white" }} />
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Image URL</label>
                <input className="input" type="url" value={manualForm.imageUrl} onChange={e => setManualForm({...manualForm, imageUrl: e.target.value})} placeholder="https://..." style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#0f172a", border: "1px solid #334155", color: "white" }} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setManualModalOpen(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: "transparent", color: "#94a3b8", border: "1px solid #334155", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleManualIntakeSubmit} style={{ flex: 2, padding: 14, borderRadius: 12, background: "#f97316", color: "white", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <TrendingUp size={18} /> Send to Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Full Edit Product Modal */}
      {editModalOpen && editForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="animate-in" style={{ background: "#1e293b", border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", width: "90%", maxWidth: 480, borderRadius: 24, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #334155", background: "rgba(0,0,0,0.2)" }}>
              <h2 style={{ fontWeight: 800, fontSize: "1.3rem" }}>Edit Product Details</h2>
            </div>
            <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Product Name</label>
                <input className="input" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#0f172a", border: "1px solid #334155", color: "white" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Category</label>
                <select className="input" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#0f172a", border: "1px solid #334155", color: "white" }}>
                  <option value="Groceries">Groceries</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Household">Household</option>
                  <option value="All">Other</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Printed MRP</label>
                  <input className="input" type="number" min={0} value={editForm.mrp} onChange={e => setEditForm({...editForm, mrp: parseFloat(e.target.value)||0})} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#0f172a", border: "1px solid #334155", color: "white" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Selling Price</label>
                  <input className="input" type="number" min={0} value={editForm.wholesale_price} onChange={e => setEditForm({...editForm, wholesale_price: parseFloat(e.target.value)||0})} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#0f172a", border: "2px solid #3b82f6", color: "white" }} />
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "#cbd5e1" }}>Image URL</label>
                <input className="input" type="url" value={editForm.image_url} onChange={e => setEditForm({...editForm, image_url: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#0f172a", border: "1px solid #334155", color: "white" }} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setEditModalOpen(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: "transparent", color: "#94a3b8", border: "1px solid #334155", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleEditSubmit} style={{ flex: 2, padding: 14, borderRadius: 12, background: "#3b82f6", color: "white", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Global Custom Alert Modal (Replaces window.alert) */}
      {alertModal.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="animate-in" style={{ background: "#1e293b", border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", width: "90%", maxWidth: 320, borderRadius: 24, overflow: "hidden", textAlign: "center", padding: 32 }}>
            {alertModal.type === "success" && <CheckCircle2 size={48} color="#10b981" style={{ margin: "0 auto 16px" }} />}
            {alertModal.type === "error" && <AlertTriangle size={48} color="#ef4444" style={{ margin: "0 auto 16px" }} />}
            {alertModal.type === "info" && <AlertCircle size={48} color="#3b82f6" style={{ margin: "0 auto 16px" }} />}
            <h2 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 8 }}>{alertModal.title}</h2>
            <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: "0.95rem" }}>{alertModal.message}</p>
            <button onClick={() => setAlertModal({...alertModal, open: false})} style={{ width: "100%", padding: 14, borderRadius: 12, background: alertModal.type === "success" ? "#10b981" : alertModal.type === "error" ? "#ef4444" : "#3b82f6", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>
              Got it
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hover-row:hover { background: rgba(255,255,255,0.02) !important; }
        .animate-in { animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus, select:focus { outline: none; border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
      `}} />
    </div>
  );
}
