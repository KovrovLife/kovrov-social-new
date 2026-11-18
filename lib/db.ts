import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

let initialized = false;

export async function initDb() {
  if (initialized) return;
  initialized = true;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS districts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        cover_url TEXT,
        birthday TEXT,
        work TEXT,
        status_text TEXT,
        last_seen TEXT,
        district_id INTEGER NOT NULL REFERENCES districts(id),
        is_admin INTEGER NOT NULL DEFAULT 0,
        is_blocked INTEGER NOT NULL DEFAULT 0,
        block_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        category_id INTEGER NOT NULL REFERENCES categories(id),
        district_id INTEGER NOT NULL REFERENCES districts(id),
        title TEXT NOT NULL,
        photo_url TEXT,
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS post_photos (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      );
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id),
        receiver_id INTEGER NOT NULL REFERENCES users(id),
        body TEXT,
        type TEXT NOT NULL DEFAULT 'text',
        file_url TEXT,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        friend_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS user_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS gallery_photos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS photo_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        photo_id INTEGER NOT NULL REFERENCES gallery_photos(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        UNIQUE(user_id, photo_id)
      );
      CREATE TABLE IF NOT EXISTS photo_comments (
        id SERIAL PRIMARY KEY,
        photo_id INTEGER NOT NULL REFERENCES gallery_photos(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        body TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS wall_posts (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS wall_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        wall_post_id INTEGER NOT NULL REFERENCES wall_posts(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        UNIQUE(user_id, wall_post_id)
      );
      CREATE TABLE IF NOT EXISTS wall_comments (
        id SERIAL PRIMARY KEY,
        wall_post_id INTEGER NOT NULL REFERENCES wall_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        body TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS reels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        video_url TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS reel_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        reel_id INTEGER NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        UNIQUE(user_id, reel_id)
      );
      CREATE TABLE IF NOT EXISTS stories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        media_url TEXT NOT NULL,
        media_type TEXT NOT NULL DEFAULT 'photo',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS reel_comments (
        id SERIAL PRIMARY KEY,
        reel_id INTEGER NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS tracks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        file_url TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS user_tracks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, track_id)
      );
    `);

        const districtRes = await pool.query('SELECT COUNT(*) as c FROM districts');
    if (Number(districtRes.rows[0].c) === 0) {
      await pool.query(
        "INSERT INTO districts (name) VALUES ('Северный район'), ('Южный район'), ('Центр'), ('Другой район')"
      );
    }

    const catRes = await pool.query('SELECT COUNT(*) as c FROM categories');
    if (Number(catRes.rows[0].c) === 0) {
      await pool.query(
        "INSERT INTO categories (slug, name) VALUES ('give', 'Отдам даром'), ('lost', 'Потеряшки'), ('services', 'Услуги'), ('events', 'События'), ('question', 'Вопрос соседям')"
      );
    }
  } catch (err) {
    initialized = false;
    console.error('Ошибка инициализации PostgreSQL:', err);
  }
}

initDb();

export const db = {
  async get(sql: string, params: any[] = []) {
    await initDb();
    const res = await pool.query(convertPlaceholders(sql), params);
    return res.rows[0] || null;
  },
  async all(sql: string, params: any[] = []) {
    await initDb();
    const res = await pool.query(convertPlaceholders(sql), params);
    return res.rows;
  },
  async run(sql: string, params: any[] = []) {
    await initDb();
    const res = await pool.query(convertPlaceholders(sql), params);
    return res;
  },
};

function convertPlaceholders(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => '$' + ++index);
}
