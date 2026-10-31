import type { LucideIcon } from 'lucide-react';

type AdminMetricCardProps = {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone: 'terracotta' | 'blue' | 'green' | 'violet';
};

export default function AdminMetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: AdminMetricCardProps) {
  return (
    <article className="adminMetricCard">
      <div className={`adminMetricIcon tone-${tone}`} aria-hidden="true">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <p className="adminMetricLabel">{label}</p>
      <p className="adminMetricValue">{value.toLocaleString('es-AR')}</p>
      <p className="adminMetricDescription">{description}</p>
    </article>
  );
}
