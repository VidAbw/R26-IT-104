import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for Expo Router.
 */
export default function RootLayoutHTML({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Title & Favicon */}
        <title>Protectiva | Child Protection & Guardian Support</title>
        <link rel="icon" type="image/png" href="/assets/images/pacifier.png" />
        <link rel="shortcut icon" href="/assets/images/pacifier.png" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling may be useful if you have a non-responsive layout.
        */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackgroundStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackgroundStyles = `
body {
  background-color: #F8FAFC;
}
`;
