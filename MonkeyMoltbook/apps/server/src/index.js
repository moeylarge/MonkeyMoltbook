import { WebSocketServer } from 'ws';
import http from 'http';
import app from './app.js';
import { getNextAgentHook } from './lib/agents.js';

const PORT = process.env.PORT || 8787;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', async (ws) => {
  ws.send(JSON.stringify({
    type: 'boot',
    app: 'MonkeyMoltbook',
    phase: 'Controlled Moltbook ingestion',
    status: 'connected'
  }));

  ws.send(JSON.stringify(await getNextAgentHook()));
});

server.listen(PORT, () => {
  console.log(`MonkeyMoltbook server listening on http://localhost:${PORT}`);
});
