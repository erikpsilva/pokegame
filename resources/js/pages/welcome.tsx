import { Head, Link } from '@inertiajs/react';
export default function Welcome() {
    return (
        <>
            <Head title="Início" />
            <main className="flex min-h-dvh items-center justify-center bg-slate-950 p-6 text-slate-100">
                <section className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-8 sm:p-12">
                    <p className="text-sm font-semibold tracking-widest text-amber-400">PROJETO EM DESENVOLVIMENTO</p>
                    <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Pokegame</h1>
                    <p className="mt-5 text-base leading-relaxed text-slate-300">
                        A base do nosso jogo de navegador está pronta. O próximo passo será explorar sprites, personagens e mapas.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href={route('login')} className="rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300">
                            Entrar
                        </Link>
                        <Link href={route('register')} className="rounded-xl border border-slate-600 px-5 py-3 font-semibold hover:bg-slate-800">
                            Criar conta
                        </Link>
                    </div>
                </section>
            </main>
        </>
    );
}
