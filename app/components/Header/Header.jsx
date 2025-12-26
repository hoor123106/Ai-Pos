"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
// Header.jsx ke andar ye line change karein
import { authDb } from "../../utils/db.js";
import styles from "./Header.module.css";

export default function Header() {
    const [isSignedIn, setIsSignedIn] = useState(null);

    useEffect(() => {
        const checkStatus = () => {
            const status = localStorage.getItem("isLoggedIn");
            setIsSignedIn(status === "true");
        };

        checkStatus();
        window.addEventListener("storage", checkStatus);
        return () => window.removeEventListener("storage", checkStatus);
    }, []);

    const signOut = async () => {
        // Shared DB se session delete karein
        await authDb.user_session.delete("active_user");
        localStorage.setItem("isLoggedIn", "false");
        setIsSignedIn(false);
        window.location.href = "/sign-in";
    };

    if (isSignedIn === null) return <header className={styles.header}></header>;

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.left}>
                    <div className={styles.logoBox}>
                        <Image src="/Logo.png" alt="Logo" width={36} height={36} priority />
                    </div>
                    <span className={styles.appName}>WIGA POS</span>
                </div>

                <div className={styles.right}>
                    {isSignedIn ? (
                        <button onClick={signOut} className={styles.signInBtn}>Sign Out</button>
                    ) : (
                        <a href="/sign-in">
                            <button className={styles.signInBtn}>Sign In</button>
                        </a>
                    )}
                </div>
            </div>
        </header>
    );
}