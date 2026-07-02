import { describe, expect, it } from "vitest";

// Guess pronoun logic from name
function profilePronoun(name: string): "anh" | "chị" | "bạn" {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("văn") || lowerName.includes("cường") || lowerName.includes("nam") || lowerName.includes("phong") || lowerName.includes("hoàng") || lowerName.includes("đăng")) {
    return "anh";
  } else if (lowerName.includes("thị") || lowerName.includes("mai") || lowerName.includes("lan") || lowerName.includes("vy") || lowerName.includes("hương") || lowerName.includes("ngọc")) {
    return "chị";
  }
  return "bạn";
}

// Determine chat tone style from first message
function profileChatStyle(message: string): { chatStyle: string; classification: string; currentEmotion: string } {
  const lowerMsg = message.toLowerCase();
  let chatStyle = "Trực diện ⚡";
  let classification = "Khách thường";
  let currentEmotion = "Bình thường";

  if (lowerMsg.includes("dạ") || lowerMsg.includes("ạ") || lowerMsg.includes("làm ơn") || lowerMsg.includes("cảm ơn") || lowerMsg.includes("shop ơi")) {
    chatStyle = "Lịch sự 🌸";
  } else if (lowerMsg.includes("lỗi") || lowerMsg.includes("hỏng") || lowerMsg.includes("rách") || lowerMsg.includes("gấp") || lowerMsg.includes("tại sao") || lowerMsg.includes("đền tiền")) {
    chatStyle = "Nóng vội 🔔";
    classification = "Khách khó tính";
    currentEmotion = "Lo lắng";
  }

  return { chatStyle, classification, currentEmotion };
}

describe("CSKH AI Onboarding Profiler & Chat Tone Tests", () => {
  it("profiles pronouns correctly based on typical Vietnamese names", () => {
    expect(profilePronoun("Nguyễn Văn Nam")).toBe("anh");
    expect(profilePronoun("Lê Thị Mai")).toBe("chị");
    expect(profilePronoun("Trần Alex")).toBe("bạn");
  });

  it("profiles tone style and detects impatients / complains correctly", () => {
    // Polite tone
    const polite = profileChatStyle("Dạ shop ơi tư vấn mẫu ví da nam ạ");
    expect(polite.chatStyle).toBe("Lịch sự 🌸");
    expect(polite.classification).toBe("Khách thường");
    expect(polite.currentEmotion).toBe("Bình thường");

    // Complaining / Urgent tone
    const urgent = profileChatStyle("Ví bị hỏng khóa rồi, giải quyết gấp cho tôi!");
    expect(urgent.chatStyle).toBe("Nóng vội 🔔");
    expect(urgent.classification).toBe("Khách khó tính");
    expect(urgent.currentEmotion).toBe("Lo lắng");

    // Casual/direct tone
    const casual = profileChatStyle("Ví da nam giá bao nhiêu?");
    expect(casual.chatStyle).toBe("Trực diện ⚡");
  });
});
