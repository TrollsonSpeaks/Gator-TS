# Gator RSS Aggregator 🐊📰

A command-line RSS feed aggregator built with TypeScript, Drizzle ORM, and PostgreSQL. Gator allows you to follow your favorite RSS feeds, automatically fetch new posts, and browse them right from your terminal!

## Features

- 👤 User management (register, login, switch users)
- 📡 Add and manage RSS feeds
- 🔄 Follow/unfollow feeds
- 🤖 Background aggregator that continuously fetches new posts
- 📖 Browse posts from feeds you follow
- 🗄️ PostgreSQL database for persistent storage
- 🛡️ Duplicate post detection

## Prerequisites

Before running Gator, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TrollsonSpeaks/gator-ts.git
   cd gator-ts
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL:**
   
   Make sure PostgreSQL is running on your machine. Create a database called `gator`:
   ```bash
   psql postgres
   CREATE DATABASE gator;
   \q
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

## Configuration

Gator stores user configuration in `~/.gatorconfig.json`. This file is automatically created when you register or login for the first time.

The config file looks like this:
```json
{
  "db_url": "postgres://localhost:5432/gator",
  "current_user_name": "your-username"
}
```

You don't need to create this file manually - Gator handles it for you!

## Usage

### Getting Started

1. **Register a new user:**
   ```bash
   npm run start register alice
   ```

2. **Login as a user:**
   ```bash
   npm run start login alice
   ```

3. **Add an RSS feed:**
   ```bash
   npm run start addfeed "TechCrunch" "https://techcrunch.com/feed/"
   npm run start addfeed "Hacker News" "https://news.ycombinator.com/rss"
   npm run start addfeed "Boot.dev Blog" "https://blog.boot.dev/index.xml"
   ```

4. **Start the aggregator:**
   
   This runs continuously and fetches new posts every 30 seconds:
   ```bash
   npm run start agg 30s
   ```
   
   Press `Ctrl+C` to stop it.

5. **Browse posts** (in another terminal):
   ```bash
   npm run start browse
   npm run start browse 10  # Show 10 posts
   ```

### Available Commands

#### User Management
- `register <username>` - Create a new user and log in
- `login <username>` - Switch to an existing user
- `users` - List all users

#### Feed Management
- `addfeed <name> <url>` - Add a new RSS feed and automatically follow it
- `feeds` - List all feeds in the database
- `follow <url>` - Follow an existing feed
- `unfollow <url>` - Unfollow a feed
- `following` - List feeds you're following

#### Aggregation
- `agg <time_between_reqs>` - Start the feed aggregator
  - Examples: `agg 10s`, `agg 1m`, `agg 5m`
  - Runs continuously until stopped with `Ctrl+C`

#### Browsing
- `browse [limit]` - View latest posts from feeds you follow
  - Default limit: 2 posts
  - Example: `browse 10` (show 10 posts)

#### Utilities
- `reset` - Delete all users and data (use with caution!)

## Example Workflow

```bash
# Set up
npm run start reset
npm run start register alice
npm run start addfeed "TechCrunch" "https://techcrunch.com/feed/"
npm run start addfeed "Hacker News" "https://news.ycombinator.com/rss"

# Terminal 1: Start aggregator
npm run start agg 30s

# Terminal 2: Browse posts
npm run start browse 5
npm run start following
```

## Popular RSS Feeds to Try

- **Tech News:**
  - TechCrunch: `https://techcrunch.com/feed/`
  - The Verge: `https://www.theverge.com/rss/index.xml`
  - Ars Technica: `https://feeds.arstechnica.com/arstechnica/index`
  - Hacker News: `https://news.ycombinator.com/rss`

- **Programming:**
  - Boot.dev Blog: `https://blog.boot.dev/index.xml`
  - CSS-Tricks: `https://css-tricks.com/feed/`
  - Smashing Magazine: `https://www.smashingmagazine.com/feed/`

- **General:**
  - Reddit Programming: `https://www.reddit.com/r/programming/.rss`

## Project Structure

```
gator-ts/
├── src/
│   ├── index.ts           # Main entry point
│   ├── commands.ts        # Command handlers
│   ├── config.ts          # Config file management
│   ├── types.ts           # TypeScript types
│   ├── utils.ts           # Utility functions
│   └── lib/
│       ├── rss.ts         # RSS feed fetching and parsing
│       └── db/
│           ├── index.ts   # Database connection
│           ├── schema.ts  # Drizzle ORM schema
│           └── queries/   # Database query functions
├── drizzle/               # Database migrations
├── package.json
└── README.md
```

## Technologies Used

- **TypeScript** - Type-safe JavaScript
- **Node.js** - JavaScript runtime
- **PostgreSQL** - Relational database
- **Drizzle ORM** - TypeScript ORM
- **fast-xml-parser** - RSS feed parsing
- **tsx** - TypeScript execution

## Development

### Run in development mode:
```bash
npm run start <command> [args]
```

### Generate a new migration:
```bash
npm run generate
```

### Run migrations:
```bash
npm run migrate
```

## Troubleshooting

### "No user is currently logged in"
Make sure you've registered and logged in:
```bash
npm run start register yourname
npm run start login yourname
```

### "Database connection failed"
Ensure PostgreSQL is running and the `gator` database exists:
```bash
psql postgres -c "CREATE DATABASE gator;"
```

### Duplicate post errors
This is normal! Gator automatically handles duplicate posts when re-fetching feeds.

## License

MIT

## Author

Built with ❤️  from VJS

---

**Happy aggregating!** 🐊📰
