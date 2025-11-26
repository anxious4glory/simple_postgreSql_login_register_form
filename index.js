import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Client } = pg;

export const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  family: 4, // force IPv4 so ENETUNREACH disappears
  connectionTimeoutMillis: 5000,
});

async function connectDatabase() {
  try {
    await client.connect();
    console.log("Connected to database successfully");

    const result = await client.query("SELECT NOW()");
    console.log(result.rows);
  } catch (error) {
    console.error("Database connection failed:", error);
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

// register
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    await client.query(
      "INSERT INTO users (email, password) VALUES ($1, $2)",
      [email, password]
    );
    res.render("secrets.ejs");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

// login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [username]
    );

    if (!result.rows.length) return res.send("User not found");

    const user = result.rows[0];
    if (password === user.password) return res.render("secrets.ejs");

    res.send("Incorrect Password");
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});