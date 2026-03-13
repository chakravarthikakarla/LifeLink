import { createContext, useContext, useState, useEffect } from "react";
import axios from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(sessionStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        
        const verifyUser = async () => {
            if (token) {
                try {
                    const res = await axios.get("/user/profile");
                    setUser(res.data);
                    sessionStorage.setItem("user", JSON.stringify(res.data));
                } catch (err) {
                    console.error("Auth verification failed:", err);
                    logout();
                }
            }
            setLoading(false);
        };

        verifyUser();
    }, [token]);

    const login = (newToken, userData) => {
        setToken(newToken);
        setUser(userData);
        sessionStorage.setItem("token", newToken);
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("userId", userData.id || userData._id);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userId");
        window.location.href = "/";
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
