import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Files, Upload, X, CheckCircle2, AlertCircle, ArrowLeft, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FileState {
  file: File | null;
  fileName: string;
  fileSize: string;
  status: 'idle' | 'valid' | 'invalid';
  parameterCount?: number;
}

export default function Compare() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [setupA, setSetupA] = useState<FileState>({
    file: null,
    fileName: '',
    fileSize: '',
    status: 'idle',
  });
  const [setupB, setSetupB] = useState<FileState>({
    file: null,
    fileName: '',
    fileSize: '',
    status: 'idle',
  });
  const [carName, setCarName] = useState('');
  const [trackName, setTrackName] = useState('');
  const [isDraggingA, setIsDraggingA] = useState(false);
  const [isDraggingB, setIsDraggingB] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const compareMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await apiRequest("POST", "/api/comparisons/upload", formData);
      return result.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Comparison created",
        description: "Your setup comparison has been analyzed successfully.",
      });
      setLocation(`/comparison/${data.id}`);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create comparison. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (file: File, isSetupA: boolean) => {
    const setState = isSetupA ? setSetupA : setSetupB;
    
    if (!file.name.endsWith('.sto')) {
      setState({
        file: null,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        status: 'invalid',
      });
      toast({
        title: "Invalid file",
        description: "Please upload an iRacing setup file (.sto)",
        variant: "destructive",
      });
      return;
    }

    setState({
      file,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      status: 'valid',
    });
  };

  const handleDrop = (e: React.DragEvent, isSetupA: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSetupA) {
      setIsDraggingA(false);
    } else {
      setIsDraggingB(false);
    }

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file, isSetupA);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent, isSetupA: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSetupA) {
      setIsDraggingA(true);
    } else {
      setIsDraggingB(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, isSetupA: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSetupA) {
      setIsDraggingA(false);
    } else {
      setIsDraggingB(false);
    }
  };

  const handleSubmit = () => {
    if (!setupA.file || !setupB.file) {
      toast({
        title: "Missing files",
        description: "Please upload both setup files.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('setupA', setupA.file);
    formData.append('setupB', setupB.file);
    if (carName) formData.append('carName', carName);
    if (trackName) formData.append('trackName', trackName);

    compareMutation.mutate(formData);
  };

  const clearFile = (isSetupA: boolean) => {
    const setState = isSetupA ? setSetupA : setSetupB;
    setState({
      file: null,
      fileName: '',
      fileSize: '',
      status: 'idle',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild data-testid="button-back">
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <Files className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">SetupComparer</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.profileImageUrl && (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName || "User"}
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <span className="text-sm font-medium hidden sm:inline">
                {user?.firstName || user?.email}
              </span>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild data-testid="button-logout">
              <a href="/api/logout" title="Log out">
                <LogOut className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">New Comparison</h2>
          <p className="text-muted-foreground">Upload two iRacing setup files to compare them</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label className="mb-3 block text-sm font-medium">Setup A (Baseline)</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDraggingA
                  ? 'border-primary bg-primary/5'
                  : setupA.status === 'valid'
                  ? 'border-chart-3 bg-chart-3/5'
                  : setupA.status === 'invalid'
                  ? 'border-destructive bg-destructive/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onDrop={(e) => handleDrop(e, true)}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, true)}
              onDragLeave={(e) => handleDragLeave(e, true)}
              data-testid="dropzone-setup-a"
            >
              {setupA.file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    {setupA.status === 'valid' ? (
                      <CheckCircle2 className="h-12 w-12 text-chart-3" />
                    ) : (
                      <AlertCircle className="h-12 w-12 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium font-mono text-sm mb-1" data-testid="text-filename-a">
                      {setupA.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">{setupA.fileSize}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFile(true)}
                    data-testid="button-clear-a"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium mb-1">Drop setup file here</p>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                    <Input
                      type="file"
                      accept=".sto"
                      className="hidden"
                      id="file-a"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, true);
                      }}
                      data-testid="input-file-setup-a"
                    />
                    <Button variant="secondary" size="sm" asChild>
                      <label htmlFor="file-a" className="cursor-pointer">
                        Browse Files
                      </label>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">iRacing setup files (.sto)</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-3 block text-sm font-medium">Setup B (Comparison)</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDraggingB
                  ? 'border-primary bg-primary/5'
                  : setupB.status === 'valid'
                  ? 'border-chart-3 bg-chart-3/5'
                  : setupB.status === 'invalid'
                  ? 'border-destructive bg-destructive/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onDrop={(e) => handleDrop(e, false)}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, false)}
              onDragLeave={(e) => handleDragLeave(e, false)}
              data-testid="dropzone-setup-b"
            >
              {setupB.file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    {setupB.status === 'valid' ? (
                      <CheckCircle2 className="h-12 w-12 text-chart-3" />
                    ) : (
                      <AlertCircle className="h-12 w-12 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium font-mono text-sm mb-1" data-testid="text-filename-b">
                      {setupB.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">{setupB.fileSize}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFile(false)}
                    data-testid="button-clear-b"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium mb-1">Drop setup file here</p>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                    <Input
                      type="file"
                      accept=".sto"
                      className="hidden"
                      id="file-b"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, false);
                      }}
                      data-testid="input-file-setup-b"
                    />
                    <Button variant="secondary" size="sm" asChild>
                      <label htmlFor="file-b" className="cursor-pointer">
                        Browse Files
                      </label>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">iRacing setup files (.sto)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Optional details to help organize your comparison</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="car-name" className="mb-2 block">Car Name</Label>
              <Input
                id="car-name"
                placeholder="e.g., BMW M4 GT3"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                data-testid="input-car-name"
              />
            </div>
            <div>
              <Label htmlFor="track-name" className="mb-2 block">Track Name</Label>
              <Input
                id="track-name"
                placeholder="e.g., Spa-Francorchamps"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                data-testid="input-track-name"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild data-testid="button-cancel">
            <Link href="/">Cancel</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!setupA.file || !setupB.file || compareMutation.isPending}
            data-testid="button-compare"
          >
            {compareMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Files className="h-4 w-4 mr-2" />
                Compare Setups
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
