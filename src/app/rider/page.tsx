"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, Bike, MapPin, Package, CheckCircle, ScanBarcode, Clock, Navigation, Sun, Sunrise, Moon } from "lucide-react";

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
  map_link?: string;
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
  const [scannedItems, setScannedItems] = useState<string[]>([]); // array of item names that have been scanned for flat delivery
  const [activeVendorPickup, setActiveVendorPickup] = useState<string | null>(null);
  const [pickedItemsByVendor, setPickedItemsByVendor] = useState<Record<string, string[]>>({});
  
  // Scanner State
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success">("idle");
  const [scanMode, setScanMode] = useState<"vendor" | "doorstep" | null>(null);
  
  // Modal States
  const [confirmModal, setConfirmModal] = useState<{open: boolean, apt: string | null}>({open: false, apt: null});
  const [manualScanModal, setManualScanModal] = useState<{open: boolean, value: string}>({open: false, value: ""});
  
  // Toast System
  const [toast, setToast] = useState<{message: string, type: "success" | "error" | "info", id: number} | null>(null);
  
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };
  // --- SCANNER HANDLERS ---
  const handleVendorScanComplete = async (barcode: string) => {
     if (!activeVendorPickup) return;
     const vid = activeVendorPickup;
     
     const aptOrders = orders.filter(o => o.time_slot === selectedSlot && o.apartment_name === selectedApt && ["pending", "packed", "out_for_delivery"].includes(o.status));
     const vMap: any = {};
     aptOrders.forEach(o => {
       const oItems = JSON.parse(o.items_json || "[]");
       oItems.forEach((i: any) => {
         if(i.id === "_metadata_") return;
         const v = i.vendorId || "unknown";
         if(!vMap[v]) vMap[v] = { qty: 0, packedQty: 0, items: [] };
         vMap[v].qty += i.qty;
         const existingItem = vMap[v].items.find((item: any) => item.name === i.name);
         if (existingItem) { existingItem.qty += i.qty; } 
         else { vMap[v].items.push({ name: i.name, qty: i.qty }); }
       });
     });
     
     const vendorData = vMap[vid];
     if (!vendorData) return;

     let productName = "Unknown Product";
     try {
       const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
       const json = await res.json();
       if (json.status === 1) productName = json.product.product_name || "Unknown Product";
     } catch(e) {}

     const required = vendorData.items.find((i: any) => i.name.toLowerCase() === productName.toLowerCase() || i.name.toLowerCase().includes(productName.toLowerCase()) || productName.toLowerCase().includes(i.name.toLowerCase()));
     
     if (required) {
        const pickedForVendor = pickedItemsByVendor[vid] || [];
        const alreadyScannedCount = pickedForVendor.filter(si => si === required.name).length;
        if (alreadyScannedCount < required.qty) {
          setPickedItemsByVendor(prev => {
            const prevList = prev[vid] || [];
            return { ...prev, [vid]: [...prevList, required.name] };
          });
          showToast(`Verified: ${productName} picked!`, "success");
        } else {
          showToast(`You already picked enough of ${productName}.`, "info");
        }
     } else {
        showToast(`ERROR: ${productName} is NOT assigned to this vendor! Leave it behind.`, "error");
     }
  }, [activeVendorPickup, orders, selectedSlot, selectedApt, pickedItemsByVendor]);

  const handleDoorstepScanComplete = useCallback(async (barcode: string) => {
    if (!activeOrder) return;
    let productName = "Unknown Product";
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const json = await res.json();
      if (json.status === 1) productName = json.product.product_name || "Unknown Product";
    } catch(e) {}

    const orderItems = JSON.parse(activeOrder.items_json || "[]");
    const itemInOrder = orderItems.find((i: any) => i.id !== "_metadata_" && (i.name.toLowerCase() === productName.toLowerCase() || i.name.toLowerCase().includes(productName.toLowerCase()) || productName.toLowerCase().includes(i.name.toLowerCase())));
    
    if (itemInOrder) {
      const scannedCount = scannedItems.filter((i: string) => i === itemInOrder.name).length;
      if (scannedCount < itemInOrder.qty) {
        setScannedItems(prev => [...prev, itemInOrder.name]);
        showToast(`Verified: ${productName}`, "success");
      } else {
        showToast(`You already scanned all required ${productName}.`, "info");
      }
    } else {
      showToast(`ERROR: ${productName} is NOT in this order! Do not deliver.`, "error");
    }
  }, [activeOrder, scannedItems]);

  // --- SCANNER LOGIC ---
  useEffect(() => {
    let scanner: any = null;
    if (scanStatus === "scanning" && scanMode) {
      const readerEl = document.getElementById("reader");
      if (!readerEl) return;
      const html5Qrcode = require("html5-qrcode");
      const ScannerClass = html5Qrcode.Html5QrcodeScanner;
      scanner = new ScannerClass("reader", { fps: 10, qrbox: { width: 250, height: 100 } }, false);
      scanner.render((text: string) => {
        scanner.clear().catch(()=>{});
        setScanStatus("success");
        if (scanMode === "vendor") handleVendorScanComplete(text);
        else if (scanMode === "doorstep") handleDoorstepScanComplete(text);
        setTimeout(() => {
          setScanStatus("idle");
          setScanMode(null);
        }, 1500);
      }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(()=>console.log("Scanner clear error")); };
  }, [scanStatus, scanMode]);

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
      <div className="page-center" style={{ background: "radial-gradient(circle at top left, #2a110a, #0f172a)" }}>
        <div className="glass auth-card animate-in" style={{ padding: 40, borderRadius: 24, borderTop: "4px solid #f97316", boxShadow: "0 25px 50px -12px rgba(249, 115, 22, 0.25)" }}>
          <div className="auth-logo" style={{ marginBottom: 32 }}>
            <div className="icon-wrap" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", padding: 20, borderRadius: "50%", display: "inline-flex", boxShadow: "0 10px 15px -3px rgba(249, 115, 22, 0.3)" }}>
              <Bike size={48} color="white" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 900, marginTop: 16, background: "linear-gradient(to right, #fff, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HyperLocal Rider</h1>
            <p style={{ color: "#94a3b8", fontWeight: 500 }}>Advanced Delivery Network</p>
          </div>
          {passError && <div className="error-box" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: 12, borderRadius: 12, marginBottom: 20, fontWeight: 700 }}>{passError}</div>}
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
        <div style={{ textAlign: "center", marginBottom: 32 }} className="animate-in">
           <div style={{ background: "rgba(249,115,22,0.1)", display: "inline-block", padding: 16, borderRadius: "50%", marginBottom: 12 }}>
             <Clock size={36} color="#f97316" />
           </div>
           <h1 style={{ fontWeight: 900, fontSize: "2rem", color: "white" }}>Select Shift</h1>
           <p style={{ color: "var(--muted)", fontSize: "1.1rem" }}>Choose your active delivery slot</p>
        </div>
        
        <div style={{ display: "grid", gap: 20 }}>
          {["morning", "afternoon", "evening"].map((slot, i) => {
            const slotOrders = orders.filter(o => o.time_slot === slot && ["pending", "packed", "out_for_delivery"].includes(o.status));
            
            // Vibrant themes for each slot
            const themes = {
              morning: { bg: "linear-gradient(135deg, #f59e0b, #fbbf24)", shadow: "rgba(245, 158, 11, 0.3)", icon: <Sunrise size={32} color="white" /> },
              afternoon: { bg: "linear-gradient(135deg, #3b82f6, #60a5fa)", shadow: "rgba(59, 130, 246, 0.3)", icon: <Sun size={32} color="white" /> },
              evening: { bg: "linear-gradient(135deg, #8b5cf6, #c084fc)", shadow: "rgba(139, 92, 246, 0.3)", icon: <Moon size={32} color="white" /> }
            };
            const theme = themes[slot as keyof typeof themes];

            return (
              <button 
                key={slot} 
                onClick={() => setSelectedSlot(slot)} 
                className="hover-card animate-in" 
                style={{ 
                  animationDelay: `${i * 100}ms`,
                  textAlign: "left", 
                  padding: 24, 
                  borderRadius: 24, 
                  cursor: "pointer", 
                  background: theme.bg,
                  border: "none",
                  boxShadow: `0 15px 30px -10px ${theme.shadow}`,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{ background: "rgba(255,255,255,0.2)", padding: 16, borderRadius: "50%", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {theme.icon}
                </div>
                <div>
                  <h2 style={{ textTransform: "capitalize", fontWeight: 900, fontSize: "1.8rem", marginBottom: 4, letterSpacing: "-0.02em" }}>{slot} Shift</h2>
                  <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={16} /> {slotOrders.length} active runs
                  </p>
                </div>
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
      <>
      <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", paddingBottom: 100 }} className="animate-in">
        <button onClick={() => setSelectedSlot(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: 20, color: "var(--muted)", marginBottom: 24, cursor: "pointer", fontWeight: 700 }}>← Back to Shifts</button>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", padding: 16, borderRadius: 16, boxShadow: "0 10px 15px -3px rgba(249,115,22,0.3)" }}>
             <MapPin size={32} color="white" />
          </div>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: "1.8rem", color: "white" }}>Available Runs</h1>
            <p style={{ color: "var(--muted)", fontWeight: 500 }}>{slotOrders.length} pending orders for this slot</p>
          </div>
        </div>
        
        {apts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, background: "rgba(255,255,255,0.02)", borderRadius: 24, border: "1px dashed rgba(255,255,255,0.1)" }}>
            <CheckCircle size={48} color="#34d399" style={{ marginBottom: 16, opacity: 0.5 }} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "white", marginBottom: 8 }}>All clear!</h2>
            <p style={{ color: "var(--muted)" }}>No pending orders right now.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {apts.map(apt => {
              const aptOrders = slotOrders.filter(o => o.apartment_name === apt);
              const payout = aptOrders.reduce((sum, o) => sum + o.delivery_charge, 0);
              return (
                <button 
                  key={apt} 
                  onClick={() => setConfirmModal({open: true, apt})}
                  className="glass hover-card" 
                  style={{ textAlign: "left", padding: 24, borderRadius: 16, cursor: "pointer", border: "2px solid transparent", position: "relative", overflow: "hidden", transition: "all 0.3s" }}
                >
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

      {/* Confirm Apartment Modal */}
      {confirmModal.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass animate-in" style={{ padding: 32, borderRadius: 24, maxWidth: 400, width: "90%", textAlign: "center" }}>
            <div style={{ display: "inline-flex", padding: 16, borderRadius: "50%", background: "rgba(249,115,22,0.1)", marginBottom: 16 }}>
              <MapPin size={40} color="#f97316" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: 12 }}>Lock in {confirmModal.apt}?</h2>
            <p style={{ color: "var(--muted)", marginBottom: 24 }}>Once you confirm this apartment, you are committing to this run for your current shift.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setConfirmModal({open: false, apt: null})} className="btn" style={{ flex: 1, background: "var(--surface)", color: "white" }}>Cancel</button>
              <button onClick={() => { setSelectedApt(confirmModal.apt); setConfirmModal({open: false, apt: null}); }} className="btn btn-primary" style={{ flex: 1, background: "#f97316" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
    );
  }

  // 3. APARTMENT MANIFEST & ORDERS
  if (!activeOrder) {
    const aptOrders = orders.filter(o => o.time_slot === selectedSlot && o.apartment_name === selectedApt && ["pending", "packed", "out_for_delivery"].includes(o.status));
    
    // Calculate vendors map
    const vMap: Record<string, { qty: number, packedQty: number, items: {name: string, qty: number, packedQty: number}[] }> = {};
    aptOrders.forEach(o => {
      const oItems = JSON.parse(o.items_json || "[]");
      oItems.forEach((i: any) => {
        if(i.id === "_metadata_") return;
        const v = i.vendorId || "unknown";
        if(!vMap[v]) vMap[v] = { qty: 0, packedQty: 0, items: [] };
        vMap[v].qty += i.qty;
        if(i.status === "packed") vMap[v].packedQty += i.qty;
        
        const existingItem = vMap[v].items.find(item => item.name === i.name);
        if (existingItem) {
          existingItem.qty += i.qty;
          if(i.status === "packed") existingItem.packedQty += i.qty;
        } else {
          vMap[v].items.push({ name: i.name, qty: i.qty, packedQty: i.status === "packed" ? i.qty : 0 });
        }
      });
    });

    const isRunStarted = aptOrders.every(o => o.status === "out_for_delivery");
    
    // Check if all pickups are complete
    const allPickupsComplete = Object.entries(vMap).every(([vid, data]) => {
      const pickedForVendor = pickedItemsByVendor[vid] || [];
      return data.items.every(req => {
         const pickedCount = pickedForVendor.filter(si => si === req.name).length;
         return pickedCount >= req.qty;
      });
    });

    // 3A. Vendor Pickup View
    if (activeVendorPickup) {
       const vid = activeVendorPickup;
       const vendorData = vMap[vid];
       const vendor = vendors.find(v => v.$id === vid);
       const vendorName = vendor ? vendor.name : "Local Shop";
       

       const handleVendorScanBtn = () => {
         setScanMode("vendor");
         setScanStatus("scanning");
       };

       const isVendorComplete = vendorData.items.every(req => {
         const pickedCount = (pickedItemsByVendor[vid] || []).filter(si => si === req.name).length;
         return pickedCount >= req.qty;
       });

       return (
         <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", paddingBottom: 100 }}>
           <button onClick={() => setActiveVendorPickup(null)} style={{ background: "none", border: "none", color: "var(--muted)", marginBottom: 16, cursor: "pointer" }}>← Back to Run Overview</button>
           
           <div className="glass animate-in" style={{ padding: 32, borderRadius: 20, textAlign: "center" }}>
             <h2 style={{ fontWeight: 800, fontSize: "1.8rem", marginBottom: 8, color: "#f97316" }}>
               Pickup Point: {vendorName}
             </h2>
             <p style={{ color: "var(--muted)", marginBottom: 24 }}>Scan assigned items before you leave the shop.</p>

             <div style={{ background: "var(--surface)", borderRadius: 16, padding: 16, marginBottom: 24, textAlign: "left" }}>
               {vendorData.items.map(req => {
                 const pickedCount = (pickedItemsByVendor[vid] || []).filter(si => si === req.name).length;
                 const complete = pickedCount >= req.qty;
                 return (
                   <div key={req.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: complete ? "rgba(34,197,94,0.1)" : "var(--surface)", border: complete ? "1px solid #22c55e" : "1px solid var(--border)", borderRadius: 12, marginBottom: 8, transition: "all 0.3s" }}>
                     <span style={{ fontWeight: complete ? 700 : 500, color: complete ? "#22c55e" : "var(--text)" }}>{req.name}</span>
                     <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                       <span style={{ fontWeight: 800, color: complete ? "#22c55e" : "var(--muted)" }}>{pickedCount} / {req.qty}</span>
                       {!complete && (
                         <button 
                           onClick={() => {
                             setPickedItemsByVendor(prev => ({ ...prev, [vid]: [...(prev[vid]||[]), req.name] }));
                             showToast(`Manually ticked ${req.name}`, "info");
                           }}
                           style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}
                         >Tick</button>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>

             {!isVendorComplete ? (
               <button onClick={handleVendorScanBtn} className="btn btn-primary" style={{ background: "#f97316", width: "100%", height: 60, fontSize: "1.1rem" }}>
                 <ScanBarcode size={24} style={{ marginRight: 8 }} /> Scan Item from Vendor
               </button>
             ) : (
               <button onClick={() => setActiveVendorPickup(null)} className="btn btn-primary animate-in" style={{ background: "#22c55e", width: "100%", height: 60, fontSize: "1.1rem" }}>
                 <CheckCircle size={24} style={{ marginRight: 8 }} /> All Verified. Return to Route
               </button>
             )}
           </div>

           {/* Global Scanner Modal (Vendor View) */}
           {scanStatus === "scanning" && scanMode === "vendor" && (
             <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", flexDirection: "column" }}>
               <div style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <h2 style={{ color: "white", fontWeight: 800 }}>Scanner Active</h2>
                 <button onClick={() => { setScanStatus("idle"); setScanMode(null); }} style={{ background: "none", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" }}>Cancel</button>
               </div>
               <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div id="reader" style={{ width: "100%", maxWidth: 500, height: "100%", background: "black" }}></div>
               </div>
             </div>
           )}
           
           {scanStatus === "success" && scanMode === "vendor" && (
             <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#22c55e" }}>
               <CheckCircle size={80} style={{ marginBottom: 16 }} />
               <h2 style={{ fontWeight: 800, fontSize: "2rem" }}>Scanned!</h2>
             </div>
           )}

         </div>
       );
    }

    // 3B. Main Apartment View (Pickup Points + Drop-offs)
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", paddingBottom: 100 }}>
        {!isRunStarted && <button onClick={() => setSelectedApt(null)} style={{ background: "none", border: "none", color: "var(--muted)", marginBottom: 16, cursor: "pointer" }}>← Back to Apartments</button>}
        <h1 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: 24 }}>{selectedApt} Run</h1>

        {!isRunStarted && (
          <div className="glass" style={{ padding: 20, borderRadius: 16, marginBottom: 24, borderLeft: "4px solid #f97316" }}>
            <h2 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Package size={18}/> Multi-Stop Pick-List Route</h2>
            
            {Object.entries(vMap).map(([vid, data], idx) => {
              const vendor = vendors.find(v => v.$id === vid);
              const vendorName = vendor ? vendor.name : "Local Shop";
              const isVendorComplete = data.items.every(req => {
                const pickedCount = (pickedItemsByVendor[vid] || []).filter(si => si === req.name).length;
                return pickedCount >= req.qty;
              });

              const isFullyPacked = data.packedQty >= data.qty;

              return (
                <div key={vid} style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                      Stop {idx + 1}: {vendorName}
                      {isVendorComplete && <CheckCircle size={14} color="#22c55e" />}
                      {!isVendorComplete && !isFullyPacked && <span style={{fontSize:"0.75rem", color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "2px 6px", borderRadius:4}}>⏳ Waiting on Vendor ({data.packedQty}/{data.qty} packed)</span>}
                    </div>
                    {vendor?.mapsUrl && <a href={vendor.mapsUrl} target="_blank" style={{ color: "#3b82f6", fontSize: "0.85rem", textDecoration: "none", fontWeight: 700 }}>📍 Map</a>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Pick {data.qty} items</div>
                    <button 
                      disabled={!isFullyPacked}
                      onClick={() => setActiveVendorPickup(vid)} 
                      style={{ background: isVendorComplete ? "rgba(34,197,94,0.1)" : isFullyPacked ? "#f97316" : "rgba(255,255,255,0.1)", color: isVendorComplete ? "#22c55e" : isFullyPacked ? "white" : "gray", border: "none", padding: "6px 12px", borderRadius: 8, fontWeight: 700, cursor: isFullyPacked ? "pointer" : "not-allowed", fontSize: "0.85rem" }}
                    >
                      {isVendorComplete ? "Completed" : "Start Pickup"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.2rem" }}>Drop-offs</h2>
          {!isRunStarted && (
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
              disabled={!allPickupsComplete}
              style={{ background: allPickupsComplete ? "#22c55e" : "var(--surface)", color: allPickupsComplete ? "white" : "var(--muted)", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 800, cursor: allPickupsComplete ? "pointer" : "not-allowed", transition: "all 0.3s" }}
            >
              Start Delivery Run
            </button>
          )}
        </div>
        
        {!isRunStarted ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", background: "var(--surface)", borderRadius: 16 }}>
            <Navigation size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>Complete all pickups to unlock delivery route.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {aptOrders.length === 0 ? (
              <div className="animate-in" style={{ textAlign: "center", padding: 40, background: "rgba(34,197,94,0.1)", border: "1px solid #22c55e", borderRadius: 16 }}>
                <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
                <h2 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#22c55e", marginBottom: 8 }}>Delivery Run Completed!</h2>
                <p style={{ color: "var(--muted)", marginBottom: 24 }}>All drop-offs for {selectedApt} are finished.</p>
                <button 
                  onClick={() => { setSelectedApt(null); setPickedItemsByVendor({}); }} 
                  className="btn btn-primary" style={{ background: "#22c55e" }}
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              aptOrders.map(o => (
                <div key={o.$id} className="glass" style={{ padding: 20, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: 8 }}>
                      Flat {o.flat_number}
                      <a href={o.map_link ? o.map_link : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.apartment_name)}`} target="_blank" style={{ color: "#3b82f6", fontSize: "0.85rem", textDecoration: "none", fontWeight: 700, background: "rgba(59,130,246,0.1)", padding: "2px 8px", borderRadius: 12 }}>📍 Delivery Map</a>
                    </h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Block {o.block_number}</p>
                    {o.status === "out_for_delivery" && <span style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", fontSize: "0.75rem", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>Out for Delivery</span>}
                  </div>
                  <button onClick={() => { setActiveOrder(o); setScannedItems([]); }} className="btn btn-primary" style={{ background: "#f97316", width: "auto", padding: "10px 20px" }}>
                    <Navigation size={16} /> Deliver
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // 4. DOORSTEP SCAN VERIFICATION
  const itemsRequired: {name: string, qty: number, id?: string}[] = JSON.parse(activeOrder.items_json || "[]");
  const isFullyScanned = itemsRequired.filter(i => i.id !== "_metadata_").every(req => {
    const scannedCount = scannedItems.filter(si => si === req.name).length;
    return scannedCount >= req.qty;
  });



  const markDelivered = async () => {
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "" },
      body: JSON.stringify({ action: "update", resource: "order", id: activeOrder.$id, data: { status: "delivered" } })
    });
    showToast("Delivery successfully completed!", "success");
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
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { setScanMode("doorstep"); setScanStatus("scanning"); }} className="btn btn-primary" style={{ flex: 1, background: "#3b82f6", borderRadius: 12, padding: "12px", height: "auto" }}>
              <ScanBarcode size={20} style={{ marginRight: 8 }} /> Camera Scan
            </button>
            <button onClick={() => setManualScanModal({open: true, value: ""})} className="btn btn-primary" style={{ flex: 1, background: "var(--surface)", color: "var(--text)", borderRadius: 12, padding: "12px", height: "auto" }}>
              ⌨️ Manual Entry
            </button>
          </div>
        ) : (
          <button onClick={markDelivered} className="btn btn-primary animate-in" style={{ background: "#22c55e", width: "100%", height: 60, fontSize: "1.1rem" }}>
            <CheckCircle size={24} style={{ marginRight: 8 }} /> All Verified. Mark Delivered
          </button>
        )}
      </div>

      {/* Global Scanner Modal */}
      {scanStatus === "scanning" && scanMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ color: "white", fontWeight: 800 }}>Scanner Active</h2>
            <button onClick={() => { setScanStatus("idle"); setScanMode(null); }} style={{ background: "none", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" }}>Cancel</button>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
             <div id="reader" style={{ width: "100%", maxWidth: 500, height: "100%", background: "black" }}></div>
          </div>
        </div>
      )}
      
      {scanStatus === "success" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#22c55e" }}>
          <CheckCircle size={80} style={{ marginBottom: 16 }} />
          <h2 style={{ fontWeight: 800, fontSize: "2rem" }}>Scanned!</h2>
        </div>
      )}

      {/* Confirm Apartment Modal */}
      {/* Removed from bottom since it is now in the Apartment Selection early return */}

      {/* Manual Entry Modal */}
      {manualScanModal.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass animate-in" style={{ padding: 24, borderRadius: 24, maxWidth: 400, width: "90%" }}>
            <h2 style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: 16 }}>Manual Code Entry</h2>
            <input 
              type="text" 
              className="input" 
              placeholder="Enter product barcode..." 
              value={manualScanModal.value} 
              onChange={e => setManualScanModal({...manualScanModal, value: e.target.value})}
              autoFocus
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setManualScanModal({open: false, value: ""})} className="btn" style={{ flex: 1, background: "var(--surface)", color: "white" }}>Cancel</button>
              <button onClick={() => {
                setManualScanModal({open: false, value: ""});
                if(manualScanModal.value) handleDoorstepScanComplete(manualScanModal.value);
              }} className="btn btn-primary" style={{ flex: 1, background: "#3b82f6" }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast System */}
      {toast && (
        <div className="animate-in" style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.type === "success" ? "#059669" : toast.type === "error" ? "#dc2626" : "#3b82f6", color: "white", padding: "12px 24px", borderRadius: 100, fontWeight: 700, boxShadow: "0 10px 25px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: 12 }}>
          {toast.type === "success" && <CheckCircle size={20} />}
          {toast.message}
        </div>
      )}

    </div>
  );
}
