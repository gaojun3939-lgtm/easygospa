# EasyGo Spa Luxury Spa & Salon

A modern, responsive website for EasyGo Spa Luxury Spa & Salon, Metro Manila's premier luxury wellness destination. This project showcases premium services including hair styling, skincare, massages, nail care, and wellness treatments, with features like online booking, customer reviews, and a chatbot for inquiries.

## Features

- **Hero Section**: Engaging landing page with smooth animations.
- **Why Choose Us**: Highlights unique selling points.
- **Categories & Services**: Browse premium offerings.
- **Product Specialty**: Detailed service descriptions.
- **What We Do**: Overview of treatments and expertise.
- **Promotional Banner**: Special offers and deals.
- **Brand Partners**: Collaborations with luxury brands.
- **Testimonials**: Customer reviews and feedback widget.
- **Gallery**: Visual showcase of the salon experience.
- **Team Page**: Meet the professional staff.
- **Contact & Booking**: Interactive booking modal and contact form.
- **Chatbot**: AI-powered assistance for users.
- **Newsletter Subscription**: Stay updated with exclusive offers.
- **SEO Optimization**: Schema markup for better search visibility.
- **Responsive Design**: Mobile-friendly with smooth transitions using Framer Motion.
- **Loading Screen**: Enhanced user experience during page loads.

Pages include: Home, Services, Contact, Gallery, Team, Booking Notifications, and Sitemap.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with Turbopack for fast development.
- **Language**: TypeScript 5.
- **UI Library**: React 19.
- **Styling**: Tailwind CSS 4 with PostCSS.
- **Animations**: Framer Motion 12.
- **Icons**: Lucide React 0.542.
- **Linting**: ESLint 9 with Next.js config.
- **Fonts**: Geist Sans and Mono from Google Fonts.

## Getting Started

### Prerequisites

- Node.js 18 or higher.
- npm or yarn package manager.

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/edze-worla-alex/serinity.git
   cd serinity
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to view the site. The page will auto-update as you edit files.

4. Build for production:
   ```
   npm run build
   ```

5. Start the production server:
   ```
   npm run start
   ```

### Linting

Run ESLint to check for code issues:
```
npm run lint
```

## Project Structure

```
serinity/
├── public/              # Static assets (images, icons)
├── src/
│   ├── app/             # Next.js App Router pages and layouts
│   │   ├── globals.css  # Global styles
│   │   ├── layout.tsx   # Root layout with Navbar, Footer, Modals
│   │   ├── page.tsx     # Home page
│   │   ├── contact/     # Contact page
│   │   ├── gallery/     # Gallery page
│   │   ├── services/    # Services page
│   │   ├── team/        # Team page
│   │   └── ...          # Other pages (sitemap, booking-notifications)
│   ├── components/      # Reusable React components
│   │   ├── navbar.jsx   # Navigation bar
│   │   ├── Hero.jsx     # Hero section
│   │   ├── WhyChooseUs.jsx # Why choose us section
│   │   ├── TestimonialsSection.jsx # Testimonials
│   │   ├── BookingModal.jsx # Booking form modal
│   │   ├── ChatBot.jsx  # AI chatbot
│   │   ├── ReviewWidget.jsx # Reviews component
│   │   └── ...          # Other components (LoadingScreen, SubscribeForm, etc.)
│   └── utils.ts         # Utility functions
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS config (if customized)
├── postcss.config.mjs   # PostCSS config
├── tsconfig.json        # TypeScript config
├── eslint.config.mjs    # ESLint config
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme), the platform from the creators of Next.js.

1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Deploy automatically.

For more details, see [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests for any improvements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (add if needed).

## Contact

- **Location**: P-145, Sector A, Metropolitan Co-Operative Housing Society Limited,  Metro Manila 1229
- **Phone**: +63 917 109 8079
- **Email**: easygospa@gmail.com
- **Social**: Follow us on [Instagram](https://instagram.com/EasyGo Spa) and [Facebook](https://facebook.com/EasyGo Spa)

For support or inquiries, reach out via email or the website's contact form.
