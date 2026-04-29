# Groq App Generator

An interactive web application that generates and modifies web applications using Groq's LLM API. Built with Next.js and TypeScript.

## Features

- Real-time app generation based on natural language queries
- Content safety checking using LlamaGuard
- Interactive feedback system for iterative improvements
- Version control and history tracking
- Share and export functionality

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Groq SDK
- React Syntax Highlighter
- UUID for session management

## Environment Variables

Required environment variables:
- `GROQ_API_KEY`: Your Groq API key
- `HTML_SIGNING_SECRET`: A secret key used to sign and verify generated HTML (any random string; e.g. run `openssl rand -hex 32`)

Optional environment variables (for gallery/upvote features):
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase service role key
- `UPSTASH_REDIS_URL`: Redis URL for legacy storage (no longer actively used)
- `BLOCK_SECRET`: Secret token for the IP block admin endpoint

When `SUPABASE_URL` and `SUPABASE_KEY` are not set, the gallery and upvote features are silently disabled and the app runs with core generation functionality only.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your environment variables
4. Run the development server: `npm run dev`

The application will be available at `http://localhost:3000`.
