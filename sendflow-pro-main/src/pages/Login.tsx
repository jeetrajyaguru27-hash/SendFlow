import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Share2, BarChart3, MessageSquare, ShieldCheck, LogIn } from "lucide-react";

const CONTACT_EMAIL = "contact@sendflow.app";

export const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onLogin();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#05060f] text-white">
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.18),_transparent_55%)] blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-16 h-80 w-80 rounded-full bg-[#e11d48]/10 blur-3xl animate-float" />
        <div className="pointer-events-none absolute left-0 bottom-20 h-72 w-72 rounded-full bg-[#a855f7]/10 blur-3xl animate-float delay-200" />

        <div className="relative w-full max-w-6xl space-y-10 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(188,63,173,0.12)] backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold tracking-wide text-rose-200 shadow-lg shadow-rose-500/10 backdrop-blur-sm">
                <img src="/logo.png" alt="SendFlow logo" className="h-6 w-6 rounded-lg object-cover" />
                SendFlow App
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-5xl font-black tracking-tight text-white sm:text-6xl">
                  Automate Gmail campaigns with a premium, glass-style dashboard.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                  Send smarter email sequences from your personal Gmail account with hourly batching, cleaner headers, and built-in response tracking.
                </p>
              </div>

              {error && (
                <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100 shadow-sm shadow-rose-500/10">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500 text-white border-0 shadow-xl shadow-rose-500/20 transition-all duration-300 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    {isLoading ? 'Opening Google...' : 'Login with Google'}
                  </span>
                </Button>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=SendFlow%20Contact`}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-rose-300/30 hover:bg-white/10"
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> Contact Me
                </a>
              </div>
            </div>

            <Card className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#09101d]/90 p-6 shadow-2xl shadow-fuchsia-500/10 animate-fade-in">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,63,94,0.16),_transparent_40%)]" />
              <div className="relative space-y-6">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.32em] text-rose-300/80">SendFlow features</p>
                  <h2 className="text-2xl font-semibold text-white">Built for inbox-friendly delivery.</h2>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-rose-400 mt-1" />
                      <div>
                        <p className="font-semibold text-white">Hourly send control</p>
                        <p className="text-sm text-slate-300">Spread email volume naturally across the day.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-fuchsia-400 mt-1" />
                      <div>
                        <p className="font-semibold text-white">Gmail-safe deliverability</p>
                        <p className="text-sm text-slate-300">Avoid spam flags with lower-rate personal sending.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <Share2 className="h-5 w-5 text-sky-400 mt-1" />
                      <div>
                        <p className="font-semibold text-white">Tracking and replies</p>
                        <p className="text-sm text-slate-300">Know who opens, clicks, and replies to your campaign.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="rounded-[1.65rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-rose-500/10 transition-transform duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-lg text-white">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>Connect Gmail securely and authorize send access.</p>
                <p>Upload a lead list and choose your send schedule.</p>
                <p>Launch the campaign and monitor performance.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.65rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-fuchsia-500/10 transition-transform duration-300 hover:-translate-y-1.5">
              <CardHeader>
                <CardTitle className="text-lg text-white">What it automates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>Hourly batch scheduling for natural send behavior.</p>
                <p>Volume limits to protect sender reputation.</p>
                <p>Open, click, and reply tracking in one view.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.65rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-sky-500/10 transition-transform duration-300 hover:-translate-y-2">
              <CardHeader>
                <CardTitle className="text-lg text-white">Why it matters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>SendFlow makes personal Gmail feel more like a polished outbound workflow.</p>
                <p>Cleaner headers and smoother timing reduce spam risk.</p>
                <p>Build campaigns that look intentional, not bulk.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

