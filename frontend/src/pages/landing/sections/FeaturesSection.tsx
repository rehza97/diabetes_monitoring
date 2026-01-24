import { Smartphone, BarChart3, Shield, Zap, Bell, Database } from "lucide-react";
import { FeatureCard } from "@/components/landing/FeatureCard";

const features = [
  {
    icon: Smartphone,
    title: "Applications mobiles faciles à utiliser",
    description:
      "Téléchargez nos applications dédiées pour médecins et infirmières. Interfaces intuitives et rapides conçues pour une utilisation optimale sur mobile Android.",
  },
  {
    icon: BarChart3,
    title: "Analyses et rapports complets",
    description:
      "Graphiques interactifs pour visualiser les tendances, rapports personnalisables selon vos besoins, et export dans plusieurs formats (PDF, Excel, CSV).",
  },
  {
    icon: Shield,
    title: "Sécurité et confidentialité",
    description:
      "Chiffrement des données en transit et au repos, permissions multi-niveaux (Admin, Médecin, Infirmière), et conformité aux normes médicales (HIPAA, GDPR).",
  },
  {
    icon: Zap,
    title: "Rapidité et efficacité",
    description:
      "Enregistrement des mesures en quelques secondes, synchronisation instantanée entre appareils, et haute performance pour gérer des centaines de patients.",
  },
  {
    icon: Bell,
    title: "Notifications intelligentes",
    description:
      "Alertes automatiques pour cas critiques (mesures hors norme), rappels pour les mesures programmées, et notifications personnalisées selon vos préférences.",
  },
  {
    icon: Database,
    title: "Stockage sécurisé des données",
    description:
      "Sauvegarde automatique quotidienne, restauration facile en cas de besoin, et stockage cloud sécurisé avec accès depuis n'importe où.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="container px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Fonctionnalités principales</h2>
          <p className="text-muted-foreground">
            Tout ce dont vous avez besoin pour gérer efficacement vos patients diabétiques.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
