import { cn } from '@/lib/utils';

interface TutorCardProps {
  name: string;
  title: string;
  subject: string;
  avatar: string;
  gradientFrom: string;
  gradientTo: string;
  isSelected?: boolean;
  onClick: () => void;
}

export const TutorCard = ({
  name,
  title,
  subject,
  avatar,
  gradientFrom,
  gradientTo,
  isSelected,
  onClick
}: TutorCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group p-4 rounded-2xl border-2 transition-all duration-300",
        "hover:scale-105 hover:shadow-xl",
        "flex flex-col items-center gap-3 min-w-[140px]",
        isSelected
          ? "border-primary bg-primary/10 shadow-lg"
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      {/* Avatar with gradient background */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
        }}
      >
        {avatar}
      </div>
      
      {/* Name and title */}
      <div className="text-center">
        <h3 className="font-bold text-foreground text-sm">{name}</h3>
        <p className="text-xs text-muted-foreground">{title}</p>
        <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
          {subject}
        </span>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
};
