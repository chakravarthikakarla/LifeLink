import { createContext, useContext, useState, useEffect } from "react";
import axios from "../services/api";

const AuthContext = createContext();

const getStoredItem = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

const setStoredItem = (key, value) => {
    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
};

const removeStoredItem = (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = getStoredItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState(getStoredItem("token"));
    const [loading, setLoading] = useState(true);

    const logout = () => {
        setToken(null);
        setUser(null);
        removeStoredItem("token");
        removeStoredItem("user");
        removeStoredItem("userId");
        window.location.href = "/";
    };

    useEffect(() => {
        const verifyUser = async () => {
            if (token) {
                try {
                    const res = await axios.get("/user/profile");
                    setUser(res.data);
                    setStoredItem("user", JSON.stringify(res.data));
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
        setStoredItem("token", newToken);
        setStoredItem("user", JSON.stringify(userData));
        setStoredItem("userId", userData.id || userData._id);
    };

    const updateUser = (userData) => {
        setUser(userData);
        setStoredItem("user", JSON.stringify(userData));
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, setUser, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
