import { useState, useEffect, useCallback } from "react";

const COLORS = {
  primary: "#0a6ef3", primaryLight: "#e8f0fe", sidebar: "#1a1f36",
  sidebarHover: "#252b47", success: "#1db954", danger: "#ef4444",
  muted: "#6b7280", border: "#e5e7eb", bg: "#f9fafb", text: "#111827",
};

const PIPELINE_STAGES = ["Lead In","Contact Made","Demo Scheduled","Proposal Sent","Negotiation","Closed Won"];
const stageColors = {
  "Lead In":"#8b5cf6","Contact Made":"#3b82f6","Demo Scheduled":"#f59e0b",
  "Proposal Sent":"#10b981","Negotiation":"#f97316","Closed Won":"#1db954",
};

// ─── API Helper ───────────────────────────────────────────────────────────────
function api(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`/.netlify/functions/${path}`, { ...options, headers: { ...headers, ...(options.headers||{}) } })
    .then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Request failed: ${r.status}`);
      return data;
    });
}

const fmt = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n)||0);
const today = () => new Date().toISOString().split("T")[0];

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function Toasts({ toasts }) {
  return (
    <div style={{ position:"fixed",top:20,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          padding:"10px 16px",borderRadius:8,fontSize:13,fontWeight:500,color:"#fff",
          background:t.type==="error"?COLORS.danger:COLORS.success,
          boxShadow:"0 4px 12px rgba(0,0,0,0.15)",animation:"slideIn 0.2s ease"
        }}>
          {t.msg}
          <style>{"@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}"}</style>
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",padding:60}}>
      <div style={{width:32,height:32,border:`3px solid ${COLORS.border}`,borderTop:`3px solid ${COLORS.primary}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, toast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.email || !form.password) return toast("Email and password required","error");
    if (mode==="register" && !form.name) return toast("Name required","error");
    setLoading(true);
    try {
      const data = await api("auth",{ method:"POST", body:JSON.stringify({ action:mode, ...form }) });
      localStorage.setItem("crm_token", data.token);
      localStorage.setItem("crm_user", JSON.stringify(data.user));
      onAuth(data.token, data.user);
    } catch(e) { toast(e.message,"error"); }
    setLoading(false);
  };

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:COLORS.sidebar}}>
      <div style={{background:"#fff",borderRadius:16,padding:40,width:380,boxShadow:"0 24px 60px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
          <div style={{width:38,height:38,borderRadius:10,background:COLORS.primary,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:"#fff",fontSize:18,fontWeight:700}}>C</span>
          </div>
          <div>
            <div style={{fontSize:17,fontWeight:700}}>CRM Pro</div>
            <div style={{fontSize:12,color:COLORS.muted}}>Trash Day Made Easy</div>
          </div>
        </div>
        <h2 style={{margin:"0 0 20px",fontSize:20,fontWeight:600}}>
          {mode==="login" ? "Sign in to your account" : "Create an account"}
        </h2>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {mode==="register" && (
            <div>
              <label style={{fontSize:12,color:COLORS.muted,display:"block",marginBottom:4}}>Full Name</label>
              <input value={form.name} onChange={(e)=>f("name",e.target.value)} placeholder="Your name"
                style={{width:"100%",padding:"9px 12px",border:"1px solid "+COLORS.border,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
            </div>
          )}
          <div>
            <label style={{fontSize:12,color:COLORS.muted,display:"block",marginBottom:4}}>Email</label>
            <input type="email" value={form.email} onChange={(e)=>f("email",e.target.value)} placeholder="you@example.com"
              onKeyDown={(e)=>e.key==="Enter"&&submit()}
              style={{width:"100%",padding:"9px 12px",border:"1px solid "+COLORS.border,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:12,color:COLORS.muted,display:"block",marginBottom:4}}>Password</label>
            <input type="password" value={form.password} onChange={(e)=>f("password",e.target.value)} placeholder="••••••••"
              onKeyDown={(e)=>e.key==="Enter"&&submit()}
              style={{width:"100%",padding:"9px 12px",border:"1px solid "+COLORS.border,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
          </div>
          <button onClick={submit} disabled={loading}
            style={{padding:"10px",borderRadius:8,border:"none",background:COLORS.primary,color:"#fff",cursor:loading?"not-allowed":"pointer",fontSize:14,fontWeight:600,opacity:loading?0.7:1,marginTop:4}}>
            {loading ? "Please wait…" : mode==="login" ? "Sign In" : "Create Account"}
          </button>
        </div>
        <p style={{textAlign:"center",fontSize:13,color:COLORS.muted,marginTop:20,marginBottom:0}}>
          {mode==="login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={()=>setMode(mode==="login"?"register":"login")}
            style={{background:"none",border:"none",color:COLORS.primary,cursor:"pointer",fontSize:13,fontWeight:500,padding:0}}>
            {mode==="login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Avatar / Badge ───────────────────────────────────────────────────────────
function Avatar({ name="?", size=36 }) {
  const initials = name.split(" ").map((w)=>w[0]).slice(0,2).join("").toUpperCase();
  const palette = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#f97316"];
  const color = palette[(name.charCodeAt(0)||0)%palette.length];
  return <div style={{width:size,height:size,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:size*0.36,fontWeight:600,flexShrink:0}}>{initials}</div>;
}
function Badge({ label, color }) {
  return <span style={{fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:12,background:color+"22",color}}>{label}</span>;
}

// ─── AI Panel ─────────────────────────────────────────────────────────────────
function AIPanel({ prompt, context, onClose }) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async()=>{
      try {
        const res = await fetch("/.netlify/functions/ai",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
            system:"You are a CRM AI assistant. Be concise, practical, actionable. Use short bullets. No markdown headers.",
            messages:[{role:"user",content:`${prompt}\n\nContext:\n${JSON.stringify(context,null,2)}`}]})});
        const data = await res.json();
        if(!cancelled) setResponse(data.content?.[0]?.text||"No response.");
      } catch { if(!cancelled) setResponse("Could not reach AI. Check ANTHROPIC_API_KEY in Netlify env vars."); }
      if(!cancelled) setLoading(false);
    })();
    return ()=>{cancelled=true;};
  },[prompt]);
  return (
    <div style={{position:"fixed",right:24,bottom:24,width:380,background:"#fff",borderRadius:12,border:"1px solid "+COLORS.border,boxShadow:"0 8px 32px rgba(0,0,0,0.14)",zIndex:1000}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid "+COLORS.border}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:COLORS.primary}}/>
          <span style={{fontSize:13,fontWeight:600}}>AI Assistant</span>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:COLORS.muted,lineHeight:1}}>×</button>
      </div>
      <div style={{padding:16,minHeight:80,maxHeight:320,overflowY:"auto"}}>
        {loading ? (
          <div style={{display:"flex",gap:5,alignItems:"center",paddingTop:8}}>
            {[0,1,2].map((i)=>(
              <div key={i} style={{width:7,height:7,borderRadius:"50%",background:COLORS.primary,animation:`bounce 1.2s ${i*0.2}s infinite ease-in-out`}}/>
            ))}
            <style>{"@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}"}</style>
          </div>
        ) : <p style={{fontSize:13,lineHeight:1.75,color:COLORS.text,margin:0,whiteSpace:"pre-wrap"}}>{response}</p>}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, user, onLogout }) {
  const items = [
    {id:"dashboard",icon:"▤",label:"Dashboard"},
    {id:"pipeline",icon:"⬡",label:"Pipeline"},
    {id:"contacts",icon:"◉",label:"Contacts"},
    {id:"organizations",icon:"▣",label:"Organizations"},
    {id:"activities",icon:"✓",label:"Activities"},
  ];
  return (
    <div style={{width:220,background:COLORS.sidebar,height:"100vh",display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"20px 20px 16px",borderBottom:"1px solid #2e3450"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:COLORS.primary,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:"#fff",fontSize:15,fontWeight:700}}>C</span>
          </div>
          <div>
            <div style={{color:"#fff",fontSize:14,fontWeight:600}}>CRM Pro</div>
            <div style={{color:"#8892b0",fontSize:11,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name||"Workspace"}</div>
          </div>
        </div>
      </div>
      <nav style={{padding:"12px 8px",flex:1}}>
        {items.map((item)=>(
          <button key={item.id} onClick={()=>setActive(item.id)}
            style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:2,
              background:active===item.id?COLORS.sidebarHover:"transparent",
              color:active===item.id?"#fff":"#8892b0",fontSize:14,textAlign:"left",transition:"background 0.15s,color 0.15s"}}>
            <span style={{fontSize:14,width:18,textAlign:"center"}}>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div style={{padding:"12px 8px",borderTop:"1px solid #2e3450"}}>
        <button onClick={onLogout}
          style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",background:"transparent",color:"#8892b0",fontSize:13,textAlign:"left"}}>
          <span style={{fontSize:14}}>↩</span> Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ deals, contacts, activities }) {
  const [aiPanel, setAiPanel] = useState(null);
  const totalValue = deals.reduce((s,d)=>s+(Number(d.value)||0),0);
  const wonValue = deals.filter((d)=>d.stage==="Closed Won").reduce((s,d)=>s+(Number(d.value)||0),0);
  const activeDeals = deals.filter((d)=>d.stage!=="Closed Won").length;
  const pendingTasks = activities.filter((a)=>!a.done).length;
  const stageData = PIPELINE_STAGES.map((s)=>({
    stage:s,
    count:deals.filter((d)=>d.stage===s).length,
    value:deals.filter((d)=>d.stage===s).reduce((sum,d)=>sum+(Number(d.value)||0),0),
  }));
  const maxVal = Math.max(...stageData.map((s)=>s.value),1);
  return (
    <div style={{padding:28,overflowY:"auto",height:"100%"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:600}}>Dashboard</h1>
          <p style={{margin:"4px 0 0",color:COLORS.muted,fontSize:13}}>{new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <button onClick={()=>setAiPanel({prompt:"Give me a concise executive summary of this CRM pipeline. Top 3 priority actions today?",context:{deals,activities:activities.filter((a)=>!a.done)}})}
          style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:8,border:"1px solid "+COLORS.primary,background:COLORS.primaryLight,color:COLORS.primary,cursor:"pointer",fontSize:13,fontWeight:500}}>
          ✦ AI Summary
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28}}>
        {[
          {label:"Total Pipeline",value:fmt(totalValue),sub:`${deals.length} deals`,color:COLORS.primary},
          {label:"Closed Won",value:fmt(wonValue),sub:"This year",color:COLORS.success},
          {label:"Active Deals",value:activeDeals,sub:"In progress",color:"#f59e0b"},
          {label:"Pending Tasks",value:pendingTasks,sub:"Due soon",color:"#ef4444"},
        ].map((card)=>(
          <div key={card.label} style={{background:"#fff",borderRadius:10,border:"1px solid "+COLORS.border,padding:20}}>
            <div style={{fontSize:12,color:COLORS.muted,marginBottom:6}}>{card.label}</div>
            <div style={{fontSize:24,fontWeight:600,color:card.color}}>{card.value}</div>
            <div style={{fontSize:12,color:COLORS.muted,marginTop:4}}>{card.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={{background:"#fff",borderRadius:10,border:"1px solid "+COLORS.border,padding:20}}>
          <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:600}}>Pipeline by Stage</h3>
          {stageData.map((s)=>(
            <div key={s.stage} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span>{s.stage}</span><span style={{color:COLORS.muted}}>{fmt(s.value)} · {s.count} deals</span>
              </div>
              <div style={{height:6,borderRadius:4,background:"#f3f4f6"}}>
                <div style={{height:6,borderRadius:4,width:`${Math.round((s.value/maxVal)*100)}%`,background:stageColors[s.stage],transition:"width 0.4s"}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{background:"#fff",borderRadius:10,border:"1px solid "+COLORS.border,padding:20}}>
          <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:600}}>Upcoming Activities</h3>
          {activities.filter((a)=>!a.done).slice(0,5).map((a)=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid "+COLORS.border}}>
              <div style={{width:28,height:28,borderRadius:6,background:"#f0f7ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>
                {a.type==="Call"?"📞":a.type==="Email"?"✉":"📅"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title}</div>
                <div style={{fontSize:11,color:COLORS.muted}}>{a.contact} · {a.due}</div>
              </div>
            </div>
          ))}
          {activities.filter((a)=>!a.done).length===0&&<p style={{fontSize:13,color:COLORS.muted,margin:0}}>No pending activities.</p>}
        </div>
      </div>
      {aiPanel&&<AIPanel prompt={aiPanel.prompt} context={aiPanel.context} onClose={()=>setAiPanel(null)}/>}
    </div>
  );
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────
function Pipeline({ deals, setDeals, token, toast }) {
  const [dragging, setDragging] = useState(null);
  const [aiPanel, setAiPanel] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const onDrop = async (e, stage) => {
    e.preventDefault();
    if (!dragging || dragging.stage===stage) { setDragging(null); return; }
    const updated = {...dragging, stage};
    setDeals((p)=>p.map((d)=>d.id===dragging.id?updated:d));
    setDragging(null);
    try { await api(`deals?id=${dragging.id}`,{method:"PUT",body:JSON.stringify(updated)},token); }
    catch { toast("Failed to update stage","error"); }
  };

  const saveDeal = async (d) => {
    setSaving(true);
    try {
      if (d.id) {
        const updated = await api(`deals?id=${d.id}`,{method:"PUT",body:JSON.stringify(d)},token);
        setDeals((p)=>p.map((x)=>x.id===d.id?updated:x));
        toast("Deal updated");
      } else {
        const created = await api("deals",{method:"POST",body:JSON.stringify(d)},token);
        setDeals((p)=>[created,...p]);
        toast("Deal added!");
      }
      setModal(null);
    } catch(e) { toast(e.message||"Failed to save deal","error"); }
    setSaving(false);
  };

  const deleteDeal = async (id) => {
    try {
      await api(`deals?id=${id}`,{method:"DELETE"},token);
      setDeals((p)=>p.filter((x)=>x.id!==id));
      setModal(null); toast("Deal deleted");
    } catch { toast("Failed to delete","error"); }
  };

  const newDeal = {title:"",contact:"",org:"",value:0,stage:"Lead In",probability:20,noteLog:[]};

  return (
    <div style={{padding:"20px 24px",height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:600}}>Pipeline</h1>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setAiPanel({prompt:"Analyze this sales pipeline. Which deals need immediate attention? Give specific next steps for top 3.",context:deals})}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,border:"1px solid "+COLORS.primary,background:COLORS.primaryLight,color:COLORS.primary,cursor:"pointer",fontSize:13}}>
            ✦ AI Insights
          </button>
          <button onClick={()=>setModal({...newDeal})}
            style={{padding:"7px 16px",borderRadius:8,border:"none",background:COLORS.primary,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500}}>
            + Add Deal
          </button>
        </div>
      </div>
      <div style={{display:"flex",gap:12,overflowX:"auto",flex:1,paddingBottom:12}}>
        {PIPELINE_STAGES.map((stage)=>{
          const stageDeals = deals.filter((d)=>d.stage===stage);
          const stageValue = stageDeals.reduce((s,d)=>s+(Number(d.value)||0),0);
          return (
            <div key={stage} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>onDrop(e,stage)}
              style={{width:224,flexShrink:0,background:COLORS.bg,borderRadius:10,padding:12,display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:stageColors[stage]}}/>
                    <span style={{fontSize:12,fontWeight:600}}>{stage}</span>
                  </div>
                  <div style={{fontSize:11,color:COLORS.muted,marginTop:2}}>{fmt(stageValue)}</div>
                </div>
                <span style={{fontSize:11,background:"#e5e7eb",borderRadius:12,padding:"2px 7px",color:COLORS.muted}}>{stageDeals.length}</span>
              </div>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                {stageDeals.map((deal)=>(
                  <div key={deal.id} draggable onDragStart={()=>setDragging(deal)} onClick={()=>setModal({...deal})}
                    style={{background:"#fff",borderRadius:8,border:"1px solid "+COLORS.border,padding:"10px 12px",cursor:"grab"}}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:4,lineHeight:1.3}}>{deal.title||"(Untitled)"}</div>
                    <div style={{fontSize:12,color:COLORS.muted,marginBottom:8}}>{deal.contact}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:13,fontWeight:600}}>{fmt(deal.value)}</span>
                      <span style={{fontSize:11,color:COLORS.muted}}>{Number(deal.probability)||0}%</span>
                    </div>
                    <div style={{marginTop:8,height:3,borderRadius:2,background:"#f3f4f6"}}>
                      <div style={{height:3,borderRadius:2,width:`${Math.min(Number(deal.probability)||0,100)}%`,background:stageColors[stage]}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {modal&&<DealModal deal={modal} saving={saving} onSave={saveDeal} onDelete={deleteDeal} onClose={()=>setModal(null)}/>}
      {aiPanel&&<AIPanel prompt={aiPanel.prompt} context={aiPanel.context} onClose={()=>setAiPanel(null)}/>}
    </div>
  );
}

// ─── Deal Modal ───────────────────────────────────────────────────────────────
function fmtNoteDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})+" · "+d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
}

function DealModal({ deal, onSave, onDelete, onClose, saving }) {
  const [form, setForm] = useState({...deal,value:Number(deal.value)||0,probability:Number(deal.probability)||0,noteLog:Array.isArray(deal.noteLog)?deal.noteLog:[]});
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [aiPanel, setAiPanel] = useState(null);
  const isNew = !deal.id;
  const f = (k,v) => setForm((p)=>({...p,[k]:v}));

  const addNote = () => {
    if (!newNote.trim()) return;
    const entry = {id:Date.now(),text:newNote.trim(),createdAt:new Date().toISOString()};
    setForm((p)=>({...p,noteLog:[entry,...(p.noteLog||[])]}));
    setNewNote("");
  };
  const deleteNote = (id) => setForm((p)=>({...p,noteLog:p.noteLog.filter((n)=>n.id!==id)}));
  const saveEdit = (id) => {
    if (!editText.trim()) return;
    setForm((p)=>({...p,noteLog:p.noteLog.map((n)=>n.id===id?{...n,text:editText.trim(),editedAt:new Date().toISOString()}:n)}));
    setEditingId(null);
  };
  const grouped = (form.noteLog||[]).reduce((acc,n)=>{
    const day = new Date(n.createdAt).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    if (!acc[day]) acc[day]=[];
    acc[day].push(n);
    return acc;
  },{});

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
      <div style={{background:"#fff",borderRadius:12,width:560,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
        <div style={{padding:"18px 24px",borderBottom:"1px solid "+COLORS.border,display:"flex",justifyContent:"space-between",flexShrink:0}}>
          <h2 style={{margin:0,fontSize:17,fontWeight:600}}>{isNew?"New Deal":form.title||"Edit Deal"}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:COLORS.muted,lineHeight:1}}>×</button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          <div style={{padding:"20px 24px 0",display:"flex",flexDirection:"column",gap:14}}>
            {[["Deal Title","title"],["Contact","contact"],["Organization","org"]].map(([label,key])=>(
              <div key={key}>
                <label style={{fontSize:12,color:COLORS.muted,display:"block",marginBottom:4}}>{label}</label>
                <input value={form[key]||""} onChange={(e)=>f(key,e.target.value)}
                  style={{width:"100%",padding:"8px 12px",border:"1px solid "+COLORS.border,borderRadius:6,fontSize:14,boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={{fontSize:12,color:COLORS.muted,display:"block",marginBottom:4}}>Value ($)</label>
                <input type="number" min="0" value={form.value} onChange={(e)=>f("value",Number(e.target.value)||0)}
                  style={{width:"100%",padding:"8px 12px",border:"1px solid "+COLORS.border,borderRadius:6,fontSize:14,boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:12,color:COLORS.muted,display:"block",marginBottom:4}}>Probability (%)</label>
                <input type="number" min="0" max="100" value={form.probability} onChange={(e)=>f("probability",Math.min(100,Math.max(0,Number(e.target.value)||0)))}
                  style={{width:"100%",padding:"8px 12px",border:"1px solid "+COLORS.border,borderRadius:6,fontSize:14,boxSizing:"border-box"}}/>
              </div>
            </div>
            <div>
              <label style={{fontSize:12,color:COLORS.muted,display:"block",marginBottom:4}}>Stage</label>
              <select value={form.stage} onChange={(e)=>f("stage",e.target.value)}
                style={{width:"100%",padding:"8px 12px",border:"1px solid "+COLORS.border,borderRadius:6,fontSize:14}}>
                {PIPELINE_STAGES.map((s)=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{padding:"20px 24px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <label style={{fontSize:13,fontWeight:600}}>Notes</label>
              <span style={{fontSize:11,color:COLORS.muted}}>{(form.noteLog||[]).length} {(form.noteLog||[]).length===1?"entry":"entries"}</span>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <textarea value={newNote} onChange={(e)=>setNewNote(e.target.value)}
                onKeyDown={(e)=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))addNote();}}
                placeholder="Add a note… (⌘↵ to save)" rows={2}
                style={{flex:1,padding:"8px 12px",border:"1px solid "+COLORS.border,borderRadius:6,fontSize:13,resize:"none",boxSizing:"border-box",lineHeight:1.5}}/>
              <button onClick={addNote}
                style={{padding:"0 16px",borderRadius:6,border:"none",background:COLORS.primary,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500,alignSelf:"stretch"}}>
                Add
              </button>
            </div>
            {Object.keys(grouped).length===0 ? (
              <div style={{textAlign:"center",padding:"20px 0",color:COLORS.muted,fontSize:13}}>No notes yet.</div>
            ) : Object.entries(grouped).map(([day,entries])=>(
              <div key={day} style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{height:1,flex:1,background:COLORS.border}}/>
                  <span style={{fontSize:10,fontWeight:600,color:COLORS.muted,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:"0.06em"}}>{day}</span>
                  <div style={{height:1,flex:1,background:COLORS.border}}/>
                </div>
                {entries.map((note)=>(
                  <div key={note.id} style={{background:COLORS.bg,borderRadius:8,padding:"10px 14px",border:"1px solid "+COLORS.border,marginBottom:8}}>
                    {editingId===note.id ? (
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        <textarea value={editText} onChange={(e)=>setEditText(e.target.value)} rows={3}
                          style={{width:"100%",padding:"7px 10px",border:"1px solid "+COLORS.primary,borderRadius:6,fontSize:13,resize:"none",boxSizing:"border-box"}}/>
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>saveEdit(note.id)} style={{padding:"5px 12px",borderRadius:5,border:"none",background:COLORS.primary,color:"#fff",cursor:"pointer",fontSize:12}}>Save</button>
                          <button onClick={()=>setEditingId(null)} style={{padding:"5px 12px",borderRadius:5,border:"1px solid "+COLORS.border,background:"#fff",cursor:"pointer",fontSize:12}}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={{margin:"0 0 8px",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{note.text}</p>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span style={{fontSize:11,color:COLORS.muted}}>{fmtNoteDate(note.createdAt)}{note.editedAt&&<em style={{marginLeft:6}}>(edited)</em>}</span>
                          <div style={{display:"flex",gap:10}}>
                            <button onClick={()=>{setEditingId(note.id);setEditText(note.text);}} style={{fontSize:11,color:COLORS.primary,background:"none",border:"none",cursor:"pointer",padding:0}}>Edit</button>
                            <button onClick={()=>deleteNote(note.id)} style={{fontSize:11,color:COLORS.danger,background:"none",border:"none",cursor:"pointer",padding:0}}>Delete</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {!isNew&&(
            <div style={{padding:"0 24px 20px"}}>
              <button onClick={()=>setAiPanel({prompt:"Analyze this deal and its notes. Best next action to move it forward?",context:form})}
                style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"9px 16px",borderRadius:8,border:"1px solid "+COLORS.primary,background:COLORS.primaryLight,color:COLORS.primary,cursor:"pointer",fontSize:13}}>
                ✦ AI: Suggest Next Action
              </button>
            </div>
          )}
        </div>
        <div style={{padding:"14px 24px",borderTop:"1px solid "+COLORS.border,display:"flex",justifyContent:"space-between",flexShrink:0}}>
          <div>{!isNew&&<button onClick={()=>onDelete(form.id)} style={{padding:"7px 14px",borderRadius:6,border:"1px solid #fca5a5",background:"#fef2f2",color:COLORS.danger,cursor:"pointer",fontSize:13}}>Delete Deal</button>}</div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{padding:"7px 14px",borderRadius:6,border:"1px solid "+COLORS.border,background:"#fff",cursor:"pointer",fontSize:13}}>Cancel</button>
            <button onClick={()=>onSave(form)} disabled={saving||!form.title?.trim()}
              style={{padding:"7px 16px",borderRadius:6,border:"none",background:COLORS.primary,color:"#fff",cursor:saving?"not-allowed":"pointer",fontSize:13,fontWeight:500,opacity:saving?0.7:1}}>
              {saving?"Saving…":isNew?"Add Deal":"Save Changes"}
            </button>
          </div>
        </div>
      </div>
      {aiPanel&&<AIPanel prompt={aiPanel.prompt} context={aiPanel.context} onClose={()=>setAiPanel(null)}/>}
    </div>
  );
}

// ─── Contacts ─────────────────────────────────────────────────────────────────
function Contacts({ contacts, setContacts, token, toast }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [aiPanel, setAiPanel] = useState(null);
  const [saving, setSaving] = useState(false);
  const filtered = contacts.filter((c)=>(c.name||"").toLowerCase().includes(search.toLowerCase())||(c.org||"").toLowerCase().includes(search.toLowerCase()));

  const saveContact = async (d) => {
    setSaving(true);
    try {
      if (d.id) {
        const updated = await api(`contacts?id=${d.id}`,{method:"PUT",body:JSON.stringify(d)},token);
        setContacts((p)=>p.map((x)=>x.id===d.id?updated:x));
      } else {
        const created = await api("contacts",{method:"POST",body:JSON.stringify(d)},token);
        setContacts((p)=>[created,...p]);
      }
      setModal(null); toast("Contact saved");
    } catch(e) { toast(e.message||"Failed to save","error"); }
    setSaving(false);
  };

  const deleteContact = async (id) => {
    try {
      await api(`contacts?id=${id}`,{method:"DELETE"},token);
      setContacts((p)=>p.filter((x)=>x.id!==id));
      setModal(null); toast("Contact deleted");
    } catch { toast("Failed to delete","error"); }
  };

  return (
    <div style={{padding:28,height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:600}}>Contacts</h1>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setAiPanel({prompt:"Based on these contacts, who should I prioritize reaching out to this week and why?",context:contacts})}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,border:"1px solid "+COLORS.primary,background:COLORS.primaryLight,color:COLORS.primary,cursor:"pointer",fontSize:13}}>
            ✦ AI Outreach Tips
          </button>
          <button onClick={()=>setModal({name:"",email:"",phone:"",org:"",role:""})}
            style={{padding:"7px 16px",borderRadius:8,border:"none",background:COLORS.primary,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500}}>
            + Add Contact
          </button>
        </div>
      </div>
      <input placeholder="Search by name or organization…" value={search} onChange={(e)=>setSearch(e.target.value)}
        style={{padding:"9px 14px",border:"1px solid "+COLORS.border,borderRadius:8,fontSize:14,marginBottom:16,width:320,outline:"none"}}/>
      <div style={{background:"#fff",borderRadius:10,border:"1px solid "+COLORS.border,flex:1,overflowY:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead style={{position:"sticky",top:0,background:COLORS.bg,zIndex:1}}>
            <tr>{["Name","Organization","Role","Email","Phone","Added",""].map((h)=>(
              <th key={h} style={{padding:"10px 16px",fontSize:12,color:COLORS.muted,fontWeight:500,textAlign:"left",borderBottom:"1px solid "+COLORS.border}}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map((c)=>(
              <tr key={c.id} style={{borderBottom:"1px solid "+COLORS.border}}>
                <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><Avatar name={c.name||"?"} size={32}/><span style={{fontSize:14,fontWeight:500}}>{c.name}</span></div></td>
                <td style={{padding:"12px 16px",fontSize:13}}>{c.org}</td>
                <td style={{padding:"12px 16px",fontSize:13,color:COLORS.muted}}>{c.role}</td>
                <td style={{padding:"12px 16px",fontSize:13,color:COLORS.primary}}>{c.email}</td>
                <td style={{padding:"12px 16px",fontSize:13,color:COLORS.muted}}>{c.phone}</td>
                <td style={{padding:"12px 16px",fontSize:12,color:COLORS.muted}}>{c.created}</td>
                <td style={{padding:"12px 16px"}}><button onClick={()=>setModal({...c})} style={{fontSize:12,padding:"4px 10px",borderRadius:6,border:"1px solid "+COLORS.border,background:"#fff",cursor:"pointer"}}>Edit</button></td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={7} style={{padding:32,textAlign:"center",color:COLORS.muted,fontSize:13}}>No contacts found.</td></tr>}
          </tbody>
        </table>
      </div>
      {modal&&<SimpleModal title={modal.id?"Edit Contact":"New Contact"}
        fields={[["Full Name","name"],["Email","email"],["Phone","phone"],["Organization","org"],["Role / Title","role"]]}
        data={modal} saving={saving} onSave={saveContact} onDelete={modal.id?deleteContact:null} onClose={()=>setModal(null)}/>}
      {aiPanel&&<AIPanel prompt={aiPanel.prompt} context={aiPanel.context} onClose={()=>setAiPanel(null)}/>}
    </div>
  );
}

// ─── Organizations ────────────────────────────────────────────────────────────
function Organizations({ orgs, setOrgs, contacts, token, toast }) {
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const saveOrg = async (o) => {
    setSaving(true);
    try {
      if (o.id) {
        const updated = await api(`organizations?id=${o.id}`,{method:"PUT",body:JSON.stringify(o)},token);
        setOrgs((p)=>p.map((x)=>x.id===o.id?updated:x));
      } else {
        const created = await api("organizations",{method:"POST",body:JSON.stringify(o)},token);
        setOrgs((p)=>[created,...p]);
      }
      setModal(null); toast("Organization saved");
    } catch(e) { toast(e.message||"Failed to save","error"); }
    setSaving(false);
  };

  const deleteOrg = async (id) => {
    try {
      await api(`organizations?id=${id}`,{method:"DELETE"},token);
      setOrgs((p)=>p.filter((x)=>x.id!==id));
      setModal(null); toast("Deleted");
    } catch { toast("Failed to delete","error"); }
  };

  return (
    <div style={{padding:28,height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:600}}>Organizations</h1>
        <button onClick={()=>setModal({name:"",contactName:"",phone:"",email:"",marketLocation:"",website:""})}
          style={{padding:"7px 16px",borderRadius:8,border:"none",background:COLORS.primary,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500}}>
          + Add Org
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,overflowY:"auto"}}>
        {orgs.map((o)=>(
          <div key={o.id} style={{background:"#fff",borderRadius:10,border:"1px solid "+COLORS.border,padding:20}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div style={{width:40,height:40,borderRadius:8,background:COLORS.primaryLight,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,color:COLORS.primary,fontSize:15}}>
                {(o.name||"?")[0].toUpperCase()}
              </div>
              <div><div style={{fontSize:15,fontWeight:600}}>{o.name}</div><div style={{fontSize:12,color:COLORS.muted}}>{o.contactName||""}</div></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[["Phone",o.phone],["Email",o.email],["Location",o.marketLocation],["Website",o.website]].filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,gap:8}}>
                  <span style={{color:COLORS.muted,flexShrink:0}}>{k}</span>
                  <span style={{color:k==="Email"?COLORS.primary:COLORS.text,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setModal({...o})} style={{marginTop:14,width:"100%",padding:"7px",borderRadius:6,border:"1px solid "+COLORS.border,background:"#fff",cursor:"pointer",fontSize:12}}>Edit</button>
          </div>
        ))}
        {orgs.length===0&&<p style={{color:COLORS.muted,fontSize:13}}>No organizations yet.</p>}
      </div>
      {modal&&<SimpleModal title={modal.id?"Edit Organization":"New Organization"}
        fields={[["Company Name","name"],["Contact Name","contactName"],["Phone","phone"],["Email","email"],["Market Location","marketLocation"],["Website","website"]]}
        data={modal} saving={saving} onSave={saveOrg} onDelete={modal.id?deleteOrg:null} onClose={()=>setModal(null)}/>}
    </div>
  );
}

// ─── Activities ───────────────────────────────────────────────────────────────
function Activities({ activities, setActivities, token, toast }) {
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const filtered = activities.filter((a)=>filter==="all"?true:filter==="pending"?!a.done:a.done);

  const toggleDone = async (a) => {
    const updated = {...a,done:!a.done};
    setActivities((p)=>p.map((x)=>x.id===a.id?updated:x));
    try { await api(`activities?id=${a.id}`,{method:"PUT",body:JSON.stringify(updated)},token); }
    catch { setActivities((p)=>p.map((x)=>x.id===a.id?a:x)); toast("Failed to update","error"); }
  };

  const saveActivity = async (d) => {
    setSaving(true);
    try {
      if (d.id) {
        const updated = await api(`activities?id=${d.id}`,{method:"PUT",body:JSON.stringify(d)},token);
        setActivities((p)=>p.map((x)=>x.id===d.id?updated:x));
      } else {
        const created = await api("activities",{method:"POST",body:JSON.stringify(d)},token);
        setActivities((p)=>[created,...p]);
      }
      setModal(null); toast("Activity saved");
    } catch(e) { toast(e.message||"Failed to save","error"); }
    setSaving(false);
  };

  const deleteActivity = async (id) => {
    try {
      await api(`activities?id=${id}`,{method:"DELETE"},token);
      setActivities((p)=>p.filter((x)=>x.id!==id));
      setModal(null); toast("Activity deleted");
    } catch { toast("Failed to delete","error"); }
  };

  return (
    <div style={{padding:28,height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:600}}>Activities</h1>
        <button onClick={()=>setModal({type:"Call",title:"",contact:"",deal:"",due:today(),done:false})}
          style={{padding:"7px 16px",borderRadius:8,border:"none",background:COLORS.primary,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500}}>
          + Add Activity
        </button>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["all","All"],["pending","Pending"],["done","Done"]].map(([val,label])=>(
          <button key={val} onClick={()=>setFilter(val)}
            style={{padding:"6px 14px",borderRadius:20,border:"1px solid "+(filter===val?COLORS.primary:COLORS.border),background:filter===val?COLORS.primaryLight:"#fff",color:filter===val?COLORS.primary:COLORS.text,cursor:"pointer",fontSize:13}}>
            {label}
          </button>
        ))}
      </div>
      <div style={{background:"#fff",borderRadius:10,border:"1px solid "+COLORS.border,flex:1,overflowY:"auto"}}>
        {filtered.map((a)=>(
          <div key={a.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",borderBottom:"1px solid "+COLORS.border,opacity:a.done?0.55:1}}>
            <button onClick={()=>toggleDone(a)}
              style={{width:20,height:20,borderRadius:"50%",border:"2px solid "+(a.done?COLORS.success:COLORS.border),background:a.done?COLORS.success:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {a.done&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}
            </button>
            <div style={{width:32,height:32,borderRadius:8,background:"#f0f7ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
              {a.type==="Call"?"📞":a.type==="Email"?"✉":"📅"}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:500,textDecoration:a.done?"line-through":"none"}}>{a.title}</div>
              <div style={{fontSize:12,color:COLORS.muted,marginTop:2}}>{a.contact}{a.deal?` · ${a.deal}`:""}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <Badge label={a.type} color={a.type==="Call"?"#3b82f6":a.type==="Email"?"#8b5cf6":"#10b981"}/>
              <div style={{fontSize:11,color:COLORS.muted,marginTop:4}}>{a.due}</div>
            </div>
            <button onClick={()=>setModal({...a})} style={{fontSize:12,padding:"4px 10px",borderRadius:6,border:"1px solid "+COLORS.border,background:"#fff",cursor:"pointer",flexShrink:0}}>Edit</button>
          </div>
        ))}
        {filtered.length===0&&<div style={{padding:32,textAlign:"center",color:COLORS.muted,fontSize:13}}>No activities here.</div>}
      </div>
      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
          <div style={{background:"#fff",borderRadius:12,width:440,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid "+COLORS.border,display:"flex",justifyContent:"space-between"}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:600}}>{modal.id?"Edit Activity":"New Activity"}</h2>
              <button onClick={()=>setModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:COLORS.muted,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:24,display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:12,color:COLORS.muted,display:"block",marginBottom:4}}>Type</label>
                <select value={modal.type} onChange={(e)=>setModal((p)=>({...p,type:e.target.value}))}
                  style={{width:"100%",padding:"8px 12px",border:"1px solid "+COLORS.border,borderRadius:6,fontSize:14}}>
                  {["Call","Email","Meeting"].map((t)=><option key={t}>{t}</option>)}
                </select>
              </div>
              {[["Title","title"],["Contact","contact"],["Deal","deal"]].map(([label,key])=>(
                <div key={key}>
                  <label style={{fontSize:12,color:COLORS.muted,display:"block",marginBottom:4}}>{label}</label>
                  <input value={modal[key]||""} onChange={(e)=>setModal((p)=>({...p,[key]:e.target.value}))}
                    style={{width:"100%",padding:"8px 12px",border:"1px solid "+COLORS.border,borderRadius:6,fontSize:14,boxSizing:"border-box"}}/>
                </div>
              ))}
              <div>
                <label style={{fontSize:12,color:COLORS.muted,display:"block",marginBottom:4}}>Due Date</label>
                <input type="date" value={modal.due||""} onChange={(e)=>setModal((p)=>({...p,due:e.target.value}))}
                  style={{width:"100%",padding:"8px 12px",border:"1px solid "+COLORS.border,borderRadius:6,fontSize:14,boxSizing:"border-box"}}/>
              </div>
            </div>
            <div style={{padding:"14px 24px",borderTop:"1px solid "+COLORS.border,display:"flex",justifyContent:"space-between"}}>
              <div>{modal.id&&<button onClick={()=>deleteActivity(modal.id)} style={{padding:"7px 14px",borderRadius:6,border:"1px solid #fca5a5",background:"#fef2f2",color:COLORS.danger,cursor:"pointer",fontSize:13}}>Delete</button>}</div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setModal(null)} style={{padding:"7px 14px",borderRadius:6,border:"1px solid "+COLORS.border,background:"#fff",cursor:"pointer",fontSize:13}}>Cancel</button>
                <button onClick={()=>saveActivity(modal)} disabled={saving}
                  style={{padding:"7px 16px",borderRadius:6,border:"none",background:COLORS.primary,color:"#fff",cursor:saving?"not-allowed":"pointer",fontSize:13,fontWeight:500,opacity:saving?0.7:1}}>
                  {saving?"Saving…":"Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Simple Modal ─────────────────────────────────────────────────────────────
function SimpleModal({ title, fields, data, onSave, onDelete, onClose, saving }) {
  const [form, setForm] = useState({...data});
  const f = (k,v) => setForm((p)=>({...p,[k]:v}));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
      <div style={{background:"#fff",borderRadius:12,width:440,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
        <div style={{padding:"18px 24px",borderBottom:"1px solid "+COLORS.border,display:"flex",justifyContent:"space-between"}}>
          <h2 style={{margin:0,fontSize:17,fontWeight:600}}>{title}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:COLORS.muted,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:24,display:"flex",flexDirection:"column",gap:14}}>
          {fields.map(([label,key])=>(
            <div key={key}>
              <label style={{fontSize:12,color:COLORS.muted,display:"block",marginBottom:4}}>{label}</label>
              <input value={form[key]||""} onChange={(e)=>f(key,e.target.value)}
                style={{width:"100%",padding:"8px 12px",border:"1px solid "+COLORS.border,borderRadius:6,fontSize:14,boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>
        <div style={{padding:"14px 24px",borderTop:"1px solid "+COLORS.border,display:"flex",justifyContent:"space-between"}}>
          <div>{onDelete&&<button onClick={()=>onDelete(form.id)} style={{padding:"7px 14px",borderRadius:6,border:"1px solid #fca5a5",background:"#fef2f2",color:COLORS.danger,cursor:"pointer",fontSize:13}}>Delete</button>}</div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{padding:"7px 14px",borderRadius:6,border:"1px solid "+COLORS.border,background:"#fff",cursor:"pointer",fontSize:13}}>Cancel</button>
            <button onClick={()=>onSave(form)} disabled={saving}
              style={{padding:"7px 16px",borderRadius:6,border:"none",background:COLORS.primary,color:"#fff",cursor:saving?"not-allowed":"pointer",fontSize:13,fontWeight:500,opacity:saving?0.7:1}}>
              {saving?"Saving…":"Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(()=>localStorage.getItem("crm_token"));
  const [user, setUser] = useState(()=>{try{return JSON.parse(localStorage.getItem("crm_user"));}catch{return null;}});
  const [active, setActive] = useState("dashboard");
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toasts, show: toast } = useToast();

  const onAuth = (tok, usr) => { setToken(tok); setUser(usr); };

  const onLogout = () => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    setToken(null); setUser(null);
    setDeals([]); setContacts([]); setOrgs([]); setActivities([]);
  };

  useEffect(()=>{
    if (!token) return;
    setLoading(true);
    Promise.all([
      api("deals",{},token),
      api("contacts",{},token),
      api("organizations",{},token),
      api("activities",{},token),
    ]).then(([d,c,o,a])=>{
      setDeals(d); setContacts(c); setOrgs(o); setActivities(a);
    }).catch((e)=>{
      if (e.message?.includes("401")||e.message?.toLowerCase().includes("unauthorized")) onLogout();
      else toast("Failed to load data: "+e.message,"error");
    }).finally(()=>setLoading(false));
  },[token]);

  if (!token) return <><AuthScreen onAuth={onAuth} toast={toast}/><Toasts toasts={toasts}/></>;

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:COLORS.text,background:COLORS.bg}}>
      <Sidebar active={active} setActive={setActive} user={user} onLogout={onLogout}/>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {loading ? <Spinner/> : <>
          {active==="dashboard"&&<Dashboard deals={deals} contacts={contacts} activities={activities}/>}
          {active==="pipeline"&&<Pipeline deals={deals} setDeals={setDeals} token={token} toast={toast}/>}
          {active==="contacts"&&<Contacts contacts={contacts} setContacts={setContacts} token={token} toast={toast}/>}
          {active==="organizations"&&<Organizations orgs={orgs} setOrgs={setOrgs} contacts={contacts} token={token} toast={toast}/>}
          {active==="activities"&&<Activities activities={activities} setActivities={setActivities} token={token} toast={toast}/>}
        </>}
      </div>
      <Toasts toasts={toasts}/>
    </div>
  );
}
