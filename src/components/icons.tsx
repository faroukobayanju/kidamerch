type IconProps = { size?: number; className?: string };

/** TikTok glyph (single path, inherits currentColor). */
export function TikTokIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.02-2.82h-3.09v11.6a2.59 2.59 0 1 1-1.85-2.48V8.96a5.68 5.68 0 1 0 4.94 5.64V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.28-1.48z" />
    </svg>
  );
}

/** WhatsApp glyph (single path, inherits currentColor). */
export function WhatsAppIcon({ size = 16, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.83c0 1.94.56 3.75 1.53 5.28L2 22l5.03-1.68a9.82 9.82 0 0 0 5.01 1.36h.01c5.43 0 9.83-4.4 9.83-9.83A9.78 9.78 0 0 0 19 4.86A9.78 9.78 0 0 0 12.04 2zm0 1.66c2.18 0 4.23.85 5.77 2.4a8.12 8.12 0 0 1 2.4 5.78c0 4.51-3.67 8.17-8.18 8.17a8.16 8.16 0 0 1-4.16-1.14l-.3-.18l-3.08 1.03l1.05-3l-.19-.31a8.11 8.11 0 0 1-1.25-4.35c0-4.51 3.67-8.2 8.18-8.2zM8.53 7.1c-.17 0-.44.06-.67.31c-.23.25-.88.86-.88 2.1c0 1.24.9 2.44 1.03 2.6c.13.17 1.75 2.8 4.24 3.81c2.07.84 2.49.67 2.94.63c.45-.04 1.45-.6 1.66-1.17c.2-.58.2-1.07.14-1.17c-.06-.1-.23-.17-.48-.29c-.25-.13-1.45-.72-1.68-.8c-.23-.09-.39-.13-.56.12c-.17.25-.65.83-.8 1c-.14.17-.29.19-.54.06c-.25-.12-1.06-.39-2.02-1.25c-.75-.66-1.25-1.48-1.4-1.73c-.14-.25-.01-.39.11-.51c.11-.11.25-.29.37-.44c.13-.14.17-.25.25-.41c.08-.17.04-.31-.02-.44c-.06-.12-.55-1.36-.76-1.86c-.17-.4-.34-.4-.5-.41h-.43z" />
    </svg>
  );
}
