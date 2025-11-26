import express from "express";
import bodyParser from "body-parser";

import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Client } = pg;
const client = new Client({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});


async function connectDatabase() {
    try {
        await client.connect();
        console.log("Connected to PostgreSQL!");

        // Test query
        const result = await client.query("SELECT NOW()");
        console.log(result.rows);

        
    } catch (error) {
        console.error("Error connecting:", error);
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
