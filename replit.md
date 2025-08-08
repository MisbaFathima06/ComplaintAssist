# SpeakSecure - Privacy-First Complaint Platform

## Overview

SpeakSecure is a privacy-first anonymous complaint platform designed to help vulnerable populations report sensitive issues like harassment, abuse, discrimination, and corruption without fear of retaliation. The platform uses zero-knowledge cryptography to ensure complete anonymity while maintaining data integrity and enabling verification of complaint authenticity. It serves victims across various contexts including corporate environments, educational institutions, hostels, and community settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for fast development and optimized production builds
- **UI Components**: Shadcn/ui component library built on Radix UI primitives providing accessible and customizable components
- **Styling**: Tailwind CSS with custom design tokens supporting dark/light themes and responsive design
- **State Management**: TanStack Query (React Query) for server state caching and synchronization, with Zustand for client-side state management
- **Routing**: Wouter for lightweight client-side routing without the overhead of React Router
- **Form Handling**: React Hook Form with Zod validation schemas ensuring type-safe form processing and validation
- **Internationalization**: Custom i18n system supporting multiple languages including English, Hindi, Tamil, Kannada, and Urdu for accessibility across diverse populations

### Backend Architecture
- **Runtime**: Node.js with Express.js framework providing RESTful API endpoints for all platform operations
- **Database**: PostgreSQL with Neon serverless hosting for scalable and reliable data persistence
- **ORM**: Drizzle ORM enabling type-safe database queries, migrations, and schema management
- **Session Management**: Express sessions with PostgreSQL store for persistent user authentication and session handling
- **Build System**: ESBuild for fast server compilation and efficient bundling of production assets

### Zero-Knowledge Privacy System
- **Identity Generation**: Implementation of Semaphore protocol for anonymous user identities using cryptographic commitment schemes
- **Proof System**: Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (ZK-SNARKs) enabling anonymous complaint submission and upvoting without revealing user identity
- **Nullifier Hashes**: Prevention of duplicate submissions and multiple upvotes from the same user while maintaining complete anonymity
- **Group Membership**: Merkle tree-based proofs validating user membership in the platform without exposing personal information
- **Anonymous Actions**: Complete anonymity for all user interactions including complaint submission, upvoting, and platform engagement

### Data Security and Encryption
- **Client-Side Encryption**: AES-256-GCM encryption of all complaint content before transmission using browser-native crypto APIs
- **Key Management**: Secure key generation and selective decryption capabilities for authorized NGOs and platform administrators
- **End-to-End Protection**: Complete data protection pipeline from browser to storage ensuring zero server-side access to plaintext content
- **Decentralized Storage**: IPFS integration for immutable and tamper-proof storage of encrypted complaint data
- **Blockchain Verification**: Transaction hash logging on blockchain networks for immutable audit trails and data integrity verification

### Emergency Response System
- **Instant Alerts**: Real-time emergency notification system for urgent and life-threatening situations
- **SMS Integration**: MSG91 API integration for emergency SMS alerts to trusted contacts and authorities
- **Location Services**: Optional GPS coordinate inclusion for emergency situations requiring immediate intervention
- **Prioritization**: Automatic escalation protocols for emergency complaints routed to appropriate response teams
- **Multi-Channel Notifications**: WebSocket-based real-time notifications for immediate response coordination

### Multi-Language Support
- **Internationalization**: Comprehensive i18n system supporting English, Hindi, Tamil, Kannada, and Urdu languages
- **Dynamic Translation**: Runtime language switching without page reloads for seamless user experience
- **Cultural Adaptation**: Culturally appropriate messaging and terminology for different regional contexts
- **Voice Recognition**: Multi-language speech-to-text capabilities for users who prefer voice input over typing

## External Dependencies

### Database and Storage
- **Neon PostgreSQL**: Serverless PostgreSQL hosting for scalable data persistence and management
- **IPFS (InterPlanetary File System)**: Decentralized storage network for immutable complaint data storage
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect support

### Cryptographic and Blockchain Services
- **Polygon Network**: Blockchain network for transaction logging and immutable audit trails
- **Browser Crypto APIs**: Native browser cryptographic functions for client-side encryption and key generation
- **Semaphore Protocol**: Zero-knowledge identity and proof generation framework

### Communication Services
- **MSG91**: SMS gateway service for emergency alert notifications and communication
- **WebSocket**: Real-time bidirectional communication for instant notifications and updates
- **Nodemailer**: Email service integration for administrative notifications and alerts

### Development and Infrastructure
- **Vite**: Frontend build tool with hot module replacement for development and optimized production builds
- **ESBuild**: Fast JavaScript bundler for server-side code compilation
- **Replit**: Development environment with integrated deployment and hosting capabilities
- **TanStack Query**: Powerful data synchronization library for server state management

### UI and Experience
- **Radix UI**: Unstyled, accessible UI primitives for building custom component library
- **Tailwind CSS**: Utility-first CSS framework for rapid and consistent styling
- **Lucide React**: Icon library providing consistent and accessible iconography
- **React Hook Form**: Performant form library with built-in validation support