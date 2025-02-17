const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://flowerworker.com";

const startLinkedInAuth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/linkedin/auth`);
    if (!response.ok) {
      throw new Error("Failed to start LinkedIn authentication");
    }
    
    // Get the LinkedIn OAuth URL from the response
    const data = await response.json();
    if (data.url) {
      // Redirect to LinkedIn's OAuth page
      window.location.href = data.url;
    } else {
      throw new Error("Invalid authentication URL received");
    }
  } catch (error) {
    console.error("Error starting LinkedIn authentication:", error);
    alert("Failed to connect to LinkedIn. Please try again.");
  }
};


const getLinkedInToken = async (code: string) => {
  try {
    // Match the backend SharePost struct expectations
    const response = await fetch(`${API_BASE_URL}/linkedin/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        code,
        text: "", // Required by SharePost struct
        Visibility: "PUBLIC" // Required by SharePost struct
      }),
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

const shareLinkedInPost = async (code: string, text: string, visibility: string) => {
  try {
    // Match the backend SharePost struct fields exactly
    const response = await fetch(`${API_BASE_URL}/linkedin/callback`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        text,
        Visibility: visibility // Match the struct field capitalization
      }),
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

export {
  startLinkedInAuth,
  getLinkedInToken,
  shareLinkedInPost
};
