
# GoldRatio Quant Analyzer

Professional-grade web application to analyze stock tickers relative to Gold (XAUUSD). Built with Next.js 14, TypeScript, and TradingView Lightweight Charts.

## Features
- **Stock-to-Gold Ratio**: Valuation in real hard assets.
- **Percentile Analysis**: Historical ranking of current valuation.
- **Trend Signals**: SMA 200 days and SMA 200 weeks.
- **Reporting**: Automated Markdown and PDF export.

## Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```

## Data Sources
- **Stooq**: Primary source for historical CSV data (No API key needed).
- **Yahoo Finance**: Fallback for international tickers.
- **Gold Proxy**: Uses GLD if XAUUSD spot is not found.

## Deployment on Netlify
1. Connect your repository to Netlify.
2. Set build command: `npm run build`.
3. Set publish directory: `dist`.
4. Ensure `netlify.toml` is present for SPA routing.

## Environmental Variables
- `API_KEY`: (Optional) If using AlphaVantage or Polygon as providers.
