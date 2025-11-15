import { useRef, useState } from 'react';

import { PhaserGame } from './PhaserGame';
import Login from './Login';
import Signup from './Signup';

function App() {
    const phaserRef = useRef();
    const [currentPage, setCurrentPage] = useState('home'); // home | login | signup

    const goHome = () => setCurrentPage('home');

    const renderHome = () => (
        <div className="home-page">
            <PhaserGame ref={phaserRef} />
            <div className="home-actions">
                <button className="cta-button" onClick={() => setCurrentPage('login')}>
                    Login
                </button>
                <button className="cta-button secondary" onClick={() => setCurrentPage('signup')}>
                    Sign Up
                </button>
            </div>
        </div>
    );

    const renderAuthPage = (mode) => (
        <div className="auth-page">
            <button className="back-button" onClick={goHome}>
                &lt; Back to Home
            </button>
            <div className="auth-card">
                {mode === 'login' ? <Login /> : <Signup />}
            </div>
        </div>
    );

    return (
        <div id="app">
            {currentPage === 'home' ? renderHome() : renderAuthPage(currentPage)}
        </div>
    );
}

export default App;
