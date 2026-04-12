import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import login from "../assets/login.png";
import { useLogin } from "@/hooks/useLogin";

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // استخدام الهوك الـ Global اللي عملناه
    const { mutate, isPending } = useLogin();

    const handleLogin = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        mutate(data, {
            onSuccess: () => {
                // The store update and toast are already handled inside useLogin!
                navigate("/");
            },
        });
    };

    return (
        <div className="flex h-screen w-full flex-col md:flex-row font-sans">
            {/* --- القسم الأيسر: الصورة والـ Overlay --- */}
            <div className="relative hidden h-full w-1/2 md:block">
                <img
                    src={login}
                    alt="Food background"
                    className="h-full w-full object-cover"
                />
                {/* الـ Overlay البرتقالي */}
                <div className="absolute inset-0 flex items-center bg-primary/50 p-12 lg:p-20">
                    <div className="max-w-md text-white">
                        <h1 className="text-6xl font-black tracking-tighter">WELCOME TO KEETO</h1>
                        <p className="mt-4 text-xl font-medium opacity-90">
                            Manage your app & website easily
                        </p>
                    </div>
                </div>
            </div>

            {/* --- القسم الأيمن: الفورم --- */}
            <div className="relative flex flex-1 flex-col items-center justify-center bg-white px-8">

                <div className="w-full max-w-[400px] space-y-10">
                    {/* الـ Logo والعنوان */}
                    <div className="text-center">
                        <h2 className="text-5xl font-black text-primary tracking-tight">Keeto</h2>
                        <p className="mt-6 text-2xl font-bold text-gray-800">
                            Signin To Your Restaurant Panel
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-600 font-semibold">Your Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                required
                                className="h-14 border-gray-200 focus-visible:ring-primary"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" title="Password" className="text-gray-600 font-semibold">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="h-14 border-gray-200 pr-12 focus-visible:ring-[#F4A100]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                </button>
                            </div>
                        </div>

                        {/* زرار الدخول */}
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-14 w-full bg-primary text-lg font-bold text-white hover:bg-primary/80 shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
                        >
                            {isPending ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;