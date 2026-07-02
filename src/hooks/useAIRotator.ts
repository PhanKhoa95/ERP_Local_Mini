import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

export interface AIProvider {
  id: string;
  name: string;
  enabled: boolean;
  keys: string[];
  activeKeyIndex: number;
  models: string[];
  selectedModel: string;
  baseUrl: string;
}

const STORAGE_KEY = "erp-mini-ai-rotator-settings-v1";

const DEFAULT_PROVIDERS: AIProvider[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    enabled: true,
    keys: ["", "", "", "", ""],
    activeKeyIndex: 0,
    models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-1.5-pro"],
    selectedModel: "gemini-2.5-flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai"
  },
  {
    id: "openai",
    name: "OpenAI GPT",
    enabled: false,
    keys: ["", "", "", "", ""],
    activeKeyIndex: 0,
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    selectedModel: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1"
  },
  {
    id: "deepseek",
    name: "DeepSeek AI",
    enabled: false,
    keys: ["", "", "", "", ""],
    activeKeyIndex: 0,
    models: ["deepseek-chat", "deepseek-reasoner", "deepseek/deepseek-chat"],
    selectedModel: "deepseek-chat",
    baseUrl: "https://api.deepseek.com/v1"
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    enabled: false,
    keys: ["", "", "", "", ""],
    activeKeyIndex: 0,
    models: ["anthropic/claude-3.5-sonnet", "claude-3-5-sonnet-20241022"],
    selectedModel: "anthropic/claude-3.5-sonnet",
    baseUrl: "https://openrouter.ai/api/v1"
  },
  {
    id: "openrouter",
    name: "OpenRouter (Tổng hợp)",
    enabled: false,
    keys: ["", "", "", "", ""],
    activeKeyIndex: 0,
    models: ["google/gemini-2.5-flash", "openai/gpt-4o-mini", "deepseek/deepseek-chat", "anthropic/claude-3.5-sonnet"],
    selectedModel: "google/gemini-2.5-flash",
    baseUrl: "https://openrouter.ai/api/v1"
  },
  {
    id: "ollama",
    name: "Ollama (Local & Cloud)",
    enabled: false,
    keys: ["", "", "", "", ""],
    activeKeyIndex: 0,
    models: ["deepseek-r1:7b", "deepseek-r1:1.5b", "llama3.2", "llama3.1", "qwen2.5-coder", "mistral"],
    selectedModel: "deepseek-r1:7b",
    baseUrl: "http://localhost:11434/v1"
  }
];

export function useAIRotator() {
  const [providers, setProviders] = useState<AIProvider[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AIProvider[];
        // Backfill Ollama provider if missing from localStorage
        if (!parsed.some(p => p.id === "ollama")) {
          parsed.push({
            id: "ollama",
            name: "Ollama (Local & Cloud)",
            enabled: false,
            keys: ["", "", "", "", ""],
            activeKeyIndex: 0,
            models: ["deepseek-r1:7b", "deepseek-r1:1.5b", "llama3.2", "llama3.1", "qwen2.5-coder", "mistral"],
            selectedModel: "deepseek-r1:7b",
            baseUrl: "http://localhost:11434/v1"
          });
        }
        // Migrate Gemini base URL if still pointing to OpenRouter
        return parsed.map(p => {
          if (p.id === "gemini" && (p.baseUrl === "https://openrouter.ai/api/v1" || p.selectedModel.startsWith("google/"))) {
            return {
              ...p,
              baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
              models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-1.5-pro"],
              selectedModel: p.selectedModel.includes("google/") ? p.selectedModel.replace("google/", "") : "gemini-2.5-flash"
            };
          }
          return p;
        });
      } catch (e) {
        console.error("Failed to parse AI rotator settings:", e);
      }
    }
    return DEFAULT_PROVIDERS;
  });

  const [activeProviderId, setActiveProviderId] = useState<string>(() => {
    const storedActive = localStorage.getItem(STORAGE_KEY + "-active-id");
    if (storedActive) return storedActive;
    return "gemini";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
  }, [providers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + "-active-id", activeProviderId);
  }, [activeProviderId]);

  const updateProviderKeys = useCallback((providerId: string, keys: string[]) => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        // Guarantee exactly 5 slots
        const newKeys = [...keys];
        while (newKeys.length < 5) newKeys.push("");
        return { ...p, keys: newKeys.slice(0, 5) };
      }
      return p;
    }));
  }, []);

  const updateProviderModel = useCallback((providerId: string, model: string) => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        return { ...p, selectedModel: model };
      }
      return p;
    }));
  }, []);

  const updateProviderBaseUrl = useCallback((providerId: string, baseUrl: string) => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        return { ...p, baseUrl };
      }
      return p;
    }));
  }, []);

  const toggleProvider = useCallback((providerId: string, enabled: boolean) => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        return { ...p, enabled };
      }
      return p;
    }));
  }, []);

  // Function to rotate keys when one fails or expires
  const rotateActiveKey = useCallback((providerId: string) => {
    let nextIndex = 0;
    let rotated = false;
    
    setProviders(prev => {
      return prev.map(p => {
        if (p.id === providerId) {
          const validKeys = p.keys.filter(k => k.trim().length > 0);
          if (validKeys.length <= 1) {
            // No other keys to rotate to
            return p;
          }
          
          let targetIndex = p.activeKeyIndex;
          let attempts = 0;
          
          // Loop up to 5 times to find a non-empty key slot that is different
          do {
            targetIndex = (targetIndex + 1) % 5;
            attempts++;
          } while (!p.keys[targetIndex] && attempts < 5);
          
          if (p.keys[targetIndex] && targetIndex !== p.activeKeyIndex) {
            nextIndex = targetIndex;
            rotated = true;
            return { ...p, activeKeyIndex: targetIndex };
          }
        }
        return p;
      });
    });

    if (rotated) {
      toast.warning(`API Key lỗi/hết hạn. Tự động xoay sang Key dự phòng #${nextIndex + 1} của nhà cung cấp.`);
      return true;
    }
    return false;
  }, []);

  // Switch to next enabled provider
  const rotateToNextProvider = useCallback(() => {
    const enabledProviders = providers.filter(p => p.enabled);
    if (enabledProviders.length <= 1) {
      toast.error("Không có nhà cung cấp dự phòng nào được bật. Vui lòng kiểm tra lại cấu hình AI.");
      return false;
    }

    const currentIndex = enabledProviders.findIndex(p => p.id === activeProviderId);
    const nextProvider = enabledProviders[(currentIndex + 1) % enabledProviders.length];
    
    if (nextProvider) {
      setActiveProviderId(nextProvider.id);
      toast.success(`Đã cạn kiệt key của nhà cung cấp hiện tại. Tự động chuyển vùng sang ${nextProvider.name} (Model: ${nextProvider.selectedModel})`);
      return true;
    }
    return false;
  }, [providers, activeProviderId]);

  // Read active connection config to send to edge function
  const activeConfig = useMemo(() => {
    const current = providers.find(p => p.id === activeProviderId) || providers[0];
    const key = current.keys[current.activeKeyIndex] || "";
    
    return {
      provider: current.id,
      model: current.selectedModel,
      apiKey: key,
      baseUrl: current.baseUrl
    };
  }, [providers, activeProviderId]);

  return {
    providers,
    activeProviderId,
    setActiveProviderId,
    activeConfig,
    updateProviderKeys,
    updateProviderModel,
    updateProviderBaseUrl,
    toggleProvider,
    rotateActiveKey,
    rotateToNextProvider
  };
}
