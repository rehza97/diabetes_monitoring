import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle, Shield, DollarSign, Clock, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    id: "platforms",
    icon: HelpCircle,
    question: "Quelles plateformes sont supportées ?",
    answer:
      "Actuellement, nous supportons Android pour les applications mobiles (app médecins et app infirmières). Le tableau de bord administratif est accessible via n'importe quel navigateur web moderne (Chrome, Firefox, Safari, Edge). Une version iOS est disponible en option pour les applications mobiles.",
  },
  {
    id: "security",
    icon: Shield,
    question: "Les données sont-elles sécurisées ?",
    answer:
      "Oui, toutes les données sont chiffrées en transit (HTTPS/TLS) et au repos. Nous respectons strictement les normes de confidentialité médicale (HIPAA, GDPR). Les accès sont contrôlés par un système de permissions multi-niveaux, et toutes les actions sont enregistrées dans un journal d'audit.",
  },
  {
    id: "pricing",
    icon: DollarSign,
    question: "Comment fonctionne la tarification ?",
    answer:
      "Nous proposons plusieurs plans selon vos besoins : Basique pour les petites cliniques, Professionnel pour les hôpitaux moyens, et Entreprise pour les grands hôpitaux avec des solutions sur mesure. Contactez-nous pour un devis personnalisé adapté à votre établissement.",
  },
  {
    id: "trial",
    icon: Clock,
    question: "Y a-t-il une période d'essai ?",
    answer:
      "Oui, nous offrons une période d'essai gratuite de 30 jours pour vous permettre de tester toutes les fonctionnalités sans engagement. Vous aurez accès à toutes les fonctionnalités du plan Professionnel pendant cette période.",
  },
  {
    id: "integration",
    icon: Plug,
    question: "Peut-on s'intégrer avec d'autres systèmes ?",
    answer:
      "Oui, nous proposons une API REST complète pour l'intégration avec d'autres systèmes hospitaliers (Systèmes d'Information Hospitaliers, Laboratoires, etc.). Nous pouvons également développer des intégrations personnalisées selon vos besoins spécifiques. Contactez-nous pour discuter de vos besoins d'intégration.",
  },
];

export function FAQSection() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <section id="faq" className="py-20 bg-[#f8f9fa]">
      <div className="container px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Questions fréquemment posées
            </h2>
            <p className="text-muted-foreground">
              Trouvez des réponses aux questions les plus courantes.
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher dans la FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Rechercher dans les questions fréquemment posées"
              />
            </div>
          </div>

          {/* FAQ List */}
          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {filteredFaqs.map((faq) => {
                const Icon = faq.icon;
                return (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-medium">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucune question ne correspond à votre recherche.</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-primary hover:underline"
              >
                Réinitialiser la recherche
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
