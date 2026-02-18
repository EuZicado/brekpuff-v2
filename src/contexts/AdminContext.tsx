
import React, { createContext, useContext, useState, useEffect } from "react";

interface AdminContextType {
    isAdmin: boolean;
    toggleAdmin: () => void;
    triggerPaymentModal: () => void;
    isPaymentModalOpen: boolean;
    setPaymentModalOpen: (open: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

    // Secret trigger: Shift+A
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === "A") {
                setIsAdmin((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const toggleAdmin = () => setIsAdmin((prev) => !prev);
    const triggerPaymentModal = () => setPaymentModalOpen(true);

    return (
        <AdminContext.Provider value={{ isAdmin, toggleAdmin, triggerPaymentModal, isPaymentModalOpen, setPaymentModalOpen }}>
            {children}
        </AdminContext.Provider>
    );
}

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error("useAdmin must be used within an AdminProvider");
    }
    return context;
};
