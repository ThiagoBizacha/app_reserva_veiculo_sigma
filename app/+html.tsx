import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Customiza o documento HTML gerado pelo Expo Router para web.
 * Injeta as meta tags e link de manifest necessários para a PWA.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>Sigma Reserva</title>
        <meta name="description" content="Sistema de reserva de veículos da Sigma Lithium" />
        <meta name="theme-color" content="#173D13" />

        {/* PWA manifest — habilita "Adicionar à tela inicial" no Android/iOS */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS PWA — Safari não usa manifest.json para algumas configurações */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sigma" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        {/* Carrega a fonte dos ícones Feather via CSS para garantir renderização no web */}
        <style>{`
          @font-face {
            font-family: 'Feather';
            src: url('/fonts/Feather.ttf') format('truetype');
            font-display: block;
          }
        `}</style>

        {/* Reset de estilos do Expo para evitar scroll indesejado no navegador */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
