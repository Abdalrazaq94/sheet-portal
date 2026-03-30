import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

function SearchSettings({ theme, setTheme }) {
  const [columns, setColumns] = useState([]);
  const [searchBy, setSearchBy] = useState([]);
  const [showFields, setShowFields] = useState([]);
  const [newColumn, setNewColumn] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sheetId, setSheetId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [headerRow, setHeaderRow] = useState(3);
  const [hasSubHeader, setHasSubHeader] = useState(true);
  const [dataStartRow, setDataStartRow] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const sheetSnap = await getDoc(doc(db, "config", "sheet"));
      if (sheetSnap.exists()) setSheetId(sheetSnap.data().sheetId);

      const searchSnap = await getDoc(doc(db, "config", "search"));
      if (searchSnap.exists()) {
        const data = searchSnap.data();
        setColumns(data.columns || []);
        setSearchBy(data.searchBy || []);
        setShowFields(data.showFields || []);
        setHeaderRow(data.headerRow || 3);
        setHasSubHeader(data.hasSubHeader ?? true);
        setDataStartRow(data.dataStartRow || 5);
      }
    };
    fetchData();
  }, []);

  const fetchColumnsFromSheet = async () => {
    if (!sheetId) { setError("يرجى ربط ملف Google Sheet أولاً"); return; }
    setFetching(true);
    setError("");
    try {
      const subRow = hasSubHeader ? headerRow + 1 : headerRow;
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A${headerRow}:Z${subRow}?key=${import.meta.env.VITE_SHEETS_API_KEY}`
      );
      const data = await res.json();
      if (data.values && data.values[0]) {
        const row3 = data.values[0];
        const row4 = hasSubHeader ? (data.values[1] || []) : [];
        const combined = [];
        let lastMainHeader = "";

        row3.forEach((cell, i) => {
          if (cell && cell.trim() !== "") lastMainHeader = cell.trim();
          const subCell = row4[i] ? row4[i].trim() : "";
          if (subCell !== "" && subCell !== lastMainHeader) {
            combined.push(`${lastMainHeader} - ${subCell}`);
          } else if (cell && cell.trim() !== "") {
            combined.push(cell.trim());
          } else {
            combined.push(lastMainHeader);
          }
        });

        setColumns([...new Set(combined.filter(c => c !== ""))]);
        setMessage("تم جلب الأعمدة بنجاح");
      } else {
        setError("لم يتم العثور على أعمدة في الملف");
      }
    } catch (err) {
      setError("حدث خطأ أثناء جلب الأعمدة");
    }
    setFetching(false);
  };

  const toggleSearchBy = (col) => {
    setSearchBy(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const toggleShowFields = (col) => {
    setShowFields(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const addManualColumn = () => {
    if (!newColumn.trim()) return;
    if (columns.includes(newColumn.trim())) { setError("هذا العمود موجود مسبقاً"); return; }
    setColumns(prev => [...prev, newColumn.trim()]);
    setNewColumn("");
  };

  const handleSave = async () => {
    if (searchBy.length === 0) { setError("يرجى اختيار حقل بحث واحد على الأقل"); return; }
    if (showFields.length === 0) { setError("يرجى اختيار حقل عرض واحد على الأقل"); return; }
    setLoading(true);
    setError("");
    try {
      await setDoc(doc(db, "config", "search"), {
        columns, searchBy, showFields,
        headerRow, hasSubHeader, dataStartRow
      });
      setMessage("تم حفظ الإعدادات بنجاح");
    } catch (err) {
      setError("حدث خطأ أثناء الحفظ");
    }
    setLoading(false);
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
          <Link to="/admin/connect" style={navStyle(false)}>ربط الملف</Link>
          <Link to="/admin/settings" style={navStyle(true)}>إعدادات البحث</Link>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} style={iconBtn}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button onClick={handleLogout} style={{ ...iconBtn, color: "var(--danger)" }}>خروج</button>
        </div>
      </nav>

      <div style={{ padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "500", marginBottom: "1.2rem" }}>إعدادات البحث</h2>

        <div style={card}>
          <div style={{ fontWeight: "500", marginBottom: "12px" }}>إعدادات بنية الملف</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>رقم صف العناوين الرئيسية</label>
              <input
                type="number" min="1" value={headerRow}
                onChange={e => setHeaderRow(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>رقم صف بداية البيانات</label>
              <input
                type="number" min="1" value={dataStartRow}
                onChange={e => setDataStartRow(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <input
              type="checkbox" id="subheader"
              checked={hasSubHeader}
              onChange={e => setHasSubHeader(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="subheader" style={{ fontSize: "0.9rem", cursor: "pointer" }}>
              يوجد صف عناوين فرعية تحت العناوين الرئيسية
            </label>
          </div>

          <button onClick={fetchColumnsFromSheet} disabled={fetching} style={btnPrimary}>
            {fetching ? "جاري الجلب..." : "جلب الأعمدة تلقائياً"}
          </button>

          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            <input
              value={newColumn}
              onChange={e => setNewColumn(e.target.value)}
              placeholder="أو أضف عموداً يدوياً"
              style={{ ...inputStyle, margin: 0, flex: 1 }}
            />
            <button onClick={addManualColumn} style={btnSecondary}>إضافة</button>
          </div>
        </div>

        {columns.length > 0 && (
          <>
            <div style={card}>
              <div style={{ fontWeight: "500", marginBottom: "4px" }}>البحث بواسطة</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                اختر الأعمدة التي يمكن للمستخدم البحث بها
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {columns.map(col => (
                  <span key={col} onClick={() => toggleSearchBy(col)} style={{
                    padding: "6px 14px", borderRadius: "8px", fontSize: "0.9rem", cursor: "pointer",
                    background: searchBy.includes(col) ? "var(--accent-light)" : "var(--bg-secondary)",
                    color: searchBy.includes(col) ? "var(--accent)" : "var(--text-secondary)",
                    border: searchBy.includes(col) ? "0.5px solid var(--accent)" : "0.5px solid var(--border)"
                  }}>
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight: "500", marginBottom: "4px" }}>يظهر في النتائج</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                اختر الأعمدة التي تظهر على بطاقة النتيجة
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {columns.map(col => (
                  <span key={col} onClick={() => toggleShowFields(col)} style={{
                    padding: "6px 14px", borderRadius: "8px", fontSize: "0.9rem", cursor: "pointer",
                    background: showFields.includes(col) ? "var(--accent-light)" : "var(--bg-secondary)",
                    color: showFields.includes(col) ? "var(--accent)" : "var(--text-secondary)",
                    border: showFields.includes(col) ? "0.5px solid var(--accent)" : "0.5px solid var(--border)"
                  }}>
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {error && <p style={{ color: "var(--danger)", fontSize: "0.85rem", margin: "8px 0" }}>{error}</p>}
        {message && <p style={{ color: "var(--success)", fontSize: "0.85rem", margin: "8px 0" }}>{message}</p>}

        <button onClick={handleSave} disabled={loading} style={btnPrimary}>
          {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
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

const labelStyle = {
  fontSize: "0.85rem", color: "var(--text-secondary)",
  display: "block", marginBottom: "4px"
};

const inputStyle = {
  width: "100%", padding: "10px", margin: "0 0 12px",
  border: "0.5px solid var(--border)", borderRadius: "8px",
  background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.95rem"
};

const btnPrimary = {
  padding: "10px 20px", background: "var(--accent)", color: "#fff",
  border: "none", borderRadius: "8px", fontSize: "0.95rem", cursor: "pointer"
};

const btnSecondary = {
  padding: "10px 16px", background: "var(--bg-secondary)", color: "var(--text-primary)",
  border: "0.5px solid var(--border)", borderRadius: "8px", fontSize: "0.95rem", cursor: "pointer"
};

export default SearchSettings;