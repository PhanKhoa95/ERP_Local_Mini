import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mic, MicOff, Loader2, Square, Volume2, 
  CheckCircle2, Clock, AlertTriangle, RotateCcw,
  Lightbulb, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ParsedTask {
  project_code?: string;
  project_name?: string;
  task: string;
  type: "completed" | "pending" | "blocker";
}

interface VoiceReportRecorderProps {
  projects?: { id: string; code: string; name: string }[];
  onTasksParsed: (tasks: ParsedTask[]) => void;
  onTranscriptUpdate?: (transcript: string) => void;
}

type RecordingStatus = "idle" | "recording" | "processing" | "error";

// Check if Web Speech API is supported
const SpeechRecognition = 
  (window as any).SpeechRecognition || 
  (window as any).webkitSpeechRecognition;

const EXAMPLE_PHRASES = [
  {
    text: "Hôm nay mình hoàn thành task thiết kế UI cho trang chủ",
    result: "completed"
  },
  {
    text: "Đang làm dở tính năng đăng nhập, chưa xong",
    result: "pending"
  },
  {
    text: "Bị chờ API từ team backend nên chưa test được",
    result: "blocker"
  },
  {
    text: "Xong việc review code, đang code thêm unit test",
    result: "mixed"
  }
];

const TIPS = [
  "Nói rõ ràng, tốc độ vừa phải",
  "Dùng từ khóa: 'xong', 'hoàn thành', 'đang làm', 'chờ', 'block'",
  "Có thể nói nhiều công việc cách nhau bằng 'và' hoặc tạm dừng",
  "Đề cập tên dự án nếu có: 'Dự án ABC, đã xong task...'"
];

export function VoiceReportRecorder({ 
  projects, 
  onTasksParsed, 
  onTranscriptUpdate 
}: VoiceReportRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showTips, setShowTips] = useState(true);
  const [parsedPreview, setParsedPreview] = useState<ParsedTask[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isSupported = !!SpeechRecognition;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Recording duration timer
  useEffect(() => {
    if (status === "recording") {
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (status === "idle") {
        setRecordingDuration(0);
      }
    }
    
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [status]);

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio level visualization
  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current || status !== "recording") return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (err) {
      console.error("Audio visualization error:", err);
    }
  };

  const startRecording = async () => {
    if (!isSupported) {
      setErrorMessage("Trình duyệt không hỗ trợ nhận dạng giọng nói");
      setStatus("error");
      return;
    }

    try {
      setStatus("recording");
      setTranscript("");
      setInterimTranscript("");
      setErrorMessage(null);
      setParsedPreview([]);
      setShowTips(false);

      // Start audio visualization
      await startAudioVisualization();

      // Initialize Speech Recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "vi-VN"; // Vietnamese
      recognition.maxAlternatives = 1;
      
      let accumulatedTranscript = "";
      
      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interim = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }
        
        if (finalTranscript) {
          accumulatedTranscript += finalTranscript;
          setTranscript(accumulatedTranscript);
        }
        setInterimTranscript(interim);
        
        // Update parent with current transcript
        const fullText = accumulatedTranscript + interim;
        onTranscriptUpdate?.(fullText);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setErrorMessage("Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt");
        } else if (event.error === "no-speech") {
          // Ignore no-speech errors during continuous recognition
          return;
        } else if (event.error === "audio-capture") {
          setErrorMessage("Không tìm thấy microphone. Kiểm tra thiết bị của bạn.");
        } else if (event.error === "network") {
          setErrorMessage("Lỗi kết nối mạng. Kiểm tra internet của bạn.");
        } else {
          setErrorMessage(`Lỗi nhận dạng: ${event.error}`);
        }
        cleanup();
        setStatus("error");
      };

      recognition.onend = () => {
        // Restart if still in recording mode (for continuous recording)
        if (status === "recording" && recognitionRef.current) {
          try {
            recognition.start();
          } catch (err) {
            // Already started
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      toast.success("Đang ghi âm... Hãy nói báo cáo của bạn");
      
    } catch (err) {
      console.error("Failed to start recording:", err);
      setErrorMessage("Không thể bắt đầu ghi âm. Kiểm tra quyền truy cập microphone.");
      setStatus("error");
      cleanup();
    }
  };

  const stopRecording = async () => {
    cleanup();
    
    const fullTranscript = transcript + interimTranscript;
    if (!fullTranscript.trim()) {
      setStatus("idle");
      toast.info("Không nhận được giọng nói. Hãy thử lại.");
      return;
    }

    setStatus("processing");
    
    try {
      // Parse transcript using AI
      const { data, error } = await supabase.functions.invoke("parse-voice-report", {
        body: {
          transcript: fullTranscript,
          projects: projects || [],
        }
      });

      if (error) throw error;

      if (data.tasks && data.tasks.length > 0) {
        setParsedPreview(data.tasks);
        onTasksParsed(data.tasks);
        toast.success(`Đã nhận ${data.tasks.length} công việc từ giọng nói`);
      } else {
        toast.info("Không nhận dạng được công việc cụ thể. Hãy thử nói rõ hơn.");
      }

      setStatus("idle");
    } catch (err) {
      console.error("Parse error:", err);
      
      // Fallback: treat entire transcript as one task
      const fallbackTask: ParsedTask = {
        task: fullTranscript.trim(),
        type: fullTranscript.toLowerCase().includes("xong") ? "completed" : "pending"
      };
      setParsedPreview([fallbackTask]);
      onTasksParsed([fallbackTask]);
      toast.info("Đã ghi nhận báo cáo (xử lý cơ bản)");
      setStatus("idle");
    }
  };

  const resetRecorder = () => {
    setTranscript("");
    setInterimTranscript("");
    setParsedPreview([]);
    setErrorMessage(null);
    setStatus("idle");
    setShowTips(true);
  };

  const displayTranscript = transcript + interimTranscript;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Báo cáo bằng giọng nói
        </CardTitle>
        <CardDescription>
          Nói tự nhiên về công việc hôm nay, AI sẽ tự động phân loại
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tips section */}
        <Collapsible open={showTips} onOpenChange={setShowTips}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Mẹo sử dụng
              </span>
              {showTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3">
            {/* Tips */}
            <div className="bg-muted/50 rounded-lg p-3">
              <ul className="text-xs text-muted-foreground space-y-1">
                {TIPS.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Example phrases */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Ví dụ:</p>
              <div className="grid gap-2">
                {EXAMPLE_PHRASES.slice(0, 2).map((example, idx) => (
                  <div key={idx} className="bg-muted/30 rounded p-2 text-xs">
                    <p className="italic">"{example.text}"</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {example.result === "completed" && "✓ Hoàn thành"}
                      {example.result === "pending" && "⏳ Đang làm"}
                      {example.result === "blocker" && "⚠ Blocker"}
                      {example.result === "mixed" && "🔀 Nhiều loại"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Main recording area */}
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Status indicator */}
          <div className="flex items-center gap-2 min-h-[24px]">
            {status === "recording" && (
              <Badge variant="destructive" className="animate-pulse gap-1">
                <Volume2 className="h-3 w-3" />
                Đang ghi âm • {formatDuration(recordingDuration)}
              </Badge>
            )}
            {status === "processing" && (
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang phân tích...
              </Badge>
            )}
            {status === "error" && (
              <Badge variant="destructive">Lỗi</Badge>
            )}
          </div>

          {/* Microphone button with audio visualization */}
          <div className="relative">
            {/* Audio level rings */}
            {status === "recording" && (
              <>
                <div 
                  className="absolute inset-0 rounded-full bg-destructive/20 animate-ping"
                  style={{ 
                    transform: `scale(${1 + audioLevel * 0.5})`,
                    opacity: 0.3 + audioLevel * 0.5
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-full bg-destructive/10"
                  style={{ 
                    transform: `scale(${1.2 + audioLevel * 0.8})`,
                    transition: "transform 0.1s"
                  }}
                />
              </>
            )}
            
            <Button
              size="lg"
              variant={status === "recording" ? "destructive" : "default"}
              className={cn(
                "w-24 h-24 rounded-full transition-all relative z-10 shadow-lg",
                status === "recording" && "ring-4 ring-destructive/30",
                status === "processing" && "opacity-70"
              )}
              onClick={status === "recording" ? stopRecording : startRecording}
              disabled={status === "processing" || !isSupported}
            >
              {status === "idle" && <Mic className="h-10 w-10" />}
              {status === "recording" && <Square className="h-8 w-8" />}
              {status === "processing" && <Loader2 className="h-10 w-10 animate-spin" />}
              {status === "error" && <MicOff className="h-10 w-10" />}
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center space-y-1 max-w-xs">
            {!isSupported && (
              <p className="text-sm text-destructive">
                Trình duyệt không hỗ trợ. Vui lòng dùng Chrome hoặc Edge.
              </p>
            )}
            {status === "idle" && isSupported && !displayTranscript && (
              <p className="text-sm text-muted-foreground">
                Nhấn nút để bắt đầu nói
              </p>
            )}
            {status === "recording" && (
              <p className="text-sm text-muted-foreground">
                Đang nghe... Nhấn để dừng và phân tích
              </p>
            )}
            {status === "processing" && (
              <p className="text-sm text-muted-foreground">
                AI đang xử lý giọng nói của bạn
              </p>
            )}
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
          </div>
        </div>

        {/* Live transcript */}
        {displayTranscript && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Nội dung nhận dạng:
              </p>
              {status === "idle" && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 gap-1"
                  onClick={resetRecorder}
                >
                  <RotateCcw className="h-3 w-3" />
                  Làm lại
                </Button>
              )}
            </div>
            <p className="text-sm leading-relaxed">
              {transcript}
              <span className="text-muted-foreground italic">{interimTranscript}</span>
            </p>
          </div>
        )}

        {/* Parsed preview */}
        {parsedPreview.length > 0 && status === "idle" && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Đã nhận dạng {parsedPreview.length} công việc:
            </p>
            <div className="space-y-1.5">
              {parsedPreview.map((task, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded bg-muted/30 text-sm"
                >
                  {task.type === "completed" && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  )}
                  {task.type === "pending" && (
                    <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  {task.type === "blocker" && (
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="break-words">{task.task}</span>
                    {task.project_code && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {task.project_code}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
