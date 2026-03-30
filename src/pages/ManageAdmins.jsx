import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

function ManageAdmins({ theme, setTheme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newPasswords, setNewPasswords] = useState({});
  const navigate = useNavigate();

  const fetchAdmins = async () => {
    const snap = await getDocs(collection(db, "users"));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setAdmins(list);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleAdd = async () => {
    setError("");
    setMessage("");
    if (!email || !password) { setError("يرجى إدخال البريد الإلكتروني وكلمة المرور"); return; }
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      const currentEmail = currentUser.email;

      const result = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", result.user.uid), { email, role });
      await signOut(auth);
      await signInWithEmailAndPassword(auth, currentEmail, prompt("أدخل كلمة مرورك للمتابعة"));

      setMessage("تم إضافة المستخدم بنجاح");
      setEmail("");
      setPassword("");
      fetchAdmins();
    } catch (err) {
      setError("حدث خطأ: " + err.message);
    }
    setLoading(false);
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    await deleteDoc(doc(db, "users", id));
    fetchAdmins();
  };

  const handleRoleChange = async (id, newRole) => {
    await updateDoc(doc(db, "users", id), { role: newRole });
    fetchAdmins();
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
          <Link to="/admin/manage" style={navStyle(true)}>إدارة المستخدمين</Link>
          <Link to="/admin/connect" style={navStyle(false)}>ربط الملف</Link>
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
        <h2 style={{ fontSize: "1.2rem", fontWeight: "500", marginBottom: "1.2rem" }}>إدارة المستخدمين</h2>

        <div style={card}>
          <div style={{ fontWeight: "500", marginBottom: "12px" }}>إضافة مستخدم جديد</div>

          <label style={labelStyle}>البريد الإلكتروني</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email"
            placeholder="example@email.com" style={{ ...inputStyle, direction: "ltr", textAlign: "right" }} />

          <label style={labelStyle}>كلمة المرور</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password"
            placeholder="••••••••" style={inputStyle} />

          <label style={labelStyle}>الصلاحية</label>
          <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
            <option value="viewer">مشاهد فقط</option>
            <option value="super_admin">مسؤول رئيسي</option>
          </select>

          {error && <p style={{ color: "var(--danger)", fontSize: "0.85rem", margin: "8px 0" }}>{error}</p>}
          {message && <p style={{ color: "var(--success)", fontSize: "0.85rem", margin: "8px 0" }}>{message}</p>}

          <button onClick={handleAdd} disabled={loading} style={btnPrimary}>
            {loading ? "جاري الإضافة..." : "إضافة مستخدم"}
          </button>
        </div>

        <div style={card}>
          <div style={{ fontWeight: "500", marginBottom: "12px" }}>المستخدمون الحاليون</div>
          {admins.length === 0 && <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>لا يوجد مستخدمون بعد</p>}
          {admins.map(admin => (
            <div key={admin.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: "10px", padding: "10px 0",
              borderBottom: "0.5px solid var(--border)"
            }}>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: "500" }}>{admin.email}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {admin.role === "super_admin" ? "مسؤول رئيسي" : "مشاهد فقط"}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <select
                  value={admin.role}
                  onChange={e => handleRoleChange(admin.id, e.target.value)}
                  style={{ ...inputStyle, width: "auto", margin: 0, padding: "4px 8px", fontSize: "0.8rem" }}
                >
                  <option value="viewer">مشاهد</option>
                  <option value="super_admin">مسؤول رئيسي</option>
                </select>
                <button onClick={() => handleRevoke(admin.id)} style={btnDanger}>حذف</button>
              </div>
            </div>
          ))}
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

export default ManageAdmins;