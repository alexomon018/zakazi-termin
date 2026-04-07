interface UserInfoDisplayProps {
  name: string;
  email?: string;
  subtitle?: string;
}

export function UserInfoDisplay({ name, email, subtitle }: UserInfoDisplayProps) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{name}</p>
      {(subtitle || email) && <p className="text-xs text-muted-foreground">{subtitle || email}</p>}
    </div>
  );
}
