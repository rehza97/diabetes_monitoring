import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Mail, Smartphone, Download } from "lucide-react";
import { ContactForm } from "@/components/landing/ContactForm";

/** Direct download URL for the mobile APK (GitHub raw so scan/click triggers download) */
const APP_APK_DOWNLOAD_URL =
  "https://raw.githubusercontent.com/rehza97/diabetes_monitoring/main/mobile/release/app-release.apk";

export function CTASection() {
  return (
    <section id="cta" className="relative overflow-hidden bg-gradient-to-br from-primary to-secondary py-20 text-primary-foreground">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-6 relative z-10 space-y-16">
        {/* App download: QR code + direct download button */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <Smartphone className="h-6 w-6" aria-hidden />
            <h3 className="text-2xl font-semibold">
              Téléchargez l'application mobile
            </h3>
          </div>
          <p className="text-sm opacity-90 max-w-md">
            Scannez le QR code avec votre téléphone ou cliquez pour télécharger l'APK directement.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <QRCodeSVG
                value={APP_APK_DOWNLOAD_URL}
                size={160}
                level="M"
                includeMargin
                title="QR code pour télécharger l'application mobile"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                variant="secondary"
                className="group"
                asChild
              >
                <a
                  href={APP_APK_DOWNLOAD_URL}
                  download="app-release.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger l'APK
                </a>
              </Button>
              <span className="text-xs opacity-80">
                Android · Téléchargement direct
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left column - Text and CTAs */}
          <div className="text-center lg:text-left space-y-6">
            <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">
              Commencez à améliorer les soins de vos patients aujourd'hui
            </h2>
            <p className="text-lg opacity-90 max-w-xl mx-auto lg:mx-0">
              Rejoignez les professionnels de santé qui font confiance à notre système pour gérer
              leurs patients diabétiques efficacement et en toute sécurité.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" variant="secondary" asChild className="group">
                <Link to="/login">
                  Commencer l'essai gratuit
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
                onClick={(e) => {
                  e.preventDefault();
                  const form = document.getElementById("contact-form");
                  if (form) {
                    form.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
              >
                Demander une démo
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/20">
              <a
                href="tel:+213775032800"
                className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100 transition-opacity"
              >
                <Phone className="h-4 w-4" />
                <span>0775032800</span>
              </a>
              <a
                href="mailto:contact@example.com"
                className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100 transition-opacity"
              >
                <Mail className="h-4 w-4" />
                <span>contact@example.com</span>
              </a>
            </div>
          </div>

          {/* Right column - Contact Form */}
          <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 lg:p-8">
            <h3 className="text-2xl font-semibold mb-4 text-center lg:text-left">
              Contactez-nous
            </h3>
            <div id="contact-form">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
