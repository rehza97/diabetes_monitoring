import { TimelineItem } from "@/components/landing/TimelineItem";

const steps = [
  {
    title: "Inscription et configuration",
    items: [
      "Créer un compte administrateur",
      "Ajouter les utilisateurs (médecins et infirmières)",
      "Personnaliser les paramètres du système",
    ],
  },
  {
    title: "Ajouter des patients",
    items: [
      "Saisir les données de base des patients",
      "Assigner un médecin et une infirmière responsable",
    ],
  },
  {
    title: "Commencer le suivi",
    items: [
      "Enregistrement rapide et facile des mesures",
      "Ajouter des notes et observations",
      "Synchronisation instantanée entre appareils",
    ],
  },
  {
    title: "Analyse et suivi",
    items: [
      "Afficher les graphiques et tendances",
      "Suivre les progrès des patients",
      "Prendre des décisions éclairées",
    ],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[#f8f9fa] py-20">
      <div className="container px-6 mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Comment ça fonctionne</h2>
          <p className="text-muted-foreground">
            Quatre étapes simples pour commencer à améliorer les soins de vos patients.
          </p>
        </div>

        {/* Desktop: Timeline verticale */}
        <div className="hidden lg:block max-w-4xl mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <TimelineItem
                key={index}
                index={index}
                title={step.title}
                items={step.items}
                isLast={index === steps.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Mobile/Tablet: Grid layout */}
        <div className="lg:hidden grid gap-8 md:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className="rounded-lg bg-background p-6 shadow-sm border border-border"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                {index + 1}
              </div>
              <h3 className="mb-4 text-xl font-semibold">{step.title}</h3>
              <ul className="space-y-2">
                {step.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
