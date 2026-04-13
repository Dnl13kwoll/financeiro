'use client'
import { useEffect } from 'react'

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var t = localStorage.getItem('theme') || 'green';
              document.documentElement.setAttribute('data-theme', t);
              var h = localStorage.getItem('hideValues') === 'true';
              if (h) document.body && document.body.setAttribute('data-hide-values', '1');
            } catch(e) {}
          })();
        `,
      }}
    />
  )
}

export type Theme = 'green' | 'pink' | 'blue' | 'dark'

export function useTheme() {
  function setTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
  function getTheme(): Theme {
    return (localStorage.getItem('theme') as Theme) || 'green'
  }
  return { setTheme, getTheme }
}
