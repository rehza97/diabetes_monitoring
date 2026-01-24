import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";

const testimonials = [
  {
    name: "Dr. Ahmed Benali",
    role: "Médecin endocrinologue",
    content:
      "Ce système a transformé notre façon de suivre les patients diabétiques. C'est rapide, efficace et très intuitif. L'interface est claire et les rapports sont détaillés.",
    rating: 5,
  },
  {
    name: "Fatima Khelifi",
    role: "Infirmière en chef",
    content:
      "L'application pour infirmières est parfaite. Je peux enregistrer les mesures en quelques secondes, même pour plusieurs patients à la suite. Un vrai gain de temps !",
    rating: 5,
  },
  {
    name: "Mohamed Tounsi",
    role: "Directeur médical",
    content:
      "Le tableau de bord administratif nous donne une vue complète de tous nos patients. Les rapports sont excellents et nous permettent de prendre des décisions éclairées.",
    rating: 5,
  },
  {
    name: "Dr. Sarah Amrani",
    role: "Médecin généraliste",
    content:
      "La facilité d'utilisation de cette plateforme est remarquable. Mes patients sont mieux suivis et je peux rapidement identifier les cas qui nécessitent une attention particulière.",
    rating: 5,
  },
  {
    name: "Karim Bensaid",
    role: "Infirmier",
    content:
      "L'application mobile est très pratique. Je peux enregistrer les mesures directement sur le terrain, même sans connexion internet. La synchronisation se fait automatiquement ensuite.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-[#f8f9fa] py-20">
      <div className="container px-6">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Témoignages</h2>
          <p className="text-muted-foreground">
            Découvrez ce que nos utilisateurs disent de notre système.
          </p>
        </div>
        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
