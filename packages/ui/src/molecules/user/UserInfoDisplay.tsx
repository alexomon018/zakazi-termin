
interface UserInfoDisplayProps {
  name: string;
  email?: string;
  subtitle?: string;
}

export function UserInfoDisplay({ name, email, subtitle }: UserInfoDisplayProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
      {(email || subtitle) && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{email || subtitle}</p>
      )}
    </div>
  );
}
