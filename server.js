const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Reddy's Kitchen API is running!"));

app.get("/api/restaurants", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "restaurants.json");
    const data = await fs.readFile(filePath, "utf8");
    const restaurants = JSON.parse(data);
    res.json(restaurants);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Check restaurants.json" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Running on port ${PORT}`);
});
