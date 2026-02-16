const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

function buildAgent() {
  const caPath = process.env.GIGACHAT_CA_CERT_PATH;
  const caInline = process.env.GIGACHAT_CA_CERT;
  const insecure = process.env.GIGACHAT_INSECURE_SKIP_VERIFY === '1';
  const agentOptions = {};
  if (caInline && caInline.trim()) {
    agentOptions.ca = caInline;
  } else if (caPath) {
    try {
      const ca = fs.readFileSync(caPath);
      agentOptions.ca = ca;
    } catch (e) {
      console.error('GIGACHAT_CA_CERT_PATH read error:', e.message);
    }
  }
  if (insecure) {
    agentOptions.rejectUnauthorized = false;
  }
  return Object.keys(agentOptions).length ? new https.Agent(agentOptions) : undefined;
}

async function getAccessToken() {
  const authKey = process.env.GIGACHAT_AUTH_KEY;
  const scope = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';
  const rqUid = crypto.randomUUID();
  if (!authKey) {
    throw new Error('GIGACHAT_AUTH_KEY not set');
  }

  const agent = buildAgent();
  const body = new URLSearchParams({ scope }).toString();

  const options = {
    method: 'POST',
    hostname: 'ngw.devices.sberbank.ru',
    port: 9443,
    path: '/api/v2/oauth',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'RqUID': rqUid,
      'Authorization': `Basic ${authKey}`
    },
    agent
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            resolve(json && json.access_token ? json.access_token : null);
          } catch (e) {
            reject(new Error('Invalid JSON from GigaChat'));
          }
        } else {
          let msg = 'OAuth failed';
          try {
            const json = JSON.parse(data);
            if (json.error) msg = json.error;
            else if (json.message) msg = json.message;
          } catch (e) {}
          reject(new Error(msg));
        }
      });
    });
    req.on('error', err => reject(err));
    req.write(body);
    req.end();
  });
}

async function getChatCompletionText(messages, model) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('No access token from GigaChat');
  }

  const agent = buildAgent();
  const body = JSON.stringify({
    model: model || 'GigaChat',
    messages: messages || [],
  });

  const options = {
    method: 'POST',
    hostname: 'gigachat.devices.sberbank.ru',
    port: 443,
    path: '/api/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    agent,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}');
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const choice = json && json.choices && json.choices[0];
            const text = choice && choice.message && choice.message.content;
            resolve(text || '');
          } else {
            const msg = json.error || json.message || 'GigaChat completion failed';
            reject(new Error(msg));
          }
        } catch (e) {
          reject(new Error('Invalid JSON from GigaChat completions'));
        }
      });
    });
    req.on('error', err => reject(err));
    req.write(body);
    req.end();
  });
}

module.exports = {
  getAccessToken,
  getChatCompletionText,
};
