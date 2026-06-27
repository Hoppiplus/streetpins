'use client';
import Script from 'next/script';

export default function KofiWidget() {
  return (
    <Script
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
      strategy="lazyOnload"
      onLoad={() => {
        (window as any).kofiWidgetOverlay?.draw('chichihere', {
          type: 'floating-chat',
          'floating-chat.donateButton.text': 'Support StreetPins',
          'floating-chat.donateButton.background-color': '#7c6aff',
          'floating-chat.donateButton.text-color': '#fff',
        });
      }}
    />
  );
}