import { MarbleAvatar, type MarbleAvatarProps } from './marble-avatar';

import { cn } from '@/lib/utils';

type UserAvatarProps = Omit<MarbleAvatarProps, 'name'> & {
  name: string;
  imageUrl?: string | null;
  avatarSeed?: string;
};

export function UserAvatar({
  name,
  imageUrl,
  avatarSeed,
  size,
  className,
  ...props
}: UserAvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
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
