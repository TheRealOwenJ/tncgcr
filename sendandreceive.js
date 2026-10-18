export { send, get };

const settingzFile = Bun.file("./settingz.json");
let settingz = await settingzFile.json();

async function send(text, user) {
  const response = await fetch(settingz["endpoint"], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: text,
      user: user,
    }),
  });

  return await response.text();
}

async function get(text) {
  const response = await fetch(settingz["endpoint"] + "/get");

  return await response.json();
}
