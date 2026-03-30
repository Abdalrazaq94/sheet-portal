import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

function AdminDashboard({ theme, setTheme }) {
  const [sheetName, setSheetName] = useState(null);
  const [searchConfig, setSearchConfig] = useState(null);
  const [adminsCount, setAdminsCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const sheetDoc = await getDoc(doc(db, "config", "sheet"));
      if (sheetDoc.exists()) setSheetName(sheetDoc.data().name);

      const searchDoc = await getDoc(doc(db, "config", "search"));
      if (searchDoc.exists()) setSearchConfig(searchDoc.data());

      const adminsDoc = await getDoc(doc(db, "config", "admins_count"));
      if (adminsDoc.exists()) setAdminsCount(adminsDoc.data().count);
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-secondary)" }}>
      <nav style={{
        background: "var(--bg-card)",
        borderBottom: "0.5px solid var(--border)",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
        minHeight: "56px"
      }}>
        <span style={{ fontWeight: "700", fontSize: "1.1rem", color: "var(--accent)" }}>محروقات ديرالزور</span>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <Link to="/admin" style={navStyle(true)}>الرئيسية</Link>
          <Link to="/admin/manage" style={navStyle(false)}>إدارة المستخدمين</Link>
          <Link to="/admin/connect" style={navStyle(false)}>ربط الملف</Link>
          <Link to="/admin/settings" style={navStyle(false)}>إعدادات البحث</Link>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} style={iconBtn}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button onClick={handleLogout} style={{ ...iconBtn, color: "var(--danger)" }}>
            خروج
          </button>
        </div>
      </nav>

      <div style={{ padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "500", marginBottom: "1.2rem" }}>لوحة التحكم</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
          <div style={statCard}>
            <div style={{ fontSize: "1.8rem", fontWeight: "500" }}>{adminsCount}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>المستخدمون</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: "1.8rem", fontWeight: "500" }}>{sheetName ? "1" : "0"}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>الملف المرتبط</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: "1.8rem", fontWeight: "500" }}>{searchConfig ? searchConfig.searchBy?.length || 0 : 0}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>حقول البحث</div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: "500", marginBottom: "10px" }}>الملف المرتبط</div>
          {sheetName ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--success-light)", borderRadius: "8px", border: "0.5px solid var(--success)" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)" }}></div>
              <span style={{ fontSize: "0.9rem", color: "var(--success)", fontWeight: "500" }}>{sheetName}</span>
            </div>
          ) : (
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>لم يتم ربط أي ملف بعد. <Link to="/admin/connect" style={{ color: "var(--accent)" }}>اربط ملفاً الآن</Link></p>
          )}
        </div>

        <div style={card}>
          <div style={{ fontWeight: "500", marginBottom: "10px" }}>إعدادات البحث</div>
          {searchConfig ? (
            <>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                البحث بواسطة: <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>{searchConfig.searchBy?.join("، ")}</span>
              </p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                يظهر في النتائج: <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>{searchConfig.showFields?.join("، ")}</span>
              </p>
            </>
          ) : (
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>لم يتم ضبط إعدادات البحث بعد. <Link to="/admin/settings" style={{ color: "var(--accent)" }}>اضبطها الآن</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}

const navStyle = (active) => ({
  padding: "6px 12px",
  fontSize: "0.85rem",
  borderRadius: "8px",
  textDecoration: "none",
  color: active ? "var(--text-primary)" : "var(--text-secondary)",
  background: active ? "var(--bg-secondary)" : "transparent",
  border: active ? "0.5px solid var(--border)" : "0.5px solid transparent",
  fontWeight: active ? "500" : "400"
});

const iconBtn = {
  background: "transparent",
  border: "0.5px solid var(--border)",
  borderRadius: "8px",
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: "0.85rem",
  color: "var(--text-primary)"
};

const statCard = {
  background: "var(--bg-secondary)",
  borderRadius: "8px",
  padding: "1rem",
  textAlign: "center"
};

const card = {
  background: "var(--bg-card)",
  border: "0.5px solid var(--border)",
  borderRadius: "12px",
  padding: "1.2rem 1.5rem",
  marginBottom: "1rem"
};

export default AdminDashboard;