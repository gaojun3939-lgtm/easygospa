import React from 'react';

// This component injects advanced, SEO-friendly structured data into the page head.
export default function SeoSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HealthAndBeautyBusiness",
        "@id": "https://www.easygospa.com/#organization",
        "name": "EasyGo Spa Premium Home Massage",
        "url": "https://www.easygospa.com/",
        "logo": "https://www.easygospa.com/logo.png", // Placeholder URL, should be replaced with actual logo URL
        "description": "EasyGo Spa is Metro Manila's premium 24/7 home massage service. Verified professional therapists deliver Swedish, deep tissue, Thai dry and foot massage to your hotel, condo or home.",
        "image": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/831601306_14.jpg",
        "telephone": "+91-98765-43210",
        "priceRange": "$ - $",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "P-145, Sector A, Metropolitan Co-Operative Housing Society Limited, Ho",
          "addressLocality": "Metro Manila",
          "postalCode": "1229",
          "addressRegion": "Metro Manila",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "22.5413", // Approximate coordinates for  Metro Manila
          "longitude": "88.3833"
        },
        "openingHoursSpecification": [
          { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "10:00", "closes": "20:00" },
          { "@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "09:00", "closes": "19:00" },
          { "@type": "OpeningHoursSpecification", "dayOfWeek": "Sunday", "opens": "10:00", "closes": "18:00" }
        ],
        "sameAs": [
            "https://www.facebook.com/EasyGo Spa", // Placeholder
            "https://www.instagram.com/EasyGo Spa" // Placeholder
        ],
        "hasOffer": [
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Japanese Head Spa" }, "price": "3500", "priceCurrency": "INR" },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Deep Tissue Massage" }, "price": "3500", "priceCurrency": "INR" },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Microblading" }, "price": "6500", "priceCurrency": "INR" }
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://www.easygospa.com/#website",
        "url": "https://www.easygospa.com/",
        "name": "EasyGo Spa Premium Home Massage",
        "publisher": { "@id": "https://www.easygospa.com/#organization" },
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.easygospa.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Review",
        "itemReviewed": { "@id": "https://www.easygospa.com/#organization" },
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "author": { "@type": "Person", "name": "Priya Sharma" },
        "reviewBody": "EasyGo Spa has completely transformed my beauty routine. As the best luxury spa in Metro Manila, their highly skilled professionals and premium equipment deliver results that exceed expectations."
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}