import type { Preview } from '@storybook/nextjs-vite';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) => {
      // Material Icons + Cinzel + Noto Sans JP
      if (typeof document !== 'undefined') {
        const id = 'storybook-google-fonts';
        if (!document.getElementById(id)) {
          const link = document.createElement('link');
          link.id = id;
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Noto+Sans+JP:wght@400;500;700&display=swap';
          document.head.appendChild(link);

          const iconLink = document.createElement('link');
          iconLink.id = 'storybook-material-icons';
          iconLink.rel = 'stylesheet';
          iconLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
          document.head.appendChild(iconLink);
        }
        document.body.style.setProperty('--font-display', "'Cinzel', serif");
        document.body.style.setProperty('--font-body', "'Noto Sans JP', sans-serif");
        document.body.className = 'min-h-screen antialiased bg-game';
        document.body.style.fontFamily = "var(--font-body)";
      }
      return Story();
    },
  ],
};

export default preview;
