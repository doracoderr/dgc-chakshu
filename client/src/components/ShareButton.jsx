import { useState } from 'react';
import { FaShareAlt, FaCheck } from 'react-icons/fa';

export default function ShareButton({ title }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy-link
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — nothing more we can do silently
    }
  };

  return (
    <button type="button" className="btn-secondary share-btn" onClick={handleShare}>
      {copied ? <FaCheck /> : <FaShareAlt />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}
