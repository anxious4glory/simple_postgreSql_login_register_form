import express from "express";
import bodyParser from "body-parser";

import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Client } = pg;

export const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  host: process.env.PGHOST,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000, // 5 second timeout
  idleTimeoutMillis: 30000,
});

await client.connect().catch(err => {
  console.error('Database connection failed:', err);
});


async function connectDatabase() {
  try {
    if (!client._connected && !client._connecting) {
      await client.connect();
      console.log('Connected to database successfully');
         // Test query
         const result = await client.query("SELECT NOW()");
         console.log(result.rows);
    }
    return client;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

connectDatabase();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
  
  try {
        await client.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [email, password]
        );
        res.render("secrets.ejs");
    }   catch (err) {
        res.status(400).send("Error: " + err.message);
    }

});

app.post("/login", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const result = await client.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;

      if (password === storedPassword) {
        res.render("secrets.ejs");
      } else {
        res.send("Incorrect Password");
      }
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
