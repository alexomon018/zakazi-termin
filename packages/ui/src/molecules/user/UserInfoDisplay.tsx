interface UserInfoDisplayProps {
  name: string;
  email?: string;
  subtitle?: string;
}

export function UserInfoDisplay({ name, email, subtitle }: UserInfoDisplayProps) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{name}</p>
      {(email || subtitle) && <p className="text-xs text-muted-foreground">{email || subtitle}</p>}
    </div>
  );
}
