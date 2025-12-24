// /app/components/Header/Header.jsx (FINAL CODE)
"use client";

import Image from "next/image"; 
import styles from "./Header.module.css";

// ✅ Path: Header ke barabar mein Hooks folder hai
import { useSupabaseAuth } from "../Hooks/useSupabaseAuth"; 

export default function Header() {
    const { isSignedIn, signOut } = useSupabaseAuth();

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.left}>
                    <div className={styles.logoBox}>
                        <Image
                            src="/Logo.png"
                            alt="Logo"
                            width={36}
                            height={36}
                            priority
                        />
                    </div>
                    <span className={styles.appName}>WIGA POS</span>
                </div>

                <div className={styles.right}>
                    {/* Clerk logic ki jagah Supabase logic */}
                    {!isSignedIn ? (
                        <a href="/sign-in">
                            <button className={styles.signInBtn}>Sign In</button>
                        </a>
                    ) : (
                        <button
                            onClick={signOut}
                            className={styles.signInBtn}
                        >
                            Sign Out
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}