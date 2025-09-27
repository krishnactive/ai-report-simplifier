import "dotenv/config";
import express from "express";
import routes from "./routes.js";

const app = express();
app.use(express.json({ limit: "8mb" }));

app.get("/", (_req, res) => res.json({ ok: true, name: "AI-Powered Medical Report Simplifier" }));
app.use("/", routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));
