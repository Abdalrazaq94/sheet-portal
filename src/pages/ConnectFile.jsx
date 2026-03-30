import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

function ConnectFile({ theme, setTheme }) {
  const [url, setUrl] = useState("");
  const [connected, setConnected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSheet = async () => {
      const snap = await getDoc(doc(db, "config", "sheet"));
      if (snap.exists()) setConnected(snap.data());
    };
    fetchSheet();
  }, []);

  const extractSheetId = (url) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleConnect = async () => {
    setError("");
    setMessage("");
    const sheetId = extractSheetId(url);
    if (!sheetId) {
      setError("الرابط غير صحيح، يرجى نسخ رابط Google Sheet كاملاً");
      return;
    }
    setLoading(true);
    try {
      await setDoc(doc(db, "config", "sheet"), {
        url,
        sheetId,
        name: "ملف Google Sheet",
        connectedAt: new Date().toISOString()
      });
      setConnected({ url, sheetId, name: "ملف Google Sheet" });
      setMessage("تم ربط الملف بنجاح");
      setUrl("");
    } catch (err) {
      setError("حدث خطأ أثناء الربط");
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    if (!window.confirm("هل أنت متأكد من فصل الملف؟")) return;
    await deleteDoc(doc(db, "config", "sheet"));
    setConnected(null);
    setMessage("تم فصل الملف");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-secondary)" }}>
      <nav style={{
        background: "var(--bg-card)", borderBottom: "0.5px solid var(--border)",
        padding: "0 1.5rem", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: "10px", minHeight: "56px"
      }}>
        <span style={{ fontWeight: "700", fontSize: "1.1rem", color: "var(--accent)" }}>محروقات ديرالزور</span>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <Link to="/admin" style={navStyle(false)}>الرئيسية</Link>
          <Link to="/admin/manage" style={navStyle(false)}>إدارة المستخدمين</Link>
          <Link to="/admin/connect" style={navStyle(true)}>ربط الملف</Link>
          <Link to="/admin/settings" style={navStyle(false)}>إعدادات البحث</Link>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} style={iconBtn}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button onClick={handleLogout} style={{ ...iconBtn, color: "var(--danger)" }}>خروج</button>
        </div>
      </nav>

      <div style={{ padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "500", marginBottom: "1.2rem" }}>ربط ملف Google Sheet</h2>

        <div style={card}>
          <div style={{ fontWeight: "500", marginBottom: "12px" }}>الخطوة الأولى — أدخل رابط الملف</div>
          <label style={labelStyle}>رابط Google Sheet</label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            style={{ ...inputStyle, direction: "ltr", textAlign: "right" }}
          />
          {error && <p style={{ color: "var(--danger)", fontSize: "0.85rem", margin: "8px 0" }}>{error}</p>}
          {message && <p style={{ color: "var(--success)", fontSize: "0.85rem", margin: "8px 0" }}>{message}</p>}
          <button onClick={handleConnect} disabled={loading} style={btnPrimary}>
            {loading ? "جاري الربط..." : "ربط الملف"}
          </button>
        </div>

        <div style={card}>
          <div style={{ fontWeight: "500", marginBottom: "12px" }}>الخطوة الثانية — حالة الاتصال</div>
          {connected ? (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 14px", background: "var(--success-light)",
                borderRadius: "8px", border: "0.5px solid var(--success)", marginBottom: "12px"
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)", flexShrink: 0 }}></div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "500", color: "var(--success)" }}>{connected.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--success)", marginTop: "2px" }}>متصل — يتم جلب البيانات مباشرة عند كل بحث</div>
                </div>
              </div>
              <button onClick={handleDisconnect} style={btnDanger}>فصل الملف</button>
            </>
          ) : (
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>لم يتم ربط أي ملف بعد</p>
          )}
        </div>
      </div>
    </div>
  );
}

const navStyle = (active) => ({
  padding: "6px 12px", fontSize: "0.85rem", borderRadius: "8px",
  textDecoration: "none", color: active ? "var(--text-primary)" : "var(--text-secondary)",
  background: active ? "var(--bg-secondary)" : "transparent",
  border: active ? "0.5px solid var(--border)" : "0.5px solid transparent",
  fontWeight: active ? "500" : "400"
});

const iconBtn = {
  background: "transparent", border: "0.5px solid var(--border)",
  borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
  fontSize: "0.85rem", color: "var(--text-primary)"
};

const card = {
  background: "var(--bg-card)", border: "0.5px solid var(--border)",
  borderRadius: "12px", padding: "1.2rem 1.5rem", marginBottom: "1rem"
};

const labelStyle = { fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" };

const inputStyle = {
  width: "100%", padding: "10px", margin: "0 0 12px",
  border: "0.5px solid var(--border)", borderRadius: "8px",
  background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.95rem"
};

const btnPrimary = {
  padding: "10px 20px", background: "var(--accent)", color: "#fff",
  border: "none", borderRadius: "8px", fontSize: "0.95rem", cursor: "pointer"
};

const btnDanger = {
  padding: "6px 12px", background: "var(--danger-light)", color: "var(--danger)",
  border: "0.5px solid var(--danger)", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer"
};

export default ConnectFile;