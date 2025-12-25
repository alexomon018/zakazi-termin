import { User } from "lucide-react";
import * as React from "react";

interface UserAvatarProps {
  name?: string;
  image?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const iconSizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-6 h-6",
};

export function UserAvatar({ name, image, size = "md" }: UserAvatarProps) {
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}
    >
      {image ? (
        <img src={image} alt={name || "User"} className="w-full h-full rounded-full object-cover" />
      ) : (
        <User className={`${iconSizeClasses[size]} text-gray-500 dark:text-gray-400`} />
      )}
    </div>
  );
}
