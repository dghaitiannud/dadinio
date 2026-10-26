import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VideoUploader({ onUploadSuccess, token }: { onUploadSuccess: (url: string) => void, token: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");

  const onDrop = useCallback((acceptedFiles: File[]) => setFile(acceptedFiles[0]), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, accept: { "video/mp4": [".mp4"] }, multiple: false 
  });

  const handleUpload = async () => {
    if (!file) return;

    const jobId = crypto.randomUUID(); 
    setStatus("uploading");
    setProgress(0);
    setMessage("Connexion au serveur...");

    const es = new EventSource(`https://api.haitiannud.com/api/upload-progress/${jobId}?token=${token}`);

    es.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      setProgress(data.percent);
      setMessage(data.message);
      if (data.step === "transcode" || data.step === "upload") setStatus("processing");
    });

    es.addEventListener("complete", (e) => {
      const data = JSON.parse(e.data);
      setStatus("done");
      es.close();
      setTimeout(() => onUploadSuccess(data.url), 1500);
    });

    es.addEventListener("error", (e: any) => {
      if (e.data) {
        setMessage(JSON.parse(e.data).message);
        setStatus("error");
        es.close();
      }
    });

    const formData = new FormData();
    formData.append("video", file);
    formData.append("filename", file.name.replace(".mp4", ""));
    formData.append("jobId", jobId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.haitiannud.com/api/upload-video");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(Math.round(pct * 0.1)); 
        setMessage(`Envoi du fichier... (${pct}%)`);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        setStatus("processing");
        setMessage("Fichier reçu, transcodage en cours...");
      } else {
        setStatus("error");
        setMessage("Erreur d'upload (Session invalide)");
      }
    };
    xhr.send(formData);
  };

  return (
    <div className="py-4">
      {status === "idle" && !file && (
        <div {...getRootProps()} className="border-2 border-dashed border-zinc-600 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition">
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-10 w-10 text-zinc-400 mb-3" />
          <p className="text-sm text-zinc-300">{isDragActive ? "Déposez le MP4 ici..." : "Glissez un MP4 ou cliquez"}</p>
        </div>
      )}

      {file && status === "idle" && (
        <div className="text-center bg-muted/30 p-4 rounded-xl border border-border">
          <p className="text-sm mb-4">Fichier : <span className="text-primary font-mono">{file.name}</span></p>
          <Button onClick={handleUpload} className="w-full">Lancer la conversion HLS</Button>
          <Button variant="ghost" onClick={() => setFile(null)} className="mt-2 text-xs w-full">Annuler</Button>
        </div>
      )}

      {(status === "uploading" || status === "processing") && (
        <div className="text-center p-4 bg-muted/30 rounded-xl border border-border">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium mb-3">{message}</p>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-right text-xs text-primary mt-1 font-mono">{progress}%</p>
        </div>
      )}

      {status === "done" && (
        <div className="text-center p-4 text-green-500">
          <CheckCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-bold">Vidéo prête !</p>
        </div>
      )}

      {status === "error" && (
        <div className="text-center p-4 text-destructive">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-bold">{message}</p>
          <Button variant="outline" size="sm" onClick={() => setStatus("idle")} className="mt-2">Réessayer</Button>
        </div>
      )}
    </div>
  );
}