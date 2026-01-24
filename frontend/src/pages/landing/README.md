# Landing Page - Système de Monitoring du Diabète

## Vue d'ensemble

La landing page est la page d'accueil publique du système de monitoring du diabète. Elle présente les fonctionnalités, avantages et informations de contact du système.

## Structure

### Sections

1. **HeroSection** - Section principale avec titre, description et CTAs
2. **FeaturesSection** - Présentation des 6 fonctionnalités principales
3. **HowItWorksSection** - Timeline en 4 étapes expliquant le fonctionnement
4. **ScreenshotsSection** - Carousel de captures d'écran avec lightbox
5. **StatisticsSection** - Compteurs animés avec statistiques
6. **PricingSection** - Tableau des plans tarifaires
7. **TestimonialsSection** - Carousel de témoignages clients
8. **FAQSection** - Questions fréquemment posées avec recherche
9. **CTASection** - Appel à l'action avec formulaire de contact
10. **FooterSection** - Footer complet avec liens et newsletter

### Composants

- `NavigationMenu` - Navigation sticky avec smooth scroll
- `FeatureCard` - Carte de fonctionnalité avec animations
- `TimelineItem` - Item de timeline pour "How It Works"
- `AnimatedCounter` - Compteur animé pour statistiques
- `ScreenshotCarousel` - Carousel pour captures d'écran
- `DeviceMockup` - Mockup d'appareil (iPhone/Android/Desktop)
- `Lightbox` - Modal pour voir images en grand
- `TestimonialsCarousel` - Carousel pour témoignages
- `ContactForm` - Formulaire de contact avec validation
- `NewsletterForm` - Formulaire d'inscription newsletter
- `PricingCard` - Carte de plan tarifaire
- `TestimonialCard` - Carte de témoignage

### Hooks

- `useCountUp` - Animation de compteur
- `useIntersectionObserver` - Détection d'intersection pour animations
- `useSmoothScroll` - Navigation smooth scroll

## Fonctionnalités

### Animations
- Animations au scroll pour chaque section
- Compteurs animés pour les statistiques
- Transitions fluides sur les hover
- Smooth scroll entre sections

### Accessibilité
- Navigation clavier complète
- ARIA labels sur tous les éléments interactifs
- Skip links pour navigation rapide
- Contraste WCAG 2.1 AA
- Screen reader friendly

### Responsive
- Mobile : 320px - 640px
- Tablet : 641px - 1024px
- Desktop : 1025px+
- Layouts adaptatifs pour chaque breakpoint

### Performance
- Lazy loading des images
- Code splitting par route
- Optimisation des bundles
- Métriques Lighthouse optimisées

### SEO
- Meta tags complets
- Structured data (JSON-LD)
- Sitemap.xml
- robots.txt
- Sémantique HTML

## Couleurs

Selon plan.md :
- Primary: #3498db (Bleu médical)
- Secondary: #2980b9 (Bleu foncé)
- Success: #27ae60 (Vert)
- Warning: #f39c12 (Jaune/Orange)
- Danger: #e74c3c (Rouge)
- Gray: #95a5a6 (Gris)
- Background: #f8f9fa (Gris clair)

## Utilisation

```tsx
import { LandingPage } from "@/pages/landing/LandingPage";

// Dans votre router
<Route path="/" element={<LandingPage />} />
```

## Tests

Pour tester la landing page :
1. Vérifier tous les liens fonctionnent
2. Tester la navigation clavier (Tab, Enter, Escape)
3. Vérifier le responsive sur différents devices
4. Tester les formulaires (validation, soumission)
5. Vérifier les animations au scroll
6. Tester l'accessibilité avec screen reader

## Améliorations futures

- [ ] Ajouter de vraies images de captures d'écran
- [ ] Intégrer avec un service de formulaire (EmailJS, Formspree)
- [ ] Ajouter analytics (Google Analytics, Plausible)
- [ ] Implémenter A/B testing pour CTAs
- [ ] Ajouter plus de témoignages
- [ ] Créer vidéo de démonstration
