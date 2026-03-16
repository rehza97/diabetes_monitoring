import { Users, UserCircle, Activity, Heart } from "lucide-react";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";

const stats = [
  {
    label: "Utilisateurs actifs",
    value: 150,
    suffix: "+",
    icon: Users,
  },
  {
    label: "Patients suivis",
    value: 500,
    suffix: "+",
    icon: UserCircle,
  },
  {
    label: "Mesures enregistrées",
    value: 10000,
    suffix: "+",
    icon: Activity,
  },
  {
    label: "Taux de satisfaction",
    value: 98,
    suffix: "%",
    icon: Heart,
  },
];

export function StatisticsSection() {
  return (
    <section className="bg-[#f8f9fa] py-20">
      <div className="container px-6 mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <AnimatedCounter
              key={index}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              icon={stat.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
