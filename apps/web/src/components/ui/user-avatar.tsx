import { MarbleAvatar, type MarbleAvatarProps } from './marble-avatar';
import { cn } from '@/lib/utils';

export interface UserAvatarProps extends Omit<MarbleAvatarProps, 'name'> {
  name: string;
  imageUrl?: string | null;
  avatarSeed?: string;
}

export function UserAvatar({
  name,
  imageUrl,
  avatarSeed,
  size = 32,
  className,
  ...props
}: UserAvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <MarbleAvatar
      name={avatarSeed ?? name}
      size={size}
      className={className}
      {...props}
    />
  );
}
