import { useState, useEffect } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { createUserSchema } from "@/utils/validators";
import { z } from "zod";
import { Upload, X } from "lucide-react";
import { getInitials } from "@/utils/helpers";
import { cn } from "@/lib/utils";

type UserFormData = z.infer<typeof createUserSchema> & {
  password?: string;
  confirmPassword?: string;
};

interface UserFormProps {
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: "admin" | "doctor" | "nurse";
    specialization?: string;
    license_number?: string;
    is_active: boolean;
    avatar?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
}

export function UserForm({ user, isOpen, onClose, onSubmit }: UserFormProps) {
  const isEdit = !!user;
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(
      createUserSchema.extend({
        password: isEdit
          ? z.string().optional()
          : z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
        confirmPassword: z.string().optional(),
      }).refine((data) => !data.password || data.password === data.confirmPassword, {
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"],
      })
    ) as Resolver<UserFormData>,
    defaultValues: user
      ? {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          specialization: user.specialization || "",
          license_number: user.license_number || "",
          is_active: user.is_active,
        }
      : {
          is_active: true,
        },
  });

  const role = watch("role");

  useEffect(() => {
    if (isOpen) {
      // Log the user data received by the form
      if (user) {
        console.group("📝 [UserForm] User data received and form initialization");
        console.log("User prop received:", user);
        console.log("  phone:", user.phone, "(type:", typeof user.phone, ", value:", JSON.stringify(user.phone), ")");
        console.log("  license_number:", user.license_number, "(type:", typeof user.license_number, ", value:", JSON.stringify(user.license_number), ")");
        console.log("  specialization:", user.specialization, "(type:", typeof user.specialization, ", value:", JSON.stringify(user.specialization), ")");
        
        const formData = {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          specialization: user.specialization || "",
          license_number: user.license_number || "",
          is_active: user.is_active,
        };
        
        console.log("Form data being set to react-hook-form:");
        console.table(formData);
        console.log("Full formData object:", formData);
        console.groupEnd();
        
        reset(formData);
      } else {
        console.log("[UserForm] No user prop - creating new user");
        reset({ is_active: true });
      }
      
      setAvatarPreview(user?.avatar || null);
    }
  }, [isOpen, user, reset]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFormSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
      onClose();
      reset();
      setAvatarPreview(null);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations de l'utilisateur."
              : "Remplissez le formulaire pour ajouter un nouvel utilisateur."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit as SubmitHandler<UserFormData>)} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback>
                {watch("first_name") && watch("last_name")
                  ? getInitials(watch("first_name"), watch("last_name"))
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar">Photo de profil</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("avatar")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choisir une photo
                </Button>
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvatarPreview(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                Prénom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                {...register("first_name")}
                aria-invalid={errors.first_name ? "true" : "false"}
              />
              {errors.first_name && (
                <p className="text-sm text-destructive">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                {...register("last_name")}
                aria-invalid={errors.last_name ? "true" : "false"}
              />
              {errors.last_name && (
                <p className="text-sm text-destructive">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Rôle <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("role") || ""}
              onValueChange={(value) => setValue("role", value as "admin" | "doctor" | "nurse")}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="doctor">Médecin</SelectItem>
                <SelectItem value="nurse">Infirmière</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {(role === "doctor" || role === "nurse") && (
            <>
              {role === "doctor" && (
                <div className="space-y-2">
                  <Label htmlFor="specialization">Spécialisation</Label>
                  <Input id="specialization" {...register("specialization")} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="license_number">Numéro de licence</Label>
                <Input id="license_number" {...register("license_number")} />
              </div>
            </>
          )}

          {!isEdit && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Mot de passe <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked as boolean)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Utilisateur actif
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isEdit ? "Modification..." : "Création..."}
                </>
              ) : (
                isEdit ? "Modifier" : "Créer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
