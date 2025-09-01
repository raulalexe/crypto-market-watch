# Web3 Patreon MVP

A decentralized creator support platform built with Next.js, RainbowKit, and Web3 technologies.

## Features

### Phase 1 MVP (Current)
- ✅ Wallet connection with RainbowKit
- ✅ Creator onboarding flow
- ✅ Profile creation and management
- ✅ Creator dashboard
- ✅ Modern, responsive UI with Tailwind CSS

### Planned Features
- Creator support tiers and subscriptions
- Direct crypto payments
- Exclusive content access
- Fan engagement features
- Analytics and insights

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A WalletConnect Project ID (free at [cloud.walletconnect.com](https://cloud.walletconnect.com/))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd web3-patreon
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Add your WalletConnect Project ID to `.env.local`:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Web3**: RainbowKit, Wagmi, Viem
- **Wallet Connection**: WalletConnect v2
- **State Management**: TanStack Query

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Creator dashboard
│   ├── creators/          # Creators listing page
│   └── layout.tsx         # Root layout with Web3 providers
├── components/            # React components
│   ├── Header.tsx         # Navigation header
│   ├── HeroSection.tsx    # Landing page hero
│   ├── CreatorOnboarding.tsx # Creator signup flow
│   ├── CreatorProfileForm.tsx # Profile creation form
│   ├── CreatorDashboard.tsx   # Creator dashboard
│   └── CreatorsList.tsx   # Creators listing
├── lib/                   # Utility libraries
│   └── wagmi.ts          # Wagmi configuration
└── providers/            # React context providers
    └── Web3Provider.tsx  # Web3 providers wrapper
```

## Usage

### For Creators
1. Connect your wallet using the "Connect Wallet" button
2. Click "Create Your Creator Profile" to start onboarding
3. Fill out your profile information (name, bio, category, social links)
4. Access your dashboard to manage your creator profile

### For Fans
1. Browse creators on the creators page
2. Connect your wallet to support creators
3. Send crypto directly to creators (coming in Phase 2)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Create components in `src/components/`
2. Add new pages in `src/app/`
3. Update the Web3 configuration in `src/lib/wagmi.ts` if needed
4. Follow the existing patterns for wallet integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

### Phase 2: Payments & Tiers
- Smart contract integration for payments
- Creator support tiers
- Subscription management
- Payment history

### Phase 3: Content & Engagement
- Exclusive content posting
- Fan messaging
- Community features
- Analytics dashboard

### Phase 4: Advanced Features
- NFT rewards
- Governance tokens
- Cross-chain support
- Mobile app