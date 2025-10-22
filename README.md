# Drosera Studio

A production-grade blockchain monitoring dashboard for the Drosera Network on Hoodi testnet. Real-time trap event tracking, intelligent alerting, and comprehensive analytics for blockchain security operators.

## Features

- **Real-time Monitoring**: Live blockchain event streaming via WebSockets
- **Dynamic Dashboards**: Interactive charts and KPI cards with ECharts visualization
- **Alert System**: Rule-based notifications via Telegram, Discord, and Email
- **Admin Console**: Comprehensive CRUD interfaces for managing trap types, networks, and alert rules
- **Wallet Authentication**: Secure master admin access with wallet connect (wagmi + viem)
- **Theme Customization**: Multiple color presets with live preview
- **Multi-chain Support**: Dynamic blockchain network configuration
- **Role-Based Access Control**: Three-tier permission system (master_admin, admin, viewer)

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Wouter** for routing
- **TanStack Query** for data fetching
- **shadcn/ui** + Tailwind CSS for UI components
- **Framer Motion** for animations
- **Apache ECharts** for data visualization
- **wagmi** + **viem** for Web3 connectivity

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** database (Neon-hosted)
- **Drizzle ORM** for database interactions
- **WebSocket server** for real-time updates
- **Custom Viem-based blockchain indexer** with rate limiting and batch processing

## Prerequisites

- Node.js 18+ and npm
- Supabase PostgreSQL database (already configured)
- Infura API key for blockchain RPC access (built-in)
- (Optional) Telegram Bot Token for alert notifications

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd drosera-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database Configuration
   DATABASE_URL=postgresql://user:password@host:port/database
   PGHOST=your-postgres-host
   PGPORT=5432
   PGUSER=your-postgres-user
   PGPASSWORD=your-postgres-password
   PGDATABASE=your-database-name

   # Session Secret (generate a random string)
   SESSION_SECRET=your-random-session-secret-here

   # Telegram Bot Configuration (Optional - for alert notifications)
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   TELEGRAM_CHAT_ID=your-telegram-chat-id

   # Blockchain Configuration (built into the app, but can be overridden)
   # VITE_CHAIN_ID=17000
   # VITE_CONTRACT_ADDRESS=0x91cB447BaFc6e0EA0F4Fe056F5a9b1F14bb06e5D
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Seed initial data** (optional, creates sample trap types and admin menu)
   ```bash
   npm run seed
   ```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Configure environment variables in Vercel dashboard**
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add all the environment variables from your `.env` file

5. **Set up PostgreSQL database**
   - You're already using Supabase - just add your existing connection details
   - Update the `DATABASE_URL` and related variables in Vercel with your Supabase credentials

### Deploy to Other Platforms

The application can be deployed to any Node.js hosting platform:

- **Railway**: Connect your GitHub repo and configure environment variables
- **Render**: Use the Web Service option with Node.js environment
- **Heroku**: Use the Node.js buildpack and configure environment variables
- **AWS/GCP/Azure**: Deploy using Docker or directly as a Node.js application

## Configuration

### Master Admin Setup

1. Connect your wallet on the landing page
2. Add your wallet address to the `admin_whitelist` table in the database:
   ```sql
   INSERT INTO admin_whitelist (wallet_address, role, created_at)
   VALUES ('0xYourWalletAddress', 'master_admin', NOW());
   ```
3. Disconnect and reconnect your wallet to apply the role

### Blockchain Network Configuration

Master admins can configure blockchain networks via the Admin Console:
- Network name and chain ID
- RPC endpoint URL
- Contract address to monitor
- Enable/disable networks dynamically

### Alert Rules

Configure alert rules in the Admin Console with:
- **Trigger types**: Frequency, Condition, Status Change
- **Notification channels**: Telegram, Discord, Email
- **Cooldown periods**: Prevent alert spam
- **Severity levels**: Critical, Warning, Info

### Theme Customization

Choose from four built-in color presets:
- **Blue** (default): Professional tech aesthetic
- **Drosera Orange**: Official Drosera brand color
- **Purple**: Rich and professional
- **Green**: Natural and trustworthy

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Theme, Auth)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── pages/         # Page components
│   └── index.html
├── server/                # Backend Express application
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database storage interface
│   ├── indexer.ts         # Blockchain event indexer
│   ├── alerts.ts          # Alert system logic
│   ├── seed.ts            # Database seeding script
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
│   └── schema.ts          # Drizzle database schema
└── package.json
```

## API Documentation

### Authentication
- `POST /api/auth/login` - Wallet-based authentication
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user info

### Dashboard
- `GET /api/dashboard/stats` - Real-time statistics
- `GET /api/trap-events` - Paginated trap events
- `GET /api/trap-events/:id` - Single event details

### Admin Endpoints (Master Admin only)
- `GET /api/trap-types` - List all trap types
- `POST /api/trap-types` - Create trap type
- `PUT /api/trap-types/:id` - Update trap type
- `DELETE /api/trap-types/:id` - Delete trap type

(Similar CRUD endpoints for networks, menus, alerts, integrations, data sources)

### Configuration
- `GET /api/config/:key` - Get configuration value
- `PUT /api/config/:key` - Update configuration value

## WebSocket Events

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('ws://your-domain/api/ws?token=YOUR_TOKEN');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New trap event:', data);
};
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check firewall rules allow connections to PostgreSQL
- Ensure PostgreSQL service is running

### Blockchain Indexer Not Running
- Check Infura RPC endpoint is accessible
- Verify contract address is correct
- Check server logs for detailed error messages

### Alerts Not Sending
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- Check alert rules are enabled in Admin Console
- Review server logs for notification errors

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue on GitHub
- Contact: operator@drosera.io

## Acknowledgments

Built with modern web technologies and powered by the Drosera Network.

---

© 2025 Drosera Studio. All rights reserved.
