import { useEffect, useState } from 'react';
import { getInitials, getName } from './Orders.helpers';

export default function UserAvatar({ person, className }) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = person?.avatarUrl;

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  return (
    <div className={className}>
      {avatarUrl && !imageFailed ? (
        <img
          src={avatarUrl}
          alt={`Foto de ${getName(person)}`}
          onError={() => setImageFailed(true)}
        />
      ) : getInitials(person)}
    </div>
  );
}
