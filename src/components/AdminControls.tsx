
import { useEffect, useState } from "react";
import { X, Check, Timer, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useAdmin } from "@/contexts/AdminContext";

export default function AdminControls() {
    const { isAdmin, toggleAdmin, isPaymentModalOpen, setPaymentModalOpen } = useAdmin();
    const [step, setStep] = useState<"confirm" | "payment" | "success">("confirm");
    const [timeLeft, setTimeLeft] = useState(480); // 8 minutes

    // Reset step when modal opens
    useEffect(() => {
        if (isPaymentModalOpen) {
            setStep("confirm");
            setTimeLeft(480);
        }
    }, [isPaymentModalOpen]);

    // Timer
    useEffect(() => {
        if (step === "payment" && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [step, timeLeft]);

    // Mock SSE Webhook
    useEffect(() => {
        if (step === "payment") {
            // Simulate payment received after 5 seconds
            const timeout = setTimeout(() => {
                setStep("success");
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [step]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m} : ${s}`;
    };

    if (!isAdmin) return null;

    return (
        <>
            {/* Foam Button (Botão Espuma) - Admin Indicator/Toggle */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50 h-16 w-16 overflow-hidden rounded-full bg-white/5 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10 flex items-center justify-center group"
                onClick={toggleAdmin} // Toggle off
            >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 animate-pulse"></div>
                <div className="relative z-10 text-[10px] font-bold text-white/50 group-hover:text-primary font-mono flex flex-col items-center">
                    <Terminal size={20} />
                    <span className="mt-1">ADMIN</span>
                </div>
            </motion.button>

            {/* Modal Total Preto */}
            <AnimatePresence>
                {isPaymentModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] grid place-items-center bg-black/95 backdrop-blur-sm"
                    >
                        <button
                            className="absolute top-8 right-8 text-zinc-600 hover:text-red-500 transition-colors"
                            onClick={() => setPaymentModalOpen(false)}
                        >
                            <X size={32} />
                        </button>

                        <div className="w-full max-w-md p-8 text-center text-white">
                            {step === "confirm" && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                >
                                    <h2 className="mb-12 text-xl font-mono font-bold uppercase tracking-[0.2em] text-zinc-600">
                                        Terminal Presencial
                                    </h2>
                                    <h1 className="mb-16 text-4xl font-bold tracking-tighter text-white">
                                        COMPRA FÍSICA?
                                    </h1>

                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={() => setPaymentModalOpen(false)}
                                            className="px-8 py-3 border border-zinc-800 text-zinc-500 hover:text-white hover:border-white transition-all uppercase font-mono text-sm tracking-widest"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => setStep("payment")}
                                            className="px-8 py-3 bg-primary text-black font-bold uppercase font-mono text-sm tracking-widest hover:bg-primary/80 transition-all shadow-[0_0_20px_rgba(58,255,92,0.3)] hover:shadow-[0_0_30px_rgba(58,255,92,0.5)]"
                                        >
                                            Confirmar
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === "payment" && (
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="mb-8 p-4 bg-white rounded-sm shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                        <QRCodeSVG value="https://pix.mercadopago.com.br/dummy-qr" size={200} />
                                    </div>

                                    <div className="mb-8 font-mono text-xs text-zinc-500 tracking-widest">
                                        LINK CURTO: <span className="text-primary underline cursor-pointer hover:text-white">brek.pf/x9z2</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-5xl font-bold text-primary font-mono tabular-nums tracking-tighter">
                                        <Timer className="animate-spin-slow w-8 h-8 opacity-50" />
                                        {formatTime(timeLeft)}
                                    </div>

                                    <div className="mt-8 flex items-center gap-2 text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        Listening via SSE...
                                    </div>
                                </motion.div>
                            )}

                            {step === "success" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center"
                                >
                                    <motion.div
                                        animate={{ rotate: 360, scale: [0.8, 1.1, 1] }}
                                        transition={{ duration: 0.6, ease: "circOut" }}
                                        className="mb-8 flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary text-primary shadow-[0_0_50px_rgba(58,255,92,0.3)]"
                                    >
                                        <Check size={56} strokeWidth={4} />
                                    </motion.div>

                                    <h1 className="mb-4 text-4xl font-bold text-primary tracking-tighter">PAGO ✅</h1>
                                    <div className="flex flex-col gap-1 text-center">
                                        <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">Transaction ID</p>
                                        <p className="text-zinc-400 font-mono text-sm tracking-widest">{Math.random().toString(16).slice(2, 14).toUpperCase()}</p>
                                    </div>

                                    {/* Gate Animation Simulation */}
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="mt-12 w-full p-4 border border-dashed border-zinc-800 bg-zinc-900/30"
                                    >
                                        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-500">
                                            <span>Gate Control</span>
                                            <span className="text-primary">OPEN</span>
                                        </div>
                                        <div className="mt-2 h-1 w-full bg-zinc-800 overflow-hidden">
                                            <motion.div
                                                initial={{ x: "-100%" }}
                                                animate={{ x: "0%" }}
                                                transition={{ duration: 1, ease: "easeInOut" }}
                                                className="h-full w-full bg-primary"
                                            />
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
