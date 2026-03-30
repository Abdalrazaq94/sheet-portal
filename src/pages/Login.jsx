import { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const ref = doc(db, "users", result.user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const role = snap.data().role;
        if (role === "super_admin") navigate("/admin");
        else navigate("/search");
      } else {
        setError("المستخدم غير موجود في النظام");
      }
    } catch (err) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-secondary)"
    }}>
      <div style={{
        background: "var(--bg-card)",
        border: "0.5px solid var(--border)",
        borderRadius: "16px",
        padding: "2rem",
        width: "100%",
        maxWidth: "360px"
      }}>
        <h1 style={{
          fontSize: "1.6rem",
          fontWeight: "700",
          marginBottom: "0.3rem",
          color: "var(--accent)",
          textAlign: "center"
        }}>
          محروقات ديرالزور
        </h1>

        <h2 style={{
          fontSize: "1.1rem",
          fontWeight: "500",
          marginBottom: "0.3rem",
          textAlign: "center"
        }}>
          مرحباً بك
        </h2>

        <p style={{
          fontSize: "0.9rem",
          color: "var(--text-secondary)",
          marginBottom: "1.5rem",
          textAlign: "center"
        }}>
          سجّل دخولك للمتابعة
        </p>

        <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          البريد الإلكتروني
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="example@email.com"
          style={{
            width: "100%", padding: "10px", margin: "6px 0 14px",
            border: "0.5px solid var(--border)", borderRadius: "8px",
            background: "var(--bg-primary)", color: "var(--text-primary)",
            fontSize: "0.95rem", direction: "ltr", textAlign: "right"
          }}
        />

        <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          كلمة المرور
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{
            width: "100%", padding: "10px", margin: "6px 0 14px",
            border: "0.5px solid var(--border)", borderRadius: "8px",
            background: "var(--bg-primary)", color: "var(--text-primary)",
            fontSize: "0.95rem"
          }}
        />

        {error && (
          <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "10px",
            background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: "8px",
            fontSize: "1rem", cursor: "pointer"
          }}
        >
          {loading ? "جاري التحميل..." : "تسجيل الدخول"}
        </button>

        <p style={{
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          textAlign: "center",
          marginTop: "1.2rem"
        }}>
          إذا واجهت مشكلة في تسجيل الدخول، يرجى التواصل مع المسؤول
        </p>
      </div>
    </div>
  );
}

export default Login;