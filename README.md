# Ottawa Housing Market Analytics Platform

A full-stack web application that automatically scrapes Ottawa housing market data from a weekly summary post in the /r/ottawa subreddit and visualizes trends through an interactive Next.js dashboard.

## Live Demo

[View the live dashboard](https://ottawa-housing-trends.vercel.app/)

## Features

### Interactive Dashboard
- **Sales Analytics**: Track median sale prices, active listings, and sold-as-percentage-of-list trends
- **Rental Analytics**: Monitor rental prices and availability for both freehold and condo properties
- **Responsive Design**: Fully mobile-optimized with skeleton loading states
- **Real-time Updates**: Data refreshes weekly via automated GitHub Actions workflow

### Automated Data Collection
- Web scraper targeting Reddit housing market posts
- Intercepts and parses JSON payload
- Proxy rotation system to prevent IP blocking
- Scheduled weekly execution (Mondays at 9pm UTC)
- Direct integration with PostgreSQL database

## Tech

### Frontend
- **Next.js 16** - With Turbopack for blazing-fast builds!
- **React 19** - Modern React with TypeScript for type safety
- **Recharts** - Composable charting library for data visualization
- **Tailwind CSS** - Utility-first CSS framework

### Backend
- **Python 3.x** - Web scraping with BeautifulSoup + requests
- **Supabase PostgreSQL** - Managed database with four tables:
  - `freehold_sales` - Single-family home sales data
  - `condo_sales` - Condominium sales data
  - `freehold_rentals` - Single-family rental data
  - `condo_rentals` - Condo rental data

### DevOps
- **GitHub Actions** - Automated scraper workflow
- **Vercel** - Serverless deployment platform
- **ESLint** - Code quality and consistency

## Local Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Supabase account (free tier works)
- GitHub repository (for Actions)

### Frontend Setup

```bash
cd ottawa-housing-dashboard
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Run development server:
```bash
npm run dev
```

### Scraper Setup

```bash
cd scraper
pip install -r ../requirements.txt
```

Configure Supabase credentials as GitHub Secrets:
- `SUPABASE_URL`
- `SUPABASE_KEY`

And configure a secret for your list of proxies if using the proxy rotator:
- `PROXY_LIST`

## Data Flow

1. **GitHub Actions** triggers scraper every Monday at 9pm UTC
2. **Python scraper** extracts housing data from /u/ottawaagent Reddit posts
3. **Proxy rotator** prevents IP blocking during scraping (probably unnecessary but my roommates and I use Reddit a lot and didn't want to get my home IP banned)
4. **Supabase** stores data in PostgreSQL tables
5. **Next.js dashboard** fetches and visualizes data with Recharts

## Key Highlights

- **Full-stack ownership**: Designed and implemented both backend scraper and frontend dashboard
- **Modern React patterns**: Server-side rendering, custom hooks, responsive design
- **CI/CD pipeline**: Automated data collection with GitHub Actions
- **Performance optimized**: Turbopack builds, skeleton loading, mobile-first design
- **Production ready**: Deployed on Vercel with environment variable management

## Future Enhancements?

- [ ] Add historical trend predictions using ML
- [ ] Implement email alerts for price threshold changes
- [ ] Export data to CSV functionality
- [ ] Additional data sources beyond Reddit
- [ ] Market state summary, seller or buyer's market?

## License

MIT License - feel free to use this project as a portfolio piece or learning resource.