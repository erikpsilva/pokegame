import { Head } from '@inertiajs/react';

export default function Welcome() {
    const examples = [
        {
            title: 'Exemplo Fire Red',
            description: 'Personagem explorando Pallet Town com Pikachu seguindo.',
            url: route('demo.pallet'),
            label: 'KANTO',
            color: 'text-orange-300',
        },
        {
            title: 'Exemplo Black White',
            description: 'Personagem explorando Nuvema Town com Pikachu seguindo.',
            url: route('demo.blackwhite'),
            label: 'UNOVA',
            color: 'text-sky-300',
        },
    ];
    return (
        <>
            <Head title="Projeto Jogo" />
            <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-5 py-12 text-slate-100">
                <section className="w-full max-w-4xl">
                    <p className="text-sm font-semibold tracking-[0.2em] text-amber-300">POKEGAME</p>
                    <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Projeto Jogo</h1>
                    <p className="mt-4 text-base text-slate-400">Escolha um exemplo para explorar. Cada demo abre em uma nova aba.</p>
                    <div className="mt-9 grid gap-4 sm:grid-cols-2">
                        {examples.map((example) => (
                            <a
                                key={example.url}
                                href={example.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group rounded-2xl border border-slate-700 bg-slate-900 p-7 transition hover:border-amber-300 focus-visible:outline-2 focus-visible:outline-amber-300"
                            >
                                <span className={`text-sm font-semibold tracking-widest ${example.color}`}>{example.label}</span>
                                <h2 className="mt-4 text-2xl font-semibold">
                                    {example.title}{' '}
                                    <span aria-hidden="true" className="text-amber-300">
                                        ↗
                                    </span>
                                </h2>
                                <p className="mt-3 text-base text-slate-400">{example.description}</p>
                                <p className="mt-6 text-sm text-slate-300">W, A, S, D ou setas</p>
                            </a>
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}
