"use client";

import { useEffect, useState, useMemo } from "react";
import { databases, PRODUCTS_COL, DB_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useCart } from "@/context/CartContext";
import { account } from "@/lib/appwrite";
import { Models } from "appwrite";
import Link from "next/link";
import {
  ShoppingBag, Search, ShoppingCart, Plus, Minus, LogOut,
  ChevronRight, X, Home, Package, ClipboardList, Sparkles, Users, MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Product {
  $id: string;
  name: string;
  category: string;
  mrp: number;
  wholesale_price: number;
  image_url: string;
  vendorId?: string;
}

const CATEGORIES = [
  "All", "Groceries", "Dairy", "Snacks", "Beverages",
  "Personal Care", "Medicines", "Stationery", "Household",
  "Baby & Kids", "Fresh Produce"
];

const CATEGORY_EMOJI: Record<string, string> = {
  "All": "🛒", "Groceries": "🌾", "Dairy": "🥛", "Snacks": "🍿",
  "Beverages": "🥤", "Personal Care": "🧴", "Medicines": "💊",
  "Stationery": "✏️", "Household": "🏠", "Baby & Kids": "👶",
  "Fresh Produce": "🥦"
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [aiResponse, setAiResponse] = useState<{ message: string, items: string[] } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userCommunity, setUserCommunity] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: "", phone: "", cityId: "", apartmentId: "", instructions: "" });
  const [cities, setCities] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const { items, addItem, updateQty, removeItem, totalItems, totalMRP } = useCart();
  const router = useRouter();

  // Auth check
  useEffect(() => {
    account.get().then(setUser).catch(() => router.push("/login"));
  }, [router]);

  // Fetch all products from Appwrite
  useEffect(() => {
    const fetchAll = async () => {
      try {
        let allProducts: Product[] = [];
        let offset = 0;
        const limit = 100;
        while (true) {
          const res = await databases.listDocuments(DB_ID, PRODUCTS_COL, [
            Query.limit(limit),
            Query.offset(offset),
          ]);
          allProducts = [...allProducts, ...(res.documents as unknown as Product[])];
          if (res.documents.length < limit) break;
          offset += limit;
        }
        setProducts(allProducts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();

    if (typeof window !== "undefined") {
      const data = localStorage.getItem("hk_user_settings");
      if (data) {
        const parsed = JSON.parse(data);
        setUserCommunity(parsed);
        setSettingsForm({ name: parsed.name || "", phone: parsed.phone || "", cityId: parsed.cityId || "", apartmentId: parsed.apartmentId || "", instructions: parsed.instructions || "" });
      } else {
        // legacy check
        const leg = localStorage.getItem("hk_user_community");
        if(leg) setUserCommunity(JSON.parse(leg));
      }
    }

    const fetchMeta = async () => {
      try {
        const [bRes, vRes, cRes, aRes] = await Promise.all([
          fetch("/api/public?resource=banners"),
          fetch("/api/public?resource=vendors"),
          fetch("/api/public?resource=cities"),
          fetch("/api/public?resource=apartments")
        ]);
        const bJson = await bRes.json();
        const vJson = await vRes.json();
        const cJson = await cRes.json();
        const aJson = await aRes.json();
        setBanners(bJson.documents || []);
        setVendors(vJson.documents || []);
        setCities(cJson.documents || []);
        setApartments(aJson.documents || []);
      } catch (e) {}
    };
    fetchMeta();
  }, []);

  const activeBanners = useMemo(() => {
    return banners.filter(b => 
      (b.targetCityId === 'ALL' || b.targetCityId === userCommunity?.cityId) && 
      (b.targetApartmentId === 'ALL' || b.targetApartmentId === userCommunity?.apartmentId)
    );
  }, [banners, userCommunity]);

  const handleAiSearch = () => {
    if (!search) return;
    setIsAiLoading(true);
    setAiResponse(null);
    setTimeout(() => {
      const q = search.toLowerCase();
      let responseMessage = "Here are some great recommendations based on what you asked for!";
      let items = [q];
      
      if (q.includes("cold") || q.includes("sick") || q.includes("fever") || q.includes("cough")) {
        responseMessage = "I recommend some light, soothing Khichdi and a mild pain reliever. I've found Moong Dal, Rice, and Crocin for you.";
        items = ["moong", "rice", "crocin", "dolo", "vicks", "dal"];
      } else if (q.includes("party") || q.includes("friends") || q.includes("movie")) {
        responseMessage = "Party time! You'll need snacks and cold drinks. Here are some Lay's and Coca-Cola.";
        items = ["lay", "coca", "pepsi", "nachos", "chips", "kurkure"];
      } else if (q.includes("breakfast") || q.includes("morning")) {
        responseMessage = "A healthy breakfast starts the day right! Here are some dairy and bread options.";
        items = ["milk", "bread", "butter", "egg", "jam", "amul"];
      } else if (q.includes("thirsty") || q.includes("drink") || q.includes("water") || q.includes("juice")) {
        responseMessage = "Quench your thirst! Here are some refreshing beverages.";
        items = ["coca", "pepsi", "water", "juice", "sprite", "thums up", "real", "slice", "maaza"];
      }
      
      setAiResponse({ message: responseMessage, items });
      setIsAiLoading(false);
    }, 1200);
  };

  // Filter products by City Vendors
  const validVendorIds = useMemo(() => {
    if (!userCommunity?.cityId) return vendors.map(v => v.$id);
    return vendors.filter(v => v.cityId === userCommunity.cityId).map(v => v.$id);
  }, [vendors, userCommunity]);

  // Filter products
  const filtered = useMemo(() => {
    let list = products;
    if (userCommunity?.cityId) {
      list = products.filter(p => !p.vendorId || validVendorIds.includes(p.vendorId));
    }

    if (aiResponse) {
      return list.filter(p => aiResponse.items.some(item => p.name.toLowerCase().includes(item.toLowerCase()) || p.category.toLowerCase().includes(item.toLowerCase())));
    }
    return list.filter(p => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, search, activeCategory, aiResponse, validVendorIds, userCommunity]);

  const deliveryCharge = totalMRP === 0 ? 0 : totalMRP < 200 ? 10 : totalMRP < 500 ? 20 : 30;

  const handleLogout = async () => {
    await account.deleteSession("current");
    router.push("/login");
  };

  const getCartQty = (id: string) => items.find(i => i.id === id)?.quantity || 0;

  if (!user) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Redirecting…</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ─── HEADER ─── */}
      <header className="glass" style={{
        position: "sticky", top: 0, zIndex: 200,
        padding: "12px 20px", borderRadius: 0,
        borderLeft: "none", borderRight: "none", borderTop: "none",
        display: "flex", alignItems: "center", gap: 12
      }}>
        <Link href="/" style={{ color: "var(--text)", textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: "linear-gradient(135deg, #6366f1, #f97316)", padding: 7, borderRadius: 9 }}>
              <ShoppingBag size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>HyperLocal</span>
          </div>
        </Link>

        {/* AI Smart Search bar */}
        <div style={{ flex: 1, position: "relative", maxWidth: 600, display: "flex", gap: 8 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
            <input
              className="input"
              placeholder="Search products, or Ask AI (e.g., 'I have a cold')"
              value={search}
              onChange={e => { setSearch(e.target.value); if (e.target.value === "") setAiResponse(null); }}
              onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
              style={{ paddingLeft: 40, paddingTop: 10, paddingBottom: 10 }}
            />
            {search && (
              <button onClick={() => { setSearch(""); setAiResponse(null); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={16} />
              </button>
            )}
          </div>
          <button onClick={handleAiSearch} style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", border: "none", color: "white", padding: "0 16px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
            <Sparkles size={16} /> Ask AI
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          <button onClick={() => setSettingsOpen(true)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontWeight: 600, cursor: "pointer" }}>
            Settings
          </button>
          <Link href="/orders" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontWeight: 600, textDecoration: "none" }}>
            <ClipboardList size={18} /> Orders
          </Link>
          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            style={{ position: "relative", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "white", padding: "8px 14px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <>
                <span>{totalItems} items</span>
                <span style={{ background: "#6366f1", padding: "2px 8px", borderRadius: 999, fontSize: "0.8rem" }}>₹{totalMRP}</span>
              </>
            )}
          </button>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div style={{ display: "flex" }}>
        {/* ─── CATEGORY SIDEBAR ─── */}
        <aside style={{
          width: 180, flexShrink: 0, padding: "20px 12px",
          position: "sticky", top: 57, height: "calc(100vh - 57px)", overflowY: "auto",
          borderRight: "1px solid var(--border)"
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSearch(""); setAiResponse(null); }}
              style={{
                width: "100%", padding: "10px 12px", marginBottom: 4,
                borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
                background: activeCategory === cat ? "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))" : "transparent",
                color: activeCategory === cat ? "white" : "var(--muted)",
                fontWeight: activeCategory === cat ? 600 : 400,
                borderLeft: activeCategory === cat ? "3px solid #6366f1" : "3px solid transparent",
                fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 8
              }}
            >
              <span>{CATEGORY_EMOJI[cat]}</span>
              <span>{cat}</span>
            </button>
          ))}
        </aside>

        {/* ─── PRODUCT GRID ─── */}
        <main style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
          {/* Community Group-Buy Banner */}
          <div className="glass" style={{
            background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(99,102,241,0.15))",
            border: "1px solid rgba(236,72,153,0.3)",
            padding: "16px 20px",
            borderRadius: 12,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap", gap: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "linear-gradient(135deg, #ec4899, #6366f1)", padding: 10, borderRadius: 999 }}>
                <Users size={24} color="white" />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, color: "#fbcfe8", fontSize: "1.1rem", marginBottom: 4 }}>Hyper-Density Reward Unlocked!</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.4 }}>
                  If 5 more people in your apartment order in the <b>Evening Slot</b>, delivery drops to a minimal <b>₹10</b> for everyone! This goes straight to the rider. Share with neighbors.
                </p>
              </div>
            </div>
            <button style={{ background: "#ec4899", border: "none", color: "white", padding: "10px 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              Invite Neighbors
            </button>
          </div>

          {/* Dynamic Ad Banners */}
          {activeBanners.length > 0 && !search && activeCategory === "All" && (
            <div style={{ display: "flex", gap: 16, overflowX: "auto", marginBottom: 32, paddingBottom: 8, scrollbarWidth: "none" }}>
              {activeBanners.map(banner => (
                <div 
                  key={banner.$id} 
                  onClick={() => { if (banner.link) window.location.href = banner.link; }}
                  style={{ minWidth: 320, height: 160, borderRadius: 16, overflow: "hidden", position: "relative", flexShrink: 0, cursor: banner.link ? "pointer" : "default" }}
                >
                  <img src={banner.imageUrl || "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300"} alt={banner.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)", display: "flex", alignItems: "flex-end", padding: 16 }}>
                    <h3 style={{ color: "white", fontWeight: 800, fontSize: "1.2rem" }}>{banner.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trending in Community (Mocked based on community) */}
          {!search && activeCategory === "All" && userCommunity && filtered.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles color="#a855f7" size={20} /> Trending in {userCommunity.apartmentName}
              </h2>
              <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
                {filtered.slice(0, 5).map(product => {
                  const qty = getCartQty(product.$id);
                  return (
                    <div
                      key={product.$id + "_trend"}
                      className="glass"
                      style={{ minWidth: 160, padding: 14, display: "flex", flexDirection: "column", gap: 8, borderRadius: 12 }}
                    >
                      <div style={{ borderRadius: 8, overflow: "hidden", height: 110, background: "rgba(255,255,255,0.05)", position: "relative" }}>
                        <div style={{ position: "absolute", top: 8, left: 8, background: "#ec4899", color: "white", fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999 }}>#1 Highly Purchased</div>
                        <img src={product.image_url || "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300"} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{product.name}</p>
                      <p style={{ fontSize: "1rem", fontWeight: 800, color: "#22c55e" }}>₹{product.mrp}</p>
                      <button
                        onClick={() => addItem({ id: product.$id, name: product.name, mrp: product.mrp, category: product.category, image_url: product.image_url })}
                        style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", fontWeight: 600 }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isAiLoading && (
            <div style={{ padding: 24, textAlign: "center", color: "#a855f7" }}>
              <Sparkles size={32} className="animate-pulse" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>AI is analyzing your request...</p>
            </div>
          )}
          
          {aiResponse && !isAiLoading && (
            <div className="glass" style={{ padding: "20px", borderRadius: 12, marginBottom: 20, borderLeft: "4px solid #a855f7", background: "rgba(168,85,247,0.05)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, color: "#a855f7" }}>
                <MessageSquare size={20} />
                <h3 style={{ fontWeight: 700 }}>AI Recommendation</h3>
              </div>
              <p style={{ color: "var(--text)", lineHeight: 1.5 }}>{aiResponse.message}</p>
            </div>
          )}

          {/* Result count */}
          <div style={{ marginBottom: 16, color: "var(--muted)", fontSize: "0.875rem" }}>
            {loading ? "Loading products…" : (
              aiResponse
                ? `${filtered.length} AI-suggested products`
                : search
                ? `${filtered.length} results for "${search}"`
                : `${CATEGORY_EMOJI[activeCategory]} ${activeCategory} — ${filtered.length} products`
            )}
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 16 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 12, background: "var(--surface)", height: 220, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
              <Package size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p>No products found for &quot;{search}&quot;</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 16 }}>
              {filtered.map(product => {
                const qty = getCartQty(product.$id);
                return (
                  <div
                    key={product.$id}
                    className="glass"
                    style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, borderRadius: 12, transition: "transform 0.2s", cursor: "default" }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    {/* Product Image */}
                    <div style={{ borderRadius: 8, overflow: "hidden", height: 110, background: "rgba(255,255,255,0.05)" }}>
                      <img
                        src={product.image_url || "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300"}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300"; }}
                      />
                    </div>

                    {/* Category tag & Scarcity */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 600, color: "#a5b4fc",
                        background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: 999,
                      }}>
                        {product.category}
                      </span>
                      {(() => {
                        const stock = parseInt(product.$id.slice(-4), 16) % 20; // Pseudo-random based on ID
                        if (stock > 0 && stock < 4) {
                          return <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: 999 }}>🔥 Only {stock} left!</span>;
                        }
                        return null;
                      })()}
                    </div>

                    {/* Name */}
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
                      {product.name}
                    </p>

                    {/* Price */}
                    <p style={{ fontSize: "1rem", fontWeight: 800, color: "#22c55e" }}>
                      ₹{product.mrp}
                    </p>

                    {/* Add/Remove buttons */}
                    {qty === 0 ? (
                      <button
                        onClick={() => addItem({ id: product.$id, name: product.name, mrp: product.mrp, category: product.category, image_url: product.image_url, vendorId: product.vendorId })}
                        style={{
                          position: "absolute", bottom: 12, right: 12,
                          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                          color: "white", border: "none", borderRadius: 8,
                          padding: "8px 12px", cursor: "pointer", fontWeight: 600,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.85rem"
                        }}
                      >
                        <Plus size={15} /> Add
                      </button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(99,102,241,0.2)", borderRadius: 8, padding: "4px" }}>
                        <button onClick={() => updateQty(product.$id, qty - 1)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "4px 8px", borderRadius: 6, display: "flex" }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{qty}</span>
                        <button onClick={() => updateQty(product.$id, qty + 1)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "4px 8px", borderRadius: 6, display: "flex" }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ─── CART DRAWER ─── */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999 }}>
          {/* Backdrop */}
          <div onClick={() => setCartOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />

          {/* Drawer */}
          <div className="glass" style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: "min(420px, 95vw)",
            borderRadius: "16px 0 0 16px", display: "flex", flexDirection: "column", overflow: "hidden"
          }}>
            {/* Cart Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontWeight: 700 }}>🛒 Your Cart ({totalItems})</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
                <X size={22} />
              </button>
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
                  <ShoppingCart size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px", borderRadius: 10, background: "var(--surface)" }}>
                    <img src={item.image_url || "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300"} alt={item.name} style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300"; }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: 4 }}>{item.name}</p>
                      <p style={{ color: "#22c55e", fontWeight: 700 }}>₹{item.mrp} × {item.quantity} = ₹{item.mrp * item.quantity}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "white", width: 28, height: 28, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={12} /></button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "white", width: 28, height: 28, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} /></button>
                      <button onClick={() => removeItem(item.id)} style={{ background: "rgba(239,68,68,0.2)", border: "none", color: "#f87171", width: 28, height: 28, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={12} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bill Summary + Checkout */}
            {items.length > 0 && (
              <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)" }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "var(--muted)", fontSize: "0.875rem" }}>
                    <span>Items total</span><span>₹{totalMRP}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "var(--muted)", fontSize: "0.875rem" }}>
                    <span>Delivery charge</span>
                    <span style={{ color: deliveryCharge === 10 ? "#22c55e" : "var(--muted)" }}>₹{deliveryCharge}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                    <span>Total</span><span style={{ color: "#22c55e" }}>₹{totalMRP + deliveryCharge}</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="btn btn-primary"
                  style={{ display: "flex", textDecoration: "none" }}
                >
                  Proceed to Checkout <ChevronRight size={18} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass" style={{ width: "90%", maxWidth: 400, borderRadius: 24, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontWeight: 800, fontSize: "1.2rem" }}>Profile Settings</h2>
              <button onClick={() => setSettingsOpen(false)} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input className="input" value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} placeholder="Your Name" />
              </div>
              <div className="form-group">
                <label className="label">Phone Number</label>
                <input className="input" value={settingsForm.phone} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} placeholder="10 Digits" />
              </div>
              <div className="form-group">
                <label className="label">City</label>
                <select className="input" value={settingsForm.cityId} onChange={e => {
                  setSettingsForm({...settingsForm, cityId: e.target.value, apartmentId: ""});
                }}>
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c.$id} value={c.$id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Apartment</label>
                <select className="input" value={settingsForm.apartmentId} onChange={e => setSettingsForm({...settingsForm, apartmentId: e.target.value})}>
                  <option value="">Select Apartment</option>
                  {apartments.filter(a => a.cityId === settingsForm.cityId).map(a => <option key={a.$id} value={a.$id}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Default Delivery Instructions</label>
                <input className="input" value={settingsForm.instructions} onChange={e => setSettingsForm({...settingsForm, instructions: e.target.value})} placeholder="e.g. Leave at security" />
              </div>
              <button onClick={() => {
                const apart = apartments.find(a => a.$id === settingsForm.apartmentId);
                const data = { ...settingsForm, apartmentName: apart?.name || "" };
                localStorage.setItem("hk_user_settings", JSON.stringify(data));
                setUserCommunity(data);
                setSettingsOpen(false);
              }} className="btn btn-primary" style={{ marginTop: 12 }}>Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
