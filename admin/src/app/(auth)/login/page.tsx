"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Optional: check role in funcionarios table
            const { data: funcData, error: funcError } = await supabase
                .from("funcionarios")
                .select("cargo, ativo")
                .eq("auth_id", data.user.id)
                .single();

            if (funcError || !funcData) {
                await supabase.auth.signOut();
                throw new Error("Usuário não tem permissão para acessar o painel");
            }

            if (!funcData.ativo) {
                await supabase.auth.signOut();
                throw new Error("Contra desativada");
            }

            if (funcData.cargo !== "dono" && funcData.cargo !== "admin") {
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
        <div className="min-h-screen w-full flex bg-[#0D0D0D] text-[#ededed]">
            {/* Esquerda: Branding (50%) */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center items-center relative overflow-hidden">
                {/* Textura sutil vintage de fundo (opcional/css) */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />

                <div className="z-10 text-center">
                    <h1 className="text-6xl font-serif font-bold text-[#F9F6EE] tracking-tighter mb-4">
                        SEU MANEL
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#a1a1aa]">
                        Painel Administrativo
                    </p>
                </div>
            </div>

            {/* Direita: Form (50%) */}
            <div className="w-full lg:w-1/2 flex justify-center items-center bg-[#1A1A1A] p-8">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center lg:text-left space-y-2">
                        <h2 className="text-2xl font-semibold text-[#F9F6EE] tracking-tight">
                            Bem-vindo de volta
                        </h2>
                        <p className="text-sm text-[#a1a1aa]">
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
                                <Label htmlFor="email" className="text-[#ededed]">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@seumanel.com"
                                    className="bg-[#0D0D0D] border-[#27272a] focus-visible:ring-[#ededed]"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password" className="text-[#ededed]">Senha</Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="bg-[#0D0D0D] border-[#27272a] focus-visible:ring-[#ededed] pr-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#ededed]"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <div className="flex justify-end pt-1">
                                    <Link href="/login/reset" className="text-xs text-[#a1a1aa] hover:text-[#ededed] transition-colors">
                                        Esqueci minha senha
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
