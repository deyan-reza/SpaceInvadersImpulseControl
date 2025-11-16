import { useRef, useState } from 'react';
import { PhaserGame } from './PhaserGame';
import Login from './Login';
import Signup from './Signup';
import { EventBus } from './game/EventBus';  
import { useEffect } from 'react';


function App() {
    const phaserRef = useRef();
    const [currentPage, setCurrentPage] = useState('home');
    const [auth, setAuth] = useState({
        userId: localStorage.getItem("userId"),
        username: localStorage.getItem("username")
    });

    useEffect(() => {
        const handleHome = () => {
            console.log("EventBus → go-home received.");
            setCurrentPage("home");
        };

        EventBus.on('go-home', handleHome);

        return () => {
            EventBus.off('go-home', handleHome);
        };
    }, []);

    const logout = () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
        localStorage.removeItem("username");

        setAuth({ userId: null, username: null });
        setCurrentPage("home");
    };

    return (
        <div id="app" style={{ position: "relative" }}>

            {/* ⭐ ALWAYS TOP-RIGHT USER BAR ⭐ */}
            <div 
                className="user-bar" 
                style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "18px",
                    color: "white"
                }}
            >
                {auth.userId ? (
                    <>
                        <span>Logged in as <strong>{auth.username}</strong></span>
                        <button onClick={logout} className="logout-btn">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <button className="cta-button" onClick={() => setCurrentPage("login")}>
                            Login
                        </button>
                        <button className="cta-button secondary" onClick={() => setCurrentPage("signup")}>
                            Sign Up
                        </button>
                    </>
                )}
            </div>

            {/* MAIN CONTENT */}
            {currentPage === "home" ? (
                <PhaserGame ref={phaserRef} />
            ) : (
                <div className="auth-page">
                    <button className="back-button" onClick={() => setCurrentPage("home")}>
                        &lt; Back
                    </button>

                    {currentPage === "login" ? (
                        <Login setCurrentPage={setCurrentPage} onAuth={setAuth} />
                    ) : (
                        <Signup setCurrentPage={setCurrentPage} onAuth={setAuth} />
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
