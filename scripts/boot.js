import "dotenv/config";
import concurrently from "concurrently";
import fkill from "fkill";
import { portToPid } from "pid-port";

const { PORT, REVERSE_PROXY_PORT } = process.env;
if (
  PORT === undefined ||
  REVERSE_PROXY_PORT === undefined ||
  PORT === REVERSE_PROXY_PORT
) {
  throw new Error("PORT and REVERSE_PROXY_PORT must be defined and different");
}

// Kill running services occupying app ports
for (const port of [PORT, REVERSE_PROXY_PORT]) {
  try {
    const pid = await portToPid(port);
    if (pid) await fkill(pid, { force: true });
  } catch {}
}

const appCommands = await Promise.all(
  ["backend", "frontend"].map(async (name, index) => {
    return {
      name,
      prefixColor: ["blue", "green"][index],
      command: `cd ./apps/${name} && pnpm dev`,
    };
  })
);

concurrently(appCommands);
