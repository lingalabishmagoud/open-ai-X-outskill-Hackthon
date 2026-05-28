"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, Bike, MapPin, Package, CheckCircle, ScanBarcode, Clock, Navigation } from "lucide-react";

const RIDER_SECRET = process.env.NEXT_PUBLIC_RIDER_SECRET;
const API = "/api/admin"; // Using admin API for hackathon speed

interface Order {
  $id: string;
  time_slot: string;
  apartment_name: string;
  flat_number: string;
  block_number: string;
  items_json: string;
  status: string;
  total_mrp: number;
  delivery_charge: number;
}

export default function RiderApp() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [passError, setPassError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // App State
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedApt, setSelectedApt] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [scannedItems, setScannedItems] = useState<string[]>([]); // array of item names that have been scanned

  const loadOrders = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}?resource=orders`, {
        headers: { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" },
      });
      const json = await res.json();
      setOrders(json.documents || []);

      const vRes = await fetch(`${API}?resource=vendors`, {
        headers: { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" },
      });
      const vJson = await vRes.json();
      setVendors(vJson.documents || []);
    } catch {
      console.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [authed]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === RIDER_SECRET) {
      setAuthed(true);
      setPassError("");
    } else {
      setPassError("Wrong PIN. Try 'rider123'.");
    }
  };

  if (!authed) {
    return (
      <div className="page-center">
        <div className="glass auth-card">
          <div className="auth-logo">
            <div className="icon-wrap" style={{ background: "#f97316" }}>
              <Bike size={32} color="white" />
            </div>
            <h1>Rider App</h1>
            <p>Doorstep Verification System</p>
          </div>
          {passError && <div className="error-box">{passError}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="label">Rider PIN</label>
              <input
                className="input"
                type="password"
                placeholder="Enter Rider PIN (rider123)"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ background: "#f97316" }}>
              <Lock size={16} /> Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 1. SELECT SLOT
  if (!selectedSlot) {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", paddingBottom: 100 }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.8rem", color: "#f97316", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={28} /> Select Active Run
        </h1>
        <div style={{ display: "grid", gap: 16 }}>
          {["morning", "afternoon", "evening"].map(slot => {
            const slotOrders = orders.filter(o => o.time_slot === slot && ["pending", "packed", "out_for_delivery"].includes(o.status));
            return (
              <button key={slot} onClick={() => setSelectedSlot(slot)} className="glass" style={{ textAlign: "left", padding: 24, borderRadius: 16, cursor: "pointer", border: "2px solid transparent" }}>
                <h2 style={{ textTransform: "capitalize", fontWeight: 800, fontSize: "1.4rem", marginBottom: 8 }}>{slot} Slot</h2>
                <p style={{ color: "var(--muted)" }}>{slotOrders.length} active orders to deliver</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. SELECT APARTMENT
  if (!selectedApt) {
    const slotOrders = orders.filter(o => o.time_slot === selectedSlot && ["pending", "packed", "out_for_delivery"].includes(o.status));
    const apts = Array.from(new Set(slotOrders.map(o => o.apartment_name)));

    return (
      <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", paddingBottom: 100 }}>
        <button onClick={() => setSelectedSlot(null)} style={{ background: "none", border: "none", color: "var(--muted)", marginBottom: 16, cursor: "pointer" }}>← Back to Slots</button>
        <h1 style={{ fontWeight: 800, fontSize: "1.8rem", color: "#f97316", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <MapPin size={28} /> Select Apartment
        </h1>
        {apts.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", marginTop: 40 }}>No pending orders for this slot.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {apts.map(apt => {
              const aptOrders = slotOrders.filter(o => o.apartment_name === apt);
              const payout = aptOrders.reduce((sum, o) => sum + o.delivery_charge, 0);
              return (
                <button key={apt} onClick={() => setSelectedApt(apt)} className="glass" style={{ textAlign: "left", padding: 24, borderRadius: 16, cursor: "pointer", border: "2px solid transparent", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "8px 16px", borderBottomLeftRadius: 16, fontWeight: 800 }}>
                    Earn ₹{payout}
                  </div>
                  <h2 style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: 8, width: "80%" }}>{apt}</h2>
                  <p style={{ color: "var(--muted)", fontWeight: 600 }}>{aptOrders.length} Drop-offs</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 3. APARTMENT MANIFEST & ORDERS
  if (!activeOrder) {
    const aptOrders = orders.filter(o => o.time_slot === selectedSlot && o.apartment_name === selectedApt && ["pending", "packed", "out_for_delivery"].includes(o.status));
    
    // Calculate total items to pick
    const pickList: Record<string, number> = {};
    aptOrders.forEach(o => {
      JSON.parse(o.items_json || "[]").forEach((i: any) => {
        if (!pickList[i.name]) pickList[i.name] = 0;
        pickList[i.name] += i.qty;
      });
    });

    return (
      <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", paddingBottom: 100 }}>
        <button onClick={() => setSelectedApt(null)} style={{ background: "none", border: "none", color: "var(--muted)", marginBottom: 16, cursor: "pointer" }}>← Back to Apartments</button>
        <h1 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: 24 }}>{selectedApt} Run</h1>

        <div className="glass" style={{ padding: 20, borderRadius: 16, marginBottom: 24, borderLeft: "4px solid #f97316" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Package size={18}/> Multi-Stop Pick-List Route</h2>
          
          {(() => {
            const vendorSplits: Record<string, number> = {};
            let meta: any = null;
            Object.entries(pickList).forEach(([name, qty]) => {
              if(name === "_metadata_") return;
              // we don't have vendorId easily mapped here because pickList merges them.
              // Let's rely on individual items from aptOrders
            });
            const vMap: Record<string, { qty: number, items: string[] }> = {};
            aptOrders.forEach(o => {
              const oItems = JSON.parse(o.items_json || "[]");
              oItems.forEach((i: any) => {
                if(i.id === "_metadata_") return;
                const v = i.vendorId || "unknown";
                if(!vMap[v]) vMap[v] = { qty: 0, items: [] };
                vMap[v].qty += i.qty;
                if(!vMap[v].items.includes(i.name)) vMap[v].items.push(i.name);
              });
            });

            return Object.entries(vMap).map(([vid, data], idx) => {
              const vendor = vendors.find(v => v.$id === vid);
              return (
                <div key={vid} style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700 }}>Stop {idx + 1}: {vendor ? vendor.name : "Local Shop"}</div>
                    {vendor?.mapsUrl && <a href={vendor.mapsUrl} target="_blank" style={{ color: "#3b82f6", fontSize: "0.85rem", textDecoration: "none" }}>📍 Map</a>}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 4 }}>Pick {data.qty} items: {data.items.join(", ")}</div>
                </div>
              );
            });
          })()}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.2rem" }}>Drop-offs</h2>
          {aptOrders.some(o => o.status !== "out_for_delivery") && (
            <button 
              onClick={async (e) => {
                const btn = e.currentTarget;
                btn.innerHTML = "Starting...";
                for (const o of aptOrders) {
                  if (o.status !== "out_for_delivery") {
                    await fetch(API, {
                      method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" },
                      body: JSON.stringify({ action: "update", resource: "order", id: o.$id, data: { status: "out_for_delivery" } })
                    });
                  }
                }
                btn.innerHTML = "Run Started";
                btn.disabled = true;
                btn.style.opacity = "0.5";
                setTimeout(loadOrders, 1000);
              }}
              style={{ background: "#22c55e", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              Start Delivery Run
            </button>
          )}
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {aptOrders.length === 0 && <p style={{ color: "var(--muted)" }}>All delivered!</p>}
          {aptOrders.map(o => (
            <div key={o.$id} className="glass" style={{ padding: 20, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: "1.2rem" }}>Flat {o.flat_number}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Block {o.block_number}</p>
                {o.status === "out_for_delivery" && <span style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", fontSize: "0.75rem", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>Out for Delivery</span>}
              </div>
              <button onClick={() => { setActiveOrder(o); setScannedItems([]); }} className="btn btn-primary" style={{ background: "#f97316", width: "auto", padding: "10px 20px" }}>
                <Navigation size={16} /> Deliver
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. DOORSTEP SCAN VERIFICATION
  const itemsRequired: {name: string, qty: number, id?: string}[] = JSON.parse(activeOrder.items_json || "[]");
  const isFullyScanned = itemsRequired.filter(i => i.id !== "_metadata_").every(req => {
    const scannedCount = scannedItems.filter(si => si === req.name).length;
    return scannedCount >= req.qty;
  });

  const handleSimulateScan = async () => {
    const barcode = prompt("Scan Barcode at Doorstep:");
    if (!barcode) return;
    
    // Simulate OpenFoodFacts lookup
    let productName = "Unknown Product";
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const json = await res.json();
      if (json.status === 1) productName = json.product.product_name || "Unknown Product";
      else productName = prompt("Product not found. Enter manual name (e.g. what the item actually is):") || "Custom Item";
    } catch(e) {
      productName = prompt("Enter manual name:") || "Custom Item";
    }

    // Check if product belongs to this order
    const required = itemsRequired.find(i => i.name.toLowerCase() === productName.toLowerCase() || i.name.toLowerCase().includes(productName.toLowerCase()) || productName.toLowerCase().includes(i.name.toLowerCase()));
    
    if (required) {
      const alreadyScannedCount = scannedItems.filter(si => si === required.name).length;
      if (alreadyScannedCount < required.qty) {
        setScannedItems(prev => [...prev, required.name]);
        // Note: Using alert makes it feel like an interactive tool
        alert(`✅ Verified: ${productName} belongs to this order!`);
      } else {
        alert(`❌ You already scanned enough of ${productName} for this order.`);
      }
    } else {
      alert(`❌ ERROR: ${productName} DOES NOT BELONG TO FLAT ${activeOrder.flat_number}!\nPrevented wrong delivery.`);
    }
  };

  const markDelivered = async () => {
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" },
      body: JSON.stringify({ action: "update", resource: "order", id: activeOrder.$id, data: { status: "delivered" } })
    });
    alert("Delivery completed!");
    setActiveOrder(null);
    loadOrders();
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", paddingBottom: 100 }}>
      <button onClick={() => setActiveOrder(null)} style={{ background: "none", border: "none", color: "var(--muted)", marginBottom: 16, cursor: "pointer" }}>← Back to Drop-offs</button>
      
      <div className="glass animate-in" style={{ padding: 32, borderRadius: 20, textAlign: "center" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.8rem", marginBottom: 8, color: "#f97316" }}>
          Final Stop: Flat {activeOrder.flat_number}
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: 16 }}>Scan items at the door to prevent missing items.</p>
        
        {(() => {
          const itemsRequiredParsed = JSON.parse(activeOrder.items_json || "[]");
          const meta = itemsRequiredParsed.find((i:any) => i.id === "_metadata_");
          if(meta && meta.instructions) {
            return (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", padding: 12, borderRadius: 8, marginBottom: 24, fontWeight: 700 }}>
                Instructions: {meta.instructions}
              </div>
            );
          }
          return null;
        })()}

        <div style={{ background: "var(--surface)", borderRadius: 16, padding: 16, marginBottom: 24, textAlign: "left" }}>
          {itemsRequired.filter(i => i.id !== "_metadata_").map(req => {
            const scannedCount = scannedItems.filter(si => si === req.name).length;
            const complete = scannedCount >= req.qty;
            return (
              <div key={req.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: complete ? "rgba(34,197,94,0.1)" : "var(--surface)", border: complete ? "1px solid #22c55e" : "1px solid var(--border)", borderRadius: 12, marginBottom: 8, transition: "all 0.3s" }}>
                <span style={{ fontWeight: complete ? 700 : 500, color: complete ? "#22c55e" : "var(--text)" }}>{req.name}</span>
                <span style={{ fontWeight: 800, color: complete ? "#22c55e" : "var(--muted)" }}>{scannedCount} / {req.qty}</span>
              </div>
            );
          })}
        </div>

        {!isFullyScanned ? (
          <button onClick={handleSimulateScan} className="btn btn-primary" style={{ background: "#f97316", width: "100%", height: 60, fontSize: "1.1rem" }}>
            <ScanBarcode size={24} style={{ marginRight: 8 }} /> Scan Item at Door
          </button>
        ) : (
          <button onClick={markDelivered} className="btn btn-primary animate-in" style={{ background: "#22c55e", width: "100%", height: 60, fontSize: "1.1rem" }}>
            <CheckCircle size={24} style={{ marginRight: 8 }} /> All Verified. Mark Delivered
          </button>
        )}
      </div>
    </div>
  );
}
