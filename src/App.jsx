import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ManageAdmins from "./pages/ManageAdmins";
import ConnectFile from "./pages/ConnectFile";
import SearchSettings from "./pages/SearchSettings";
import ViewerSearch from "./pages/ViewerSearch";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRole(snap.data().role);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div style={{ textAlign: "center", marginTop: "4rem", fontSize: "1.2rem" }}>جاري التحميل...</div>;

  return (
    <Routes>
      <Route path="/" element={!user ? <Login /> : role === "super_admin" ? <Navigate to="/admin" /> : <Navigate to="/search" />} />
      <Route path="/admin" element={user && role === "super_admin" ? <AdminDashboard theme={theme} setTheme={setTheme} /> : <Navigate to="/" />} />
      <Route path="/admin/manage" element={user && role === "super_admin" ? <ManageAdmins theme={theme} setTheme={setTheme} /> : <Navigate to="/" />} />
      <Route path="/admin/connect" element={user && role === "super_admin" ? <ConnectFile theme={theme} setTheme={setTheme} /> : <Navigate to="/" />} />
      <Route path="/admin/settings" element={user && role === "super_admin" ? <SearchSettings theme={theme} setTheme={setTheme} /> : <Navigate to="/" />} />
      <Route path="/search" element={user && role === "viewer" ? <ViewerSearch theme={theme} setTheme={setTheme} /> : <Navigate to="/" />} />
    </Routes>
  );
}

export default App;