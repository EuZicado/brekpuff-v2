import { motion } from "framer-motion";
import { ArrowRight, Lightning, Eye, ShieldCheck } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const sections = [
  {
    icon: Lightning,
    title: "ESTOQUE NA MÃO",
    desc: "Catálogo atualizado agora. Só listamos o que está pronto pra envio. Sem espera.",
  },
  {
    icon: Eye,
    title: "ZERO RASTROS",
    desc: "Embalagem neutra, dupla camada, remetente genérico. Ninguém sabe o que tem dentro.",
  },
  {
    icon: ShieldCheck,
    title: "PAGAMENTO ANÔNIMO",
    desc: "Pix, Bitcoin (on-chain & Lightning) ou link anônimo. Sem KYC, sem cadastro bancário.",
  },
];

const steps = [
  { step: 1, label: "Escolhe", desc: "Escolha seus itens no sigilo." },
  { step: 2, label: "Paga", desc: "Pague sem deixar rastros." },
  { step: 3, label: "Recebe", desc: "Receba com total discrição." },
];

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      {/* HERO */}
      <section className="py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-primary drop-shadow">
            Sem censura. Sem rastros. 100% Discreto.
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            Acesso ao estoque restrito. Pagamento anônimo e entrega sigilosa.
          </p>
        </motion.div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
          {sections.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-primary/20 bg-card p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <s.icon size={28} className="text-primary" weight="duotone" />
              </div>
              <h3 className="font-bold text-primary mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 px-6 bg-card">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight mb-10">Como funciona</h2>
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {steps.map((s) => (
              <div key={s.step} className="flex-1">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {s.step}
                </div>
                <h3 className="font-semibold text-primary mb-1">{s.label}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Garanta seu estoque agora.</h2>
        <p className="text-muted-foreground mb-6">Tudo pronto para envio. Sigilo total. Sem perguntas.</p>
        <Link to="/produtos">
          <Button variant="hero" className="gap-2">
            Ver estoque secreto <ArrowRight size={18} />
          </Button>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-primary/20 py-6 text-center text-xs text-muted-foreground">
        Embalagem neutra. Sem rastros.
      </footer>
    </div>
  );
}
