const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const { randomBytes } = require("crypto");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Run Python code inside isolated Docker container
app.post("/run", (req, res) => {
  const code = req.body.code;
  if (!code) return res.status(400).send("No code provided");

  const id = randomBytes(4).toString("hex");
  const filename = `/tmp/${id}.py`;
  fs.writeFileSync(filename, code);

  const dockerCmd = `
    docker run --rm \
      --network=none \
      --memory=128m \
      --cpus=0.5 \
      --pids-limit=100 \
      --read-only \
      -v ${filename}:/sandbox/main.py:ro \
      python:3.12 python /sandbox/main.py
  `;

  exec(dockerCmd, { timeout: 5000 }, (err, stdout, stderr) => {
    fs.unlinkSync(filename); // clean up

    if (err) {
      return res.json({ output: stderr || err.message });
    }
    res.json({ output: stdout });
  });
});

app.listen(3000, () => console.log("⚡ Runner API listening on port 3000"));
