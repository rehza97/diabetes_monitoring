import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Book, HelpCircle, Mail, FileText, Video, MessageSquare, ExternalLink } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

// Logging utility
const logError = (context: string, error: unknown, details?: Record<string, unknown>) => {
  console.error(`[SupportPage] Error in ${context}:`, error, details);
};

const logWarning = (context: string, message: string, details?: Record<string, unknown>) => {
  console.warn(`[SupportPage] Warning in ${context}:`, message, details);
};

const logInfo = (context: string, message: string, details?: Record<string, unknown>) => {
  console.log(`[SupportPage] Info in ${context}:`, message, details);
};

const faqItems = [
  {
    question: "Comment ajouter un nouveau patient ?",
    answer:
      "Allez dans la section 'Gestion des patients', cliquez sur 'Ajouter un patient' et remplissez le formulaire en plusieurs étapes.",
  },
  {
    question: "Comment exporter un rapport ?",
    answer:
      "Dans la section 'Rapports', choisissez un rapport prédéfini ou créez-en un personnalisé, puis cliquez sur 'Export PDF', 'Export Excel' ou 'Export CSV'.",
  },
  {
    question: "Comment modifier les plages normales des mesures ?",
    answer:
      "Allez dans 'Paramètres' > 'Mesures' et modifiez les valeurs minimales et maximales pour chaque catégorie (Normal, Avertissement, Critique).",
  },
  {
    question: "Comment gérer les utilisateurs ?",
    answer:
      "Dans la section 'Gestion des utilisateurs', vous pouvez ajouter, modifier, activer ou désactiver des utilisateurs (médecins, infirmières, administrateurs).",
  },
];

const videoTutorials = [
  { id: "1", title: "Introduction au système", duration: "5:30" },
  { id: "2", title: "Gestion des patients", duration: "8:15" },
  { id: "3", title: "Enregistrement des mesures", duration: "4:20" },
  { id: "4", title: "Génération de rapports", duration: "6:45" },
];

export function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { addNotification } = useNotification();

  // Component lifecycle logging
  useEffect(() => {
    logInfo("componentMount", "SupportPage mounted");
    return () => {
      logInfo("componentUnmount", "SupportPage unmounting");
    };
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      logInfo("contactSubmit", "Submitting contact form", { subject });
      // TODO: Appel API
      // This would require:
      // 1. Backend API endpoint for support tickets
      // 2. Email service integration
      // 3. Ticket tracking system
      await new Promise((resolve) => setTimeout(resolve, 1000));
      logWarning("contactSubmit", "Contact form submission not yet implemented - API call needed");
      logInfo("contactSubmit", "Contact form submitted successfully (simulated)", { subject });

      addNotification({
        type: "success",
        title: "Message envoyé",
        message: "Votre demande a été envoyée au support technique. Nous vous répondrons dans les plus brefs délais.",
      });

      setSubject("");
      setMessage("");
    } catch (error) {
      logError("contactSubmit", error, { subject });
      addNotification({
        type: "error",
        title: "Erreur",
        message: `Impossible d'envoyer le message: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support et aide</h1>
          <p className="text-muted-foreground mt-1">
            Trouvez de l'aide, consultez la documentation et contactez le support technique
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-primary" />
                Guide utilisateur
              </CardTitle>
              <CardDescription>
                Documentation complète du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                Consultez notre guide complet pour apprendre à utiliser toutes les fonctionnalités du système.
              </p>
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir le guide
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                FAQ
              </CardTitle>
              <CardDescription>
                Réponses aux questions fréquentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-sm">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Vidéos tutoriels
              </CardTitle>
              <CardDescription>
                Tutoriels vidéo pour apprendre rapidement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {videoTutorials.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{video.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{video.duration}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Voir tous les tutoriels
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact support technique
              </CardTitle>
              <CardDescription>
                Envoyez-nous un message pour toute question ou problème
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input
                    id="subject"
                    placeholder="Sujet de votre demande"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre problème ou votre question en détail..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Envoyer
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Soumettre une suggestion
            </CardTitle>
            <CardDescription>
              Partagez vos idées pour améliorer le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="suggestion">Votre suggestion</Label>
                <Textarea
                  id="suggestion"
                  placeholder="Décrivez votre suggestion ou idée d'amélioration..."
                  rows={4}
                />
              </div>
              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Soumettre la suggestion
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
