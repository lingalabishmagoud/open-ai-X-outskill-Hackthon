"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Building2, Home, ArrowRight, CheckCircle2 } from "lucide-react";

interface City { $id: string; name: string; }
interface Apartment { $id: string; cityId: string; name: string; imageUrl: string; }

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cities, setCities] = useState<City[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  
  const [cityId, setCityId] = useState("");
  const [apartmentId, setApartmentId] = useState("");
  const [block, setBlock] = useState("");
  const [flat, setFlat] = useState("");

  const router = useRouter();

  useEffect(() => {
    // Check if already onboarded
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('hk_user_community');
      if (data) router.replace("/");
    }

    const fetchCities = async () => {
      try {
        const res = await fetch('/api/public?resource=cities');
        const json = await res.json();
        setCities(json.documents || []);
      } catch (err) {}
    };
    fetchCities();
  }, [router]);

  useEffect(() => {
    if (!cityId) return;
    const fetchApts = async () => {
      try {
        const res = await fetch(`/api/public?resource=apartments&cityId=${cityId}`);
        const json = await res.json();
        setApartments(json.documents || []);
      } catch (err) {}
    };
    fetchApts();
  }, [cityId]);

  const filteredApartments = apartments.filter(a => a.cityId === cityId);
  const selectedApartment = apartments.find(a => a.$id === apartmentId);

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityId || !apartmentId || !flat) return;
    
    const data = {
      cityId,
      apartmentId,
      apartmentName: selectedApartment?.name || "",
      block,
      flat
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('hk_user_community', JSON.stringify(data));
    }
    router.push("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="glass" style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.2rem", background: "linear-gradient(135deg, #6366f1, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          HyperLocal Delivery
        </h1>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, padding: "40px 20px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          
          {/* Progress Indicators */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "var(--border)", zIndex: 0, transform: "translateY(-50%)" }} />
            
            <div style={{ position: "relative", zIndex: 1, background: "var(--bg)", padding: "0 8px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: step >= 1 ? "#6366f1" : "var(--surface)", color: step >= 1 ? "white" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>1</div>
            </div>
            <div style={{ position: "relative", zIndex: 1, background: "var(--bg)", padding: "0 8px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: step >= 2 ? "#6366f1" : "var(--surface)", color: step >= 2 ? "white" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>2</div>
            </div>
            <div style={{ position: "relative", zIndex: 1, background: "var(--bg)", padding: "0 8px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: step >= 3 ? "#6366f1" : "var(--surface)", color: step >= 3 ? "white" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>3</div>
            </div>
          </div>

          <div className="glass" style={{ padding: 32, borderRadius: 20 }}>
            {/* Step 1: City */}
            {step === 1 && (
              <div className="animate-in" style={{ animation: "fadeIn 0.3s ease-out" }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <MapPin size={48} color="#6366f1" style={{ margin: "0 auto 16px" }} />
                  <h2 style={{ fontWeight: 800, fontSize: "1.5rem" }}>Where are you located?</h2>
                  <p style={{ color: "var(--muted)", marginTop: 8 }}>Select your city to see available communities.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {cities.map(city => (
                    <button
                      key={city.$id}
                      onClick={() => { setCityId(city.$id); setStep(2); }}
                      style={{
                        padding: 16, borderRadius: 12, border: "2px solid",
                        borderColor: cityId === city.$id ? "#6366f1" : "var(--border)",
                        background: cityId === city.$id ? "rgba(99,102,241,0.1)" : "var(--surface)",
                        fontWeight: 700, fontSize: "1.1rem", cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      {city.name}
                    </button>
                  ))}
                  {cities.length === 0 && <p style={{ textAlign: "center", color: "var(--muted)" }}>No cities available.</p>}
                </div>
              </div>
            )}

            {/* Step 2: Apartment */}
            {step === 2 && (
              <div className="animate-in" style={{ animation: "fadeIn 0.3s ease-out" }}>
                <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 600, cursor: "pointer", marginBottom: 20 }}>
                  ← Back to Cities
                </button>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <Building2 size={48} color="#6366f1" style={{ margin: "0 auto 16px" }} />
                  <h2 style={{ fontWeight: 800, fontSize: "1.5rem" }}>Select Your Community</h2>
                  <p style={{ color: "var(--muted)", marginTop: 8 }}>We batch deliveries to these exact locations.</p>
                </div>
                
                <div style={{ display: "grid", gap: 16 }}>
                  {filteredApartments.map(apt => (
                    <div
                      key={apt.$id}
                      onClick={() => { setApartmentId(apt.$id); setStep(3); }}
                      style={{
                        borderRadius: 12, overflow: "hidden", border: "2px solid",
                        borderColor: apartmentId === apt.$id ? "#6366f1" : "var(--border)",
                        cursor: "pointer", transition: "all 0.2s", position: "relative",
                        background: "var(--surface)"
                      }}
                    >
                      <div style={{ height: 120, background: "#ccc" }}>
                        <img src={apt.imageUrl} alt={apt.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{apt.name}</span>
                        {apartmentId === apt.$id && <CheckCircle2 color="#6366f1" size={20} />}
                      </div>
                    </div>
                  ))}
                  {filteredApartments.length === 0 && (
                    <div style={{ textAlign: "center", padding: 32, background: "var(--surface)", borderRadius: 12 }}>
                      <p style={{ color: "var(--muted)" }}>No communities found in this city yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Flat Details */}
            {step === 3 && (
              <div className="animate-in" style={{ animation: "fadeIn 0.3s ease-out" }}>
                <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 600, cursor: "pointer", marginBottom: 20 }}>
                  ← Back to Communities
                </button>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <Home size={48} color="#6366f1" style={{ margin: "0 auto 16px" }} />
                  <h2 style={{ fontWeight: 800, fontSize: "1.5rem" }}>Your Exact Location</h2>
                  <p style={{ color: "var(--muted)", marginTop: 8 }}>Where should the rider drop your batch?</p>
                </div>
                
                <form onSubmit={handleComplete}>
                  <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", padding: 16, borderRadius: 12, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle2 color="#6366f1" />
                    <div>
                      <p style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Selected Community</p>
                      <p style={{ fontWeight: 700 }}>{selectedApartment?.name}</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                    <div className="form-group">
                      <label className="label">Block / Tower</label>
                      <input className="input" placeholder="e.g. A" value={block} onChange={e => setBlock(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="label">Flat Number</label>
                      <input className="input" placeholder="e.g. 101" value={flat} onChange={e => setFlat(e.target.value)} required />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ height: 50, fontSize: "1.1rem" }}>
                    Complete Setup <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
