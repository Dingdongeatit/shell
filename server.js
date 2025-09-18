const express = require("express");
const { exec } = require("child_process");
const { randomBytes } = require("crypto");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Run a single Linux command inside a sandboxed container
app.post("/terminal", (req, res) => {
  const cmd = req.body.command;
  if (!cmd) return res.status(400).send("No command provided");

  const safeImage = "debian:stable-slim";

  const dockerCmd = `
    docker run --rm \
      --network=none \
      --memory=128m \
      --cpus=0.5 \
      --pids-limit=100 \
      --read-only \
      ${safeImage} /bin/bash -c "${cmd.replace(/"/g, '\\"')}"
  `;

  exec(dockerCmd, { timeout: 5000 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ output: stderr || err.message });
    }
    res.json({ output: stdout });
  });
});

app.listen(3000, () => console.log("⚡ Linux Terminal API running on 3000"));
