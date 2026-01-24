export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:z-[100] focus-within:top-4 focus-within:left-4">
      <a
        href="#main-content"
        className="block px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Aller au contenu principal
      </a>
    </div>
  );
}
