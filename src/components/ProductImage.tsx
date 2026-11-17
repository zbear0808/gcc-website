import { useEffect, useState } from 'react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

export default function ProductImage({ src, alt, className = '', eager = false }: ProductImageProps) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (failed) {
    return (
      <div className={`product-image placeholder ${className}`} role="img" aria-label={alt}>
        <span className="placeholder-label">{alt}</span>
        <span className="placeholder-note">Photo coming soon</span>
      </div>
    );
  }

  return (
    <img
      className={`product-image ${className}`}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
