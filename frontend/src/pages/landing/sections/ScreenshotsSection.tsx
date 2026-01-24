import { ScreenshotCarousel } from "@/components/landing/ScreenshotCarousel";

const screenshots = [
  {
    src: "/screenshots/doctor-app.jpg",
    alt: "Application pour médecins",
    type: "android" as const,
    title: "Application Médecins",
  },
  {
    src: "/screenshots/nurse-app.jpg",
    alt: "Application pour infirmières",
    type: "android" as const,
    title: "Application Infirmières",
  },
  {
    src: "/screenshots/dashboard.jpg",
    alt: "Tableau de bord administratif",
    type: "desktop" as const,
    title: "Tableau de bord",
  },
];

export function ScreenshotsSection() {
  return (
    <section id="screenshots" className="py-20 bg-white">
      <div className="container px-6">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Aperçu de l'application</h2>
          <p className="text-muted-foreground">
            Découvrez les interfaces de nos applications pour médecins, infirmières et le tableau
            de bord administratif. Cliquez sur une image pour l'agrandir.
          </p>
        </div>
        <ScreenshotCarousel screenshots={screenshots} />
      </div>
    </section>
  );
}
