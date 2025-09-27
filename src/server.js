import "dotenv/config";
import express from "express";
import routes from "./routes.js";
import rateLimit from "express-rate-limit";

const app = express();
app.use(express.json({ limit: "8mb" }));

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many AI requests, please try again later." }
});

app.use("/summarize", aiLimiter);
app.use("/process", aiLimiter);

app.get("/", (_req, res) => res.json({ ok: true, name: "AI-Powered Medical Report Simplifier" }));
app.use("/", routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));
