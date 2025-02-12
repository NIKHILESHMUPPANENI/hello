const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://flowerworker.com";

export const startLinkedInAuth = () => {
  window.location.href = `${API_BASE_URL}/linkedin/auth`;
};

export const getLinkedInToken = async (code: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/linkedin/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error("Failed to get LinkedIn token");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching LinkedIn token:", error);
    return null;
  }
};

export const shareLinkedInPost = async (code: string, text: string, visibility: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/linkedin/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, text, visibility }),
    });

    if (!response.ok) {
      throw new Error("Failed to share LinkedIn post");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sharing LinkedIn post:", error);
    return null;
  }
};
