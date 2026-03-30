import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function ViewerSearch({ theme, setTheme }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchConfig, setSearchConfig] = useState(null);
  const [sheetId, setSheetId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      const sheetSnap = await getDoc(doc(db, "config", "sheet"));
      if (sheetSnap.exists()) setSheetId(sheetSnap.data().sheetId);

      const searchSnap = await getDoc(doc(db, "config", "search"));
      if (searchSnap.exists()) setSearchConfig(searchSnap.data());
    };
    fetchConfig();
  }, []);

  const buildHeaders = (row3, row4) => {
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
    return combined;
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    if (!sheetId) { setError("لم يتم ربط أي ملف بعد"); return; }
    if (!searchConfig) { setError("لم يتم ضبط إعدادات البحث بعد"); return; }

    setLoading(true);
    setError("");
    setResults([]);
    setSelected(null);
    setSearched(true);

    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z?key=${import.meta.env.VITE_SHEETS_API_KEY}`
      );
      const data = await res.json();

      if (!data.values || data.values.length < 5) {
        setError("الملف فارغ أو لا يحتوي على بيانات");
        setLoading(false);
        return;
      }

      const headerIndex = (searchConfig.headerRow || 3) - 1;
      const hasSubHeader = searchConfig.hasSubHeader ?? true;
      const dataStart = (searchConfig.dataStartRow || 5) - 1;
      const row3 = data.values[headerIndex];
      const row4 = hasSubHeader ? (data.values[headerIndex + 1] || []) : [];
      const headers = buildHeaders(row3, row4);
      const rows = data.values.slice(dataStart);

      const searchByIndices = searchConfig.searchBy
        .map(col => headers.indexOf(col))
        .filter(i => i !== -1);

      const matched = rows.filter(row =>
        searchByIndices.some(i =>
          row[i] && row[i].toString().toLowerCase().includes(query.toLowerCase())
        )
      );

      const formatted = matched.map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ""; });
        return obj;
      });

      setResults(formatted);
    } catch (err) {
      setError("حدث خطأ أثناء البحث");
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
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} style={iconBtn}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button onClick={handleLogout} style={{ ...iconBtn, color: "var(--danger)" }}>خروج</button>
        </div>
      </nav>

      <div style={{ padding: "1.5rem", maxWidth: "700px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "500", marginBottom: "6px" }}>البحث في السجلات</h2>
          {searchConfig && (
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              البحث بواسطة: {searchConfig.searchBy?.join("، ")}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="اكتب للبحث..."
            style={{
              flex: 1, padding: "12px 14px",
              border: "0.5px solid var(--border)", borderRadius: "8px",
              background: "var(--bg-primary)", color: "var(--text-primary)",
              fontSize: "1rem"
            }}
          />
          <button onClick={handleSearch} disabled={loading} style={btnPrimary}>
            {loading ? "..." : "بحث"}
          </button>
        </div>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
        )}

        {searched && !loading && results.length === 0 && !error && (
          <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            لا توجد نتائج مطابقة
          </p>
        )}

        {selected ? (
          <div style={{
            background: "var(--bg-card)", border: "0.5px solid var(--border)",
            borderRadius: "12px", padding: "1.2rem 1.5rem"
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "12px"
            }}>
              <div style={{ fontWeight: "500", fontSize: "1rem" }}>تفاصيل السجل</div>
              <button onClick={() => setSelected(null)} style={btnSecondary}>رجوع</button>
            </div>
            {searchConfig?.showFields?.map(field => {
              const value = selected[field];
              if (!value || value.trim() === "") return null;
              return (
                <div key={field} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: "0.5px solid var(--border)",
                  fontSize: "0.95rem"
                }}>
                  <span style={{ color: "var(--text-secondary)" }}>{field}</span>
                  <span style={{ fontWeight: "500" }}>{value}</span>
                </div>
              );
            })}
          </div>
        ) : (
          results.map((row, i) => (
            <div
              key={i}
              onClick={() => setSelected(row)}
              style={{
                background: "var(--bg-card)", border: "0.5px solid var(--border)",
                borderRadius: "12px", padding: "1rem 1.2rem", marginBottom: "10px",
                cursor: "pointer"
              }}
            >
              <div style={{ fontWeight: "500", fontSize: "1rem", marginBottom: "6px" }}>
                {searchConfig?.searchBy?.map(f => row[f]).filter(Boolean).join(" — ")}
              </div>
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "12px",
                fontSize: "0.85rem", color: "var(--text-secondary)"
              }}>
                {searchConfig?.showFields?.slice(0, 4).map(field => {
                  const value = row[field];
                  if (!value || value.trim() === "") return null;
                  return (
                    <span key={field}>{field}: {value}</span>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const iconBtn = {
  background: "transparent", border: "0.5px solid var(--border)",
  borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
  fontSize: "0.85rem", color: "var(--text-primary)"
};

const btnPrimary = {
  padding: "10px 20px", background: "var(--accent)", color: "#fff",
  border: "none", borderRadius: "8px", fontSize: "0.95rem", cursor: "pointer"
};

const btnSecondary = {
  padding: "6px 12px", background: "var(--bg-secondary)", color: "var(--text-primary)",
  border: "0.5px solid var(--border)", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer"
};

export default ViewerSearch;