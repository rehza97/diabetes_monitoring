import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useNotification } from "@/context/NotificationContext";
import { emailSchema } from "@/utils/validators";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { addNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      emailSchema.parse(email);
      setIsLoading(true);

      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      addNotification({
        type: "success",
        title: "Inscription réussie",
        message: "Vous recevrez désormais notre newsletter.",
      });

      setEmail("");
    } catch (error: any) {
      setError(error.message || "Email invalide");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        placeholder="Votre email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
        required
        disabled={isLoading}
        className="flex-1"
        aria-label="Email pour newsletter"
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? "newsletter-error" : undefined}
      />
      <Button type="submit" disabled={isLoading} aria-label="S'abonner à la newsletter">
        {isLoading ? <LoadingSpinner size="sm" /> : "S'abonner"}
      </Button>
      {error && (
        <p id="newsletter-error" className="text-sm text-destructive mt-1" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
