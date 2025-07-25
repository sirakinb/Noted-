# Noted - AI-Powered Voice Note Taking App

![Noted Logo](whisper/public/noted__logo.png)

## Overview

Noted is a modern, AI-powered voice note-taking application that transforms your spoken words into organized, actionable text. Built with cutting-edge technologies, it offers seamless audio recording, transcription, and intelligent text transformation capabilities.

## ✨ Features

- **🎙️ Voice Recording**: Record audio directly in your browser with a beautiful, intuitive interface
- **📝 AI Transcription**: Powered by OpenAI's Whisper API for accurate speech-to-text conversion
- **🔄 Smart Transformations**: Transform your transcriptions into various formats:
  - Quick Notes
  - Summaries
  - Blog Posts
  - Email Drafts
  - Action Lists
  - Custom Prompts
- **☁️ Cloud Storage**: Secure file uploads with AWS S3 integration
- **💳 Subscription System**: Monetization ready with Stripe and RevenueCat integration
- **🎨 Modern UI**: Beautiful, responsive design with Tailwind CSS
- **📱 Mobile Friendly**: Optimized for both desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, tRPC
- **Database**: PostgreSQL with Prisma ORM
- **AI/ML**: OpenAI Whisper API, Together AI
- **Storage**: AWS S3
- **Payments**: Stripe, RevenueCat
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL database
- AWS account (for S3 storage)
- OpenAI API key
- Together AI API key (optional)
- Stripe account (for payments)
- RevenueCat account (for subscription management)

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/sirakinb/Noted-.git
   cd Noted-/whisper
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   
   Copy the `.example.env` file to `.env.local`:
   ```bash
   cp .example.env .env.local
   ```

   Fill in the required environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://..."
   
   # OpenAI
   OPENAI_API_KEY="sk-..."
   
   # AWS S3
   AWS_ACCESS_KEY_ID="..."
   AWS_SECRET_ACCESS_KEY="..."
   AWS_REGION="..."
   S3_BUCKET_NAME="..."
   
   # Stripe
   STRIPE_SECRET_KEY="sk_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
   
   # RevenueCat
   REVENUECAT_SECRET_KEY="..."
   NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY="..."
   
   # Together AI (optional)
   TOGETHER_API_KEY="..."
   ```

4. **Set up the database**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
whisper/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── whispers/          # Transcription pages
│   └── subscribe/         # Subscription page
├── components/            # React components
│   ├── ui/               # UI components
│   └── hooks/            # Custom React hooks
├── lib/                   # Utility functions
├── prisma/               # Database schema
├── public/               # Static assets
└── trpc/                 # tRPC configuration
```

## 🔧 Configuration

### AWS S3 Setup
1. Create an S3 bucket
2. Configure CORS settings (see `s3-bucket-policy.json`)
3. Set up IAM user with appropriate permissions

### Stripe Setup
1. Create products and prices in Stripe Dashboard
2. Configure webhook endpoints
3. Update subscription tiers in the code

### Database Schema
The app uses Prisma with PostgreSQL. Key models include:
- `User` - User accounts and settings
- `Whisper` - Transcription records
- `WhisperTransformation` - Transformed text versions

## 🎯 Usage

1. **Recording**: Click the microphone button to start recording
2. **Upload**: Drag and drop audio files or click to upload
3. **Transform**: Select a transformation type or create custom prompts
4. **Manage**: View all your transcriptions in the dashboard

## 🔐 API Routes

- `/api/transform` - Transform transcribed text
- `/api/s3-upload` - Get presigned URLs for file uploads
- `/api/stripe/create-checkout-session` - Create Stripe checkout
- `/api/subscription/update` - Update subscription status
- `/api/validate-key` - Validate API keys

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Railway
- Render
- AWS Amplify
- Self-hosted

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](whisper/LICENSE) file for details.

## 🙏 Acknowledgments

- Built on top of the [Whisper Playground](https://github.com/Nutlope/whisper) by Nutlope
- Powered by OpenAI's Whisper API
- UI components from Radix UI and Tailwind CSS

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ by [sirakinb](https://github.com/sirakinb) 