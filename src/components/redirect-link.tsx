'use client';

import Link from 'next/link';

interface RedirectLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function RedirectLink({ href, children, className }: Readonly<RedirectLinkProps>) {
  return (
    <Link
      href={href}
      className={className}
      onClick={event => {
        event.preventDefault();
        globalThis.location.href = href;
      }}
    >
      {children}
    </Link>
  );
}
