# Drosera Studio

## Overview

Drosera Studio is a production-grade, configuration-driven blockchain monitoring dashboard built for the Drosera Network. It's a comprehensive Web3 dApp designed for real-time monitoring of trap events across multiple blockchain networks. The project aims to provide dynamic visualizations, real-time event streaming, and robust administrative tools, making it a crucial asset for operators and participants within the Drosera ecosystem. The business vision is to empower users with immediate insights into on-chain activities, enhancing security and operational efficiency.

## User Preferences

I prefer clear and concise explanations. When making changes, please prioritize security and performance. For development, I prefer an iterative approach, with frequent updates and opportunities for feedback. I value detailed explanations for complex architectural decisions. Do not make changes to the `replit.nix` file.

## System Architecture

Drosera Studio is built with a modern web stack, emphasizing real-time capabilities and a configurable administrative interface.

### UI/UX Decisions
- **Design System**: Utilizes `shadcn/ui` and Tailwind CSS for a consistent and responsive design.
- **Theming**: Supports both dark and light modes, with charts specifically configured for both themes using hardcoded hex colors for consistency.
- **Animations**: Integrates Framer Motion with spring physics for smooth, interactive UI elements.
- **Data Visualization**: Employs Apache ECharts for dynamic and interactive data representation, including timeseries and donut charts.
- **Layout**: Dashboards feature a balanced, responsive layout with KPI cards, charts, and live event feeds.

### Technical Implementations
- **Frontend**: Developed with React 18 and TypeScript, using Wouter for routing and TanStack Query for data fetching. Web3 connectivity is handled by `wagmi` and `viem`.
- **Backend**: Powered by Node.js with Express and TypeScript. Drizzle ORM is used for PostgreSQL interactions, and a WebSocket server provides real-time updates.
- **Blockchain Indexer**: A custom Viem-based indexer monitors the Drosera protocol contract, optimized with Infura API rate limiting, block timestamp caching, and batch processing to handle high-volume event data. It supports historical backfill and live event streaming.
- **Authentication**: Implements wallet connect authentication using `wagmi` and `viem`, supporting multiple chains. Features token-based session management and backend authentication middleware for API route protection.
- **Role-Based Access Control (RBAC)**: Utilizes an `admin_whitelist` table to define three roles (`master_admin`, `admin`, `viewer`) with dynamic assignment upon wallet login. This controls access to administrative features and specific API routes.

### Feature Specifications
- **Real-time Monitoring**: Live event streaming via WebSockets and real-time aggregation of dashboard statistics.
- **Configurable Admin Console**: Comprehensive CRUD interfaces for managing trap types, menus, data sources, alert rules, integrations, and blockchain networks.
- **Alerting System**: Supports rule-based alerting with trigger types (frequency, condition, status_change) and integrated Telegram notifications.
- **Dynamic Network Management**: `blockchain_networks` table allows dynamic configuration of RPC endpoints and contract addresses, with a dedicated admin UI for management.

### System Design Choices
- **Database**: PostgreSQL with Drizzle ORM, featuring a normalized schema across 20+ tables for authentication, configuration, trap monitoring, and alerts.
- **API**: RESTful API with over 50 endpoints, protected by authentication and role-based access control where necessary.
- **Modularity**: Separation of concerns with dedicated services for alerts, storage, and indexer functionalities.

## External Dependencies

- **Database**: PostgreSQL (hosted on Neon)
- **Web3 Libraries**: wagmi, viem
- **Data Visualization**: Apache ECharts
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Real-time Communication**: `ws` (WebSocket library)
- **Blockchain RPC**: Infura (for Viem-based indexing)
- **Notification Services**:
    - Telegram Bot API (for alert notifications)
- **Package Manager**: npm