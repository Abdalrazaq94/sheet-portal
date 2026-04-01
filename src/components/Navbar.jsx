import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

function Navbar({ theme, setTheme, onLogout, links = [], activeLink = "" }) {
  return (
    <nav style={{
      background: "var(--bg-card)",
      borderBottom: "0.5px solid var(--border)",
      padding: "0 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "10px",
      minHeight: "60px"
    }}>
     <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <img src={logo} alt="logo" style={{ height: "50px", width: "50px", borderRadius: "50%" }} />
  <span style={{ fontWeight: "700", fontSize: "1.1rem", color: "var(--accent)" }}>
    محروقات ديرالزور
  </span>
</div>

      {links.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {links.map(link => (
            <Link key={link.to} to={link.to} style={{
              padding: "6px 12px", fontSize: "0.85rem", borderRadius: "8px",
              textDecoration: "none",
              color: activeLink === link.to ? "var(--text-primary)" : "var(--text-secondary)",
              background: activeLink === link.to ? "var(--bg-secondary)" : "transparent",
              border: activeLink === link.to ? "0.5px solid var(--border)" : "0.5px solid transparent",
              fontWeight: activeLink === link.to ? "500" : "400"
            }}>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {setTheme && (
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} style={iconBtn}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        )}
        {onLogout && (
          <button onClick={onLogout} style={{ ...iconBtn, color: "var(--danger)" }}>
            خروج
          </button>
        )}
      </div>
    </nav>
  );
}

const iconBtn = {
  background: "transparent", border: "0.5px solid var(--border)",
  borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
  fontSize: "0.85rem", color: "var(--text-primary)"
};

export default Navbar;