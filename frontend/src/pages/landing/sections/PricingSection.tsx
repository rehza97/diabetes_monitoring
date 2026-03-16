import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingCard } from "@/components/landing/PricingCard";

const plans = [
  {
    name: "Basique",
    description: "Pour les petites cliniques",
    price: "0",
    period: "mois",
    features: [
      "Jusqu'à 50 patients",
      "5 utilisateurs maximum",
      "Rapports de base (PDF, Excel)",
      "Support par email",
      "10 GB d'espace de stockage",
      "Mises à jour incluses",
    ],
  },
  {
    name: "Professionnel",
    description: "Pour les hôpitaux moyens",
    price: "0",
    period: "mois",
    features: [
      "Jusqu'à 500 patients",
      "50 utilisateurs maximum",
      "Rapports avancés avec graphiques",
      "Support prioritaire (réponse sous 4h)",
      "Formation incluse (2 sessions)",
      "100 GB d'espace de stockage",
      "API d'intégration",
      "Mises à jour prioritaires",
    ],
  },
  {
    name: "Entreprise",
    description: "Pour les grands hôpitaux",
    price: "Sur mesure",
    period: "",
    features: [
      "Patients illimités",
      "Utilisateurs illimités",
      "Rapports personnalisés sur mesure",
      "Support 24/7 avec hotline dédiée",
      "Formation et intégration complètes",
      "API personnalisée",
      "Stockage illimité",
      "Déploiement sur serveur dédié",
      "Gestionnaire de compte dédié",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20">
      <div className="container px-6 mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Tarification</h2>
          <p className="text-muted-foreground">
            Choisissez le plan qui correspond à vos besoins.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <PricingCard key={index} {...plan} featured={index === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
