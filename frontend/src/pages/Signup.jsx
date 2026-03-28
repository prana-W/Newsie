import {useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card} from '@/components/ui/card';
import {SERVER_URL} from '@/lib/env';

import {User, Mail, ShieldCheck} from 'lucide-react';
import {toast} from 'sonner';

export default function SignupUser() {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        tone: 'neutral',
        language: 'English',
        preferredCategories: [],
    });

    const categoryOptions = [
        'Markets News',
        'Economy',
        'Technology',
        'Global',
        'Policy',
        'Startups',
    ];

    const handleChange = (key, value) => {
        setForm({...form, [key]: value});
    };

    const toggleCategory = (category) => {
        const exists = form.preferredCategories.includes(category);
        setForm({
            ...form,
            preferredCategories: exists
                ? form.preferredCategories.filter((item) => item !== category)
                : [...form.preferredCategories, category],
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(SERVER_URL + '/api/v1/user/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify(form),
            });

            const contentType = res.headers.get('content-type') || '';
            const data = contentType.includes('application/json')
                ? await res.json()
                : null;
            if (!res.ok) throw new Error(data?.message || 'Signup failed');

            // Store token if the API returns one on registration
            const token =
                data?.token ||
                data?.accessToken ||
                data?.data?.token ||
                data?.data?.accessToken;
            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('role', 'user');
                localStorage.setItem(
                    'newsie:preferences',
                    JSON.stringify({
                        tone: form.tone,
                        language: form.language,
                        preferredCategories: form.preferredCategories,
                    })
                );
                toast.success('Account created successfully');
                window.location.href = '/';
            } else {
                toast.success('Account created! Please log in.');
                window.location.href = '/login';
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#0d1117] flex flex-col items-center justify-center px-6 font-['Inter'] py-8">
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
                    Create account
                </h1>
                <p className="text-sm text-white/40 mb-8">
                    Join to stay up to date with verified news.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* FULL NAME */}
                    <div className="space-y-1.5">
                        <Label className="text-white/70 text-xs uppercase tracking-wider font-semibold ml-1">
                            Full Name
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
                            <Input
                                required
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-[#a78bfa]"
                                placeholder="John Doe"
                                value={form.name}
                                onChange={(e) =>
                                    handleChange('name', e.target.value)
                                }
                            />
                        </div>
                    </div>

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

                        <div className="space-y-1.5">
                            <Label className="text-white/70 text-xs uppercase tracking-wider font-semibold ml-1">
                                Preferred Tone
                            </Label>
                            <select
                                className="w-full bg-white/5 border border-white/10 text-white h-11 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-[#a78bfa]"
                                value={form.tone}
                                onChange={(e) =>
                                    handleChange('tone', e.target.value)
                                }
                            >
                                <option value="neutral">Neutral</option>
                                <option value="professional">
                                    Professional
                                </option>
                                <option value="genz">Gen-Z</option>
                                <option value="brief">Brief</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-white/70 text-xs uppercase tracking-wider font-semibold ml-1">
                                Preferred Language
                            </Label>
                            <select
                                className="w-full bg-white/5 border border-white/10 text-white h-11 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-[#a78bfa]"
                                value={form.language}
                                onChange={(e) =>
                                    handleChange('language', e.target.value)
                                }
                            >
                                <option value="English">English</option>
                                <option value="Hindi">Hindi</option>
                                <option value="Tamil">Tamil</option>
                                <option value="Bengali">Bengali</option>
                                <option value="Marathi">Marathi</option>
                                <option value="Telugu">Telugu</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider font-semibold ml-1">
                                Preferred News Types
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {categoryOptions.map((category) => {
                                    const selected =
                                        form.preferredCategories.includes(
                                            category
                                        );
                                    return (
                                        <button
                                            type="button"
                                            key={category}
                                            onClick={() =>
                                                toggleCategory(category)
                                            }
                                            className={`text-xs px-2 py-2 rounded-lg border transition-colors ${
                                                selected
                                                    ? 'bg-[#a78bfa]/30 border-[#a78bfa] text-white'
                                                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                            }`}
                                        >
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* SUBMIT */}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white h-11 rounded-xl font-semibold tracking-wide mt-2 transition-all shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:shadow-[0_0_25px_rgba(167,139,250,0.5)]"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </Button>

                    {/* LOGIN LINK */}
                    <p className="text-center text-sm text-white/40 mt-6 pt-2">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-[#a78bfa] hover:text-white transition-colors font-medium"
                        >
                            Log in
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
