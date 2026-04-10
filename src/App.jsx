import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";

const SERVICES = ["Najam kuće za odmor", "Paintball", "Najam + paintball"];
const SERVICE_COLORS = {
  "Najam kuće za odmor": { bg: "#1f2a1f", text: "#88c8a0" },
  "Paintball": { bg: "#2a1f3a", text: "#b388e8" },
  "Najam + paintball": { bg: "#1f2a2a", text: "#88b8c8" },
};
const ACCENT = "#32784f";
const ACCENT_LIGHT = "#3d9060";
const TAB_PASSWORD = "Melon";

const PRIORITIES = {
  visok: { color: "#e74c3c", bg: "#3a1f1f", label: "Visok" },
  srednji: { color: "#f1c40f", bg: "#3a351f", label: "Srednji" },
  nizak: { color: "#2ecc71", bg: "#1f3a25", label: "Nizak" },
};

const PONUDA_ITEMS = [
  { icon: "🛏️", text: "5 kreveta i pomoćni ležaj" },
  { icon: "🏕️", text: "2 A frame bungalova s 4 spavaća mjesta" },
  { icon: "🍖", text: "Sjenica s roštiljem i ražnjem (veliki stol i klupe za 20 ljudi)" },
  { icon: "🚿", text: "Vanjski tuš" },
  { icon: "🏠", text: "Opremljena kuća za dnevni boravak (Kuhinja s perilicom suđa te kompletom bešteka za 15 ljudi)" },
  { icon: "🎯", text: "Zabavni sadržaji: Pikado, boćanje, leteća kuglana, stolni tenis, društvene igre, karte, odbojka, 2 gola za mali nogomet" },
  { icon: "🚴", text: "Biciklistička staza oko Borovika — 28 kilometara" },
  { icon: "🏊", text: "Blizina jezera Borovik — 5 km" },
  { icon: "🔫", text: "Paintball poligon" },
  { icon: "🦺", text: "Paintball oprema (Kaciga, rukavice, kombinezon, pancirka i puška)" },
];

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}.`;
}

function formatMoney(n) {
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(n);
}

const monthNames = ["Siječanj","Veljača","Ožujak","Travanj","Svibanj","Lipanj","Srpanj","Kolovoz","Rujan","Listopad","Studeni","Prosinac"];
const dayNames = ["Pon","Uto","Sri","Čet","Pet","Sub","Ned"];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; }

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1a1a1a", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", border: "1px solid #333" }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ datum: "", usluga: SERVICES[0], dani: 1, zarada: "", kontakt: "", ime: "" });
  const [filterService, setFilterService] = useState("Sve");
  const [filterYear, setFilterYear] = useState("Sve");
  const [filterMonth, setFilterMonth] = useState("Sve");
  const [tab, setTab] = useState("home");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  // Password
  const [gostiUnlocked, setGostiUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  // Todos
  const [todos, setTodos] = useState([]);
  const [todoText, setTodoText] = useState("");
  const [todoPriority, setTodoPriority] = useState("srednji");
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "records"), orderBy("datum", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(data);
      setLoading(false);
    });
    // Load todos
    const unsub2 = onSnapshot(collection(db, "todos"), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTodos(data);
    });
    return () => { unsub(); unsub2(); };
  }, []);





  // Todo handlers
  const addTodo = async () => {
    if (!todoText.trim()) return;
    try { await addDoc(collection(db, "todos"), { text: todoText.trim(), priority: todoPriority, done: false }); } catch(e) { console.error(e); }
    setTodoText("");
  };
  const toggleTodo = async (id) => {
    const t = todos.find(x => x.id === id);
    if (t) try { await updateDoc(doc(db, "todos", id), { done: !t.done }); } catch(e) { console.error(e); }
  };
  const deleteTodo = async (id) => {
    try { await deleteDoc(doc(db, "todos", id)); } catch(e) { console.error(e); }
  };
  const changePriority = async (id, p) => {
    try { await updateDoc(doc(db, "todos", id), { priority: p }); } catch(e) { console.error(e); }
  };

  // Record handlers
  const openNew = (presetDate) => {
    setEditId(null);
    const d = presetDate || new Date().toISOString().slice(0, 10);
    setForm({ datum: d, usluga: SERVICES[0], dani: 1, zarada: "", kontakt: "", ime: "" });
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditId(r.id);
    setForm({ datum: r.datum, usluga: r.usluga, dani: r.dani, zarada: r.zarada, kontakt: r.kontakt, ime: r.ime || "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.datum || !form.zarada) return;
    const entry = { ...form, zarada: parseFloat(form.zarada), dani: parseInt(form.dani) || 1 };
    try {
      if (editId) {
        await updateDoc(doc(db, "records", editId), entry);
      } else {
        await addDoc(collection(db, "records"), entry);
      }
    } catch(e) { console.error(e); }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    try { await deleteDoc(doc(db, "records", id)); } catch(e) { console.error(e); }
    setDeleteConfirm(null);
  };

  // Export / Import
  const handleExport = () => {
    const data = JSON.stringify({ records: records.map(({id, ...r}) => r), todos: todos.map(({id, ...t}) => t) }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "demode-backup.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.records) for (const r of data.records) await addDoc(collection(db, "records"), r);
        if (data.todos) for (const t of data.todos) await addDoc(collection(db, "todos"), t);
        alert("Podaci uspješno uvezeni!");
      } catch { alert("Greška pri uvozu datoteke"); }
    };
    input.click();
  };

  const handlePwSubmit = () => {
    if (pwInput === TAB_PASSWORD) {
      setGostiUnlocked(true);
      setPwError(false);
      setPwInput("");
    } else {
      setPwError(true);
    }
  };

  // Calendar
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const getRecordsForDate = (day) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return records.filter(r => {
      const start = new Date(r.datum);
      const end = new Date(start);
      end.setDate(end.getDate() + (r.dani - 1));
      const check = new Date(dateStr);
      return check >= start && check <= end;
    });
  };

  const selectedRecords = selectedDay ? getRecordsForDate(selectedDay) : [];

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); setSelectedDay(null); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); setSelectedDay(null); };

  // Filters
  const years = [...new Set(records.map(r => r.datum.slice(0, 4)))].sort((a, b) => b - a);
  const allMonths = ["01","02","03","04","05","06","07","08","09","10","11","12"];

  const filtered = records.filter(r => {
    if (filterService !== "Sve" && r.usluga !== filterService) return false;
    if (filterYear !== "Sve" && r.datum.slice(0, 4) !== filterYear) return false;
    if (filterMonth !== "Sve" && r.datum.slice(5, 7) !== filterMonth) return false;
    return true;
  }).sort((a, b) => b.datum.localeCompare(a.datum));

  const totalZarada = filtered.reduce((s, r) => s + r.zarada, 0);
  const totalDani = filtered.reduce((s, r) => s + r.dani, 0);

  // Todos split
  const activeTodos = todos.filter(t => !t.done);
  const doneTodos = todos.filter(t => t.done);
  const priorityOrder = ["visok", "srednji", "nizak"];
  const groupedActive = priorityOrder.map(p => ({ priority: p, items: activeTodos.filter(t => t.priority === p) })).filter(g => g.items.length > 0);

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #444", background: "#111", color: "#f0f0f0", fontSize: 15, outline: "none", boxSizing: "border-box" };
  const labelStyle = { color: "#aaa", fontSize: 13, marginBottom: 4, display: "block", fontWeight: 500 };
  const btnPrimary = { background: ACCENT, color: "#fff", border: "none", borderRadius: 10, padding: "13px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", color: ACCENT, fontFamily: "'DM Sans', sans-serif" }}>
      <p>Učitavanje...</p>
    </div>
  );

  const TABS = [["home", "Kalendar"], ["lista", "Gosti"], ["todos", "Za obaviti"], ["smece", "Odvoz smeća"], ["ponuda", "Ponuda"]];

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d1f15 0%, #111 100%)", borderBottom: "1px solid #2a2a2a", padding: "16px 20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
          <a href="https://demode.com.hr/" target="_blank" rel="noopener noreferrer"><img src="/logo.svg" alt="DEMODE" style={{ height: 52, width: "auto", flexShrink: 0 }} /></a>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#f0f0f0", lineHeight: 1.2 }}>Kuća za odmor DEMODE</h1>
            <p style={{ color: "#888", fontSize: 13 }}>Evidencija gostiju</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#1a1a1a", borderRadius: 12, padding: 4, overflowX: "auto" }}>
          {TABS.map(([k, v]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: "10px 6px", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: tab === k ? ACCENT : "transparent", color: tab === k ? "#fff" : "#888", transition: "all .2s", whiteSpace: "nowrap"
            }}>{v}{k === "lista" && !gostiUnlocked ? " 🔒" : ""}</button>
          ))}
        </div>

        {/* ============ KALENDAR ============ */}
        {tab === "home" && (
          <>
            <button onClick={() => openNew()} style={{
              ...btnPrimary, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              fontSize: 16, padding: "16px 24px", borderRadius: 14,
              background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 100%)`,
              boxShadow: `0 4px 20px ${ACCENT}44`
            }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>+</span> Dodajte novoga klijenta
            </button>

            <div style={{ background: "#1a1a1a", borderRadius: 16, border: "1px solid #2a2a2a", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid #2a2a2a" }}>
                <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#aaa", fontSize: 20, cursor: "pointer", padding: "4px 10px" }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 16, color: ACCENT }}>{monthNames[calMonth]} {calYear}</span>
                <button onClick={nextMonth} style={{ background: "none", border: "none", color: "#aaa", fontSize: 20, cursor: "pointer", padding: "4px 10px" }}>›</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "10px 10px 4px" }}>
                {dayNames.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#666", fontWeight: 600, padding: 4 }}>{d}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 10px 12px", gap: 3 }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayRecords = getRecordsForDate(day);
                  const hasRecords = dayRecords.length > 0;
                  const isSelected = selectedDay === day;
                  const isToday = day === new Date().getDate() && calMonth === new Date().getMonth() && calYear === new Date().getFullYear();
                  return (
                    <button key={day} onClick={() => setSelectedDay(isSelected ? null : day)} style={{
                      background: isSelected ? ACCENT : hasRecords ? "#1f2f25" : "transparent",
                      border: isToday ? `2px solid ${ACCENT}` : "2px solid transparent",
                      borderRadius: 10, padding: "8px 2px 6px", cursor: "pointer",
                      color: isSelected ? "#fff" : hasRecords ? "#88c8a0" : "#888",
                      fontWeight: hasRecords || isToday ? 700 : 400, fontSize: 13, position: "relative"
                    }}>
                      {day}
                      {hasRecords && <div style={{ width: 5, height: 5, borderRadius: "50%", background: isSelected ? "#fff" : ACCENT, margin: "3px auto 0" }} />}
                    </button>
                  );
                })}
              </div>
              {selectedDay && (
                <div style={{ borderTop: "1px solid #2a2a2a", padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, color: ACCENT }}>{selectedDay}. {monthNames[calMonth]}</span>
                    <button onClick={() => openNew(`${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`)} style={{
                      background: ACCENT, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer"
                    }}>+ Rezervacija</button>
                  </div>
                  {selectedRecords.length === 0 ? (
                    <p style={{ color: "#666", fontSize: 14 }}>Nema rezervacija za ovaj dan</p>
                  ) : selectedRecords.map(r => (
                    <div key={r.id} onClick={() => openEdit(r)} style={{
                      background: SERVICE_COLORS[r.usluga]?.bg || "#222", borderRadius: 10, padding: "10px 14px", marginBottom: 8, cursor: "pointer"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{r.ime || "Bez imena"}</span>
                        <span style={{ color: "#88c8a0", fontWeight: 700, fontSize: 14 }}>{formatMoney(r.zarada)}</span>
                      </div>
                      <span style={{ fontSize: 12, color: SERVICE_COLORS[r.usluga]?.text || "#aaa" }}>{r.usluga} · {r.dani} dana</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ============ GOSTI - PASSWORD GATE ============ */}
        {tab === "lista" && !gostiUnlocked && (
          <div style={{ background: "#1a1a1a", borderRadius: 16, border: "1px solid #2a2a2a", padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#f0f0f0" }}>Zaštićeno lozinkom</h3>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>Unesite lozinku za pristup evidenciji</p>
            <div style={{ display: "flex", gap: 10, maxWidth: 300, margin: "0 auto" }}>
              <input type="password" style={{ ...inputStyle, flex: 1 }} value={pwInput}
                onChange={e => { setPwInput(e.target.value); setPwError(false); }}
                onKeyDown={e => e.key === "Enter" && handlePwSubmit()} placeholder="Lozinka" />
              <button onClick={handlePwSubmit} style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Otključaj</button>
            </div>
            {pwError && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 10 }}>Pogrešna lozinka</p>}
          </div>
        )}

        {/* ============ GOSTI - UNLOCKED ============ */}
        {tab === "lista" && gostiUnlocked && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <select value={filterService} onChange={e => setFilterService(e.target.value)} style={{ ...inputStyle, width: "auto", flex: 1 }}>
                <option value="Sve">Sve usluge</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ ...inputStyle, width: "auto", flex: 1 }}>
                <option value="Sve">Sve godine</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...inputStyle, width: "auto", flex: 1 }}>
                <option value="Sve">Svi mjeseci</option>
                {allMonths.map((m, i) => <option key={m} value={m}>{monthNames[i]}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Gostiju", value: filtered.length },
                { label: "Dana", value: totalDani },
                { label: "Zarada", value: formatMoney(totalZarada) }
              ].map(s => (
                <div key={s.label} style={{ background: "#1a1a1a", borderRadius: 12, padding: "14px 10px", textAlign: "center", border: "1px solid #2a2a2a" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: ACCENT }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>



            {filtered.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666", padding: 40 }}>Nema zapisa</p>
            ) : filtered.map(r => (
              <div key={r.id} style={{
                background: "#1a1a1a", borderRadius: 14, padding: "14px 16px", marginBottom: 10,
                border: "1px solid #2a2a2a", cursor: "pointer", position: "relative"
              }} onClick={() => openEdit(r)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{r.ime || "Bez imena"}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>{formatDate(r.datum)} · {r.dani} dana</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: ACCENT, fontSize: 15 }}>{formatMoney(r.zarada)}</div>
                    <span style={{
                      fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 600, marginTop: 4, display: "inline-block",
                      background: SERVICE_COLORS[r.usluga]?.bg || "#222", color: SERVICE_COLORS[r.usluga]?.text || "#aaa"
                    }}>{r.usluga}</span>
                  </div>
                </div>
                {r.kontakt && <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>{r.kontakt}</div>}
                <button onClick={e => { e.stopPropagation(); setDeleteConfirm(r.id); }} style={{
                  position: "absolute", top: 10, right: 10, background: "#2a2020", border: "1px solid #442222",
                  color: "#c0392b", cursor: "pointer", fontSize: 14, padding: "2px 8px", borderRadius: 6,
                  fontWeight: 700, lineHeight: 1.2
                }}>✕</button>
              </div>
            ))}
          </>
        )}

        {/* ============ ZA OBAVITI ============ */}
        {tab === "todos" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Novi zadatak..." value={todoText}
                onChange={e => setTodoText(e.target.value)} onKeyDown={e => e.key === "Enter" && addTodo()} />
              <button onClick={addTodo} style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 15, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Dodaj</button>
            </div>

            {/* Priority selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {Object.entries(PRIORITIES).map(([key, { color, label }]) => (
                <button key={key} onClick={() => setTodoPriority(key)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  border: todoPriority === key ? `2px solid ${color}` : "2px solid #333",
                  background: todoPriority === key ? color + "22" : "transparent",
                  color: todoPriority === key ? color : "#888", fontSize: 13, fontWeight: 600, cursor: "pointer"
                }}>{label}</button>
              ))}
            </div>

            {/* Active todos grouped by priority */}
            {groupedActive.length === 0 && doneTodos.length === 0 && (
              <p style={{ textAlign: "center", color: "#666", padding: 40 }}>Nema zadataka</p>
            )}

            {groupedActive.map(({ priority, items }) => (
              <div key={priority} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: PRIORITIES[priority].color, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                  {PRIORITIES[priority].label} prioritet
                </div>
                {items.map(t => (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "center", gap: 10, background: PRIORITIES[t.priority].bg,
                    borderRadius: 10, padding: "10px 14px", marginBottom: 6, borderLeft: `3px solid ${PRIORITIES[t.priority].color}`
                  }}>
                    <button onClick={() => toggleTodo(t.id)} style={{
                      width: 22, height: 22, borderRadius: 6, border: `2px solid ${PRIORITIES[t.priority].color}`,
                      background: "transparent", cursor: "pointer", flexShrink: 0
                    }} />
                    <span style={{ flex: 1, fontSize: 14, color: "#f0f0f0" }}>{t.text}</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {Object.entries(PRIORITIES).map(([k, v]) => (
                        <button key={k} onClick={() => changePriority(t.id, k)} style={{
                          width: 14, height: 14, borderRadius: "50%", border: "none",
                          background: t.priority === k ? v.color : "#333",
                          cursor: "pointer", opacity: t.priority === k ? 1 : 0.4
                        }} title={v.label} />
                      ))}
                    </div>
                    <button onClick={() => deleteTodo(t.id)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 16, padding: "0 2px" }}>×</button>
                  </div>
                ))}
              </div>
            ))}

            {/* Done todos dropdown */}
            {doneTodos.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <button onClick={() => setShowDone(!showDone)} style={{
                  background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "10px 16px",
                  color: "#888", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <span>Izvršeni zadaci {showDone ? "▴" : "▾"}</span>
                  <span style={{ background: ACCENT, color: "#fff", borderRadius: 8, padding: "2px 8px", fontSize: 11 }}>{doneTodos.length}</span>
                </button>
                {showDone && doneTodos.map(t => (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "center", gap: 10, background: "#1a1a1a",
                    borderRadius: 10, padding: "10px 14px", marginTop: 6, opacity: 0.6
                  }}>
                    <button onClick={() => toggleTodo(t.id)} style={{
                      width: 22, height: 22, borderRadius: 6, border: `2px solid ${ACCENT}`,
                      background: ACCENT, cursor: "pointer", flexShrink: 0, color: "#fff", fontSize: 12, lineHeight: "18px", textAlign: "center"
                    }}>✓</button>
                    <span style={{ flex: 1, fontSize: 14, color: "#888", textDecoration: "line-through" }}>{t.text}</span>
                    <button onClick={() => deleteTodo(t.id)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 16 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============ ODVOZ SMEĆA ============ */}
        {tab === "smece" && (
          <div style={{ background: "#1a1a1a", borderRadius: 16, border: "1px solid #2a2a2a", overflow: "hidden", padding: 20, textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: ACCENT, marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>
              Kalendar odvoza smeća 2026.
            </div>
            <img src="/smece.jpg" alt="Kalendar odvoza smeća" style={{ width: "100%", borderRadius: 10 }} />
          </div>
        )}

        {/* ============ PONUDA ============ */}
        {tab === "ponuda" && (
          <div style={{ background: "#1a1a1a", borderRadius: 16, border: "1px solid #2a2a2a", overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 10px", borderBottom: "1px solid #2a2a2a" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>Kuća za odmor DEMODE sadrži</h2>
              <p style={{ color: "#888", fontSize: 13 }}>Kompletna ponuda za goste</p>
            </div>
            <div style={{ padding: 16 }}>
              {PONUDA_ITEMS.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 10px",
                  borderBottom: i < PONUDA_ITEMS.length - 1 ? "1px solid #222" : "none"
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1.2 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, color: "#ddd", lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Export/Import buttons */}
      <div style={{ position: "fixed", bottom: 20, left: 20, display: "flex", gap: 8, zIndex: 500 }}>
        <button onClick={handleExport} style={{
          background: "#1a1a1a", border: "1px solid #333", borderRadius: 28, color: "#aaa",
          cursor: "pointer", padding: "10px 16px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
        }}>↓ Izvoz</button>
        <button onClick={handleImport} style={{
          background: "#1a1a1a", border: "1px solid #333", borderRadius: 28, color: "#aaa",
          cursor: "pointer", padding: "10px 16px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
        }}>↑ Uvoz</button>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: ACCENT }}>{editId ? "Uredi zapis" : "Novi klijent"}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Ime</label>
            <input style={inputStyle} value={form.ime} onChange={e => setForm({ ...form, ime: e.target.value })} placeholder="Ime gosta" />
          </div>
          <div>
            <label style={labelStyle}>Datum dolaska</label>
            <input type="date" style={inputStyle} value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Usluga</label>
            <select style={inputStyle} value={form.usluga} onChange={e => setForm({ ...form, usluga: e.target.value })}>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Broj dana</label>
              <input type="number" min="1" style={inputStyle} value={form.dani} onChange={e => setForm({ ...form, dani: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Zarada (€)</label>
              <input type="number" min="0" step="0.01" style={inputStyle} value={form.zarada} onChange={e => setForm({ ...form, zarada: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Kontakt</label>
            <input style={inputStyle} value={form.kontakt} onChange={e => setForm({ ...form, kontakt: e.target.value })} placeholder="Telefon ili email" />
          </div>
          <button onClick={handleSave} style={{ ...btnPrimary, background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 100%)`, marginTop: 6 }}>
            {editId ? "Spremi promjene" : "Dodaj klijenta"}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <p style={{ margin: "0 0 20px", fontSize: 16 }}>Jeste li sigurni da želite obrisati ovaj unos?</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDeleteConfirm(null)} style={{ ...btnPrimary, background: "#333", color: "#aaa" }}>Odustani</button>
          <button onClick={() => handleDelete(deleteConfirm)} style={{ ...btnPrimary, background: "#c0392b", color: "#fff" }}>Obriši</button>
        </div>
      </Modal>
    </div>
  );
}
