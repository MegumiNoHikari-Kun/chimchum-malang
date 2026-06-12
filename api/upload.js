export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { fileName, content } = req.body; // content = base64 string

  const token = process.env.GITHUB_TOKEN; // diambil dari Environment Variables
  const repo = "MegumiNoHikari-Kun/chimchum-malang";

  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${fileName}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `upload ${fileName}`,
      content: content
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json(data);
  }

  return res.status(200).json({ url: `https://cdn.jsdelivr.net/gh/${repo}@main/${fileName}` });
}
