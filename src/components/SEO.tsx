import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ENV } from '../lib/config';

type SEOProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  schema?: Record<string, unknown> | null;
};

const defaultTitle = 'Harmonie Cils — Extensions de cils et épilation au fil';
const defaultDescription =
  "Institut de beauté spécialisé dans les extensions de cils, épilation au fil et soins haut de gamme. Réservez en ligne.";

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  path = '/',
  image = '/favicon.svg',
  noIndex = false,
  schema,
}) => {
  const pageTitle = title ? `${title} | Harmonie Cils` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const canonical = new URL(path, ENV.PUBLIC_SITE_URL).toString();
  const img = image.startsWith('http') ? image : new URL(image, ENV.PUBLIC_SITE_URL).toString();

  return (
    <Helmet prioritizeSeoTags>
      <title>{pageTitle}</title>
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta name="description" content={pageDescription} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={img} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={img} />

      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
