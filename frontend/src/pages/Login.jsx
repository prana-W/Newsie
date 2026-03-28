import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card} from '@/components/ui/card';
import {SERVER_URL} from '@/lib/env';

import {Mail, ShieldCheck} from 'lucide-react';
import {toast} from 'sonner';

export default function LoginUser() {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const navigate = useNavigate();

    const handleChange = (key, value) => {
        setForm({...form, [key]: value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(SERVER_URL + '/api/v1/user/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify(form),
            });

            const contentType = res.headers.get('content-type') || '';
            const data = contentType.includes('application/json')
                ? await res.json()
                : null;
            if (!res.ok) throw new Error(data?.message || 'Login failed');

            // Persist token — adjust the key if your API returns it differently
            const token =
                data?.token ||
                data?.accessToken ||
                data?.data?.token ||
                data?.data?.accessToken;
            if (token) localStorage.setItem('token', token);
            localStorage.setItem('role', 'user');

            const preferences = data?.preferences || data?.data?.preferences;
            if (preferences) {
                localStorage.setItem(
                    'newsie:preferences',
                    JSON.stringify(preferences)
                );
            }

            console.log(token);

            toast.success('Logged in successfully');
            window.location.href = '/';
            // later → redirect to dashboard
        } catch (err) {
            toast.error(err?.message || err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#0d1117] flex flex-col items-center justify-center px-6 font-['Inter']">
            {/* Brand */}
            <div className="mb-10 text-center animate-[fadeUp_0.4s_ease-out]">
                <span
                    className="text-white font-black text-4xl tracking-tight"
                    style={{
                        fontFamily: "'Georgia', serif",
                        textShadow: '0 4px 20px rgba(167, 139, 250, 0.4)',
                    }}
                >
                    newsie
                </span>
            </div>

            <div className="w-full max-w-[360px] bg-[#0d1117]/80 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 shadow-2xl animate-[fadeUp_0.6s_ease-out]">
                <h1 className="text-xl font-bold text-white mb-1 tracking-tight">
                    Welcome back
                </h1>
                <p className="text-sm text-white/40 mb-8">
                    Enter your details to access your account.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* EMAIL */}
                    <div className="space-y-1.5">
                        <Label className="text-white/70 text-xs uppercase tracking-wider font-semibold ml-1">
                            Email Address
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
                            <Input
                                type="email"
                                required
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-[#a78bfa]"
                                placeholder="user@example.com"
                                value={form.email}
                                onChange={(e) =>
                                    handleChange('email', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    {/* PASSWORD */}
                    <div className="space-y-1.5">
                        <Label className="text-white/70 text-xs uppercase tracking-wider font-semibold ml-1">
                            Password
                        </Label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
                            <Input
                                type="password"
                                required
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-[#a78bfa]"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) =>
                                    handleChange('password', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    {/* SUBMIT */}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white h-11 rounded-xl font-semibold tracking-wide mt-2 transition-all shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:shadow-[0_0_25px_rgba(167,139,250,0.5)]"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </Button>

                    {/* SIGNUP LINK */}
                    <p className="text-center text-sm text-white/40 mt-6 pt-2">
                        Don’t have an account?{' '}
                        <Link
                            to="/signup"
                            className="text-[#a78bfa] hover:text-white transition-colors font-medium"
                        >
                            Sign up
                        </Link>
                    </p>
                </form>
            </div>

            {/* Back to Home Link */}
            <Link
                to="/"
                className="mt-8 text-xs text-white/30 hover:text-white transition-colors"
            >
                ← Back to News Feed
            </Link>
        </div>
    );
}
