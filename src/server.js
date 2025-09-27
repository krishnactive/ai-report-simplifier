import express from "express";
import routes from "./routes.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("AI Report Simplifier API"));
app.use("/", routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
