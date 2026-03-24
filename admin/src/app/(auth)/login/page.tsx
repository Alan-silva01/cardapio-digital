"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import logoImg from "@/assets/images/logo.png";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (authError) throw authError;

            // Read cargo from JWT app_metadata — zero extra DB queries
            const cargo = data.user?.app_metadata?.cargo;

            if (!cargo) {
                await supabase.auth.signOut();
                throw new Error("Usuário não cadastrado como funcionário");
            }

            if (cargo !== "dono" && cargo !== "admin") {
                await supabase.auth.signOut();
                throw new Error("Sem permissão de administrador");
            }

            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Credenciais inválidas");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-background text-foreground">
            {/* Esquerda: Branding (50%) */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center items-center relative overflow-hidden bg-[#0A0A0A] text-white">
                {/* Textura sutil vintage de fundo (opcional/css) */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />

                <div className="z-10 text-center flex flex-col items-center">
                    <div className="mb-8 overflow-hidden">
                        <Image 
                            src="/images/logo_bar.png" 
                            alt="Logo Seu Manel" 
                            width={280} 
                            height={280} 
                            className="object-contain w-48 h-48 sm:w-64 sm:h-64"
                            priority
                        />
                    </div>
                    <h1 className="text-6xl font-serif font-bold tracking-tighter mb-4 text-white">
                        SEU MANEL
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
                        Painel Administrativo
                    </p>
                </div>
            </div>

            {/* Direita: Form (50%) */}
            <div className="w-full lg:w-1/2 flex justify-center items-center bg-card p-8 border-l border-border">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center space-y-2 flex flex-col items-center">
                        <Image src={logoImg} alt="Logo" className="w-24 h-auto mb-4" priority />
                        <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                            Bem-vindo de volta
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Faça login para acessar o painel
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@seumanel.com"
                                    className="bg-background border-border focus-visible:ring-foreground"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password" className="text-foreground">Senha</Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="bg-background border-border focus-visible:ring-foreground pr-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <Link href="/register" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                        Criar conta
                                    </Link>
                                    <Link href="/login/reset" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                        Recuperar senha
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#ff5e1e] hover:bg-[#e54e15] text-white rounded-md h-10 shadow-none border border-[#e54e15]/20"
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
