"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Download, Upload, RefreshCw, CheckCircle2, AlertCircle, FileJson, Loader2 } from "lucide-react";

interface TableMetadata {
  id: string;
  label: string;
  rowsCount: number;
}

export function ExportImportSection() {
  const [tables, setTables] = useState<TableMetadata[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    setIsLoadingMetadata(true);
    try {
      const res = await fetch("/api/admin/db-export-import");
      const data = await res.json();
      if (data.success) {
        setTables(data.tables);
        // Select all tables by default
        setSelectedTables(data.tables.map((t: TableMetadata) => t.id));
      } else {
        setMessage({ type: "error", text: data.error || "Failed to load table information." });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Connection error fetching table metadata." });
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleSelectTable = (tableId: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTables.length === tables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(tables.map((t) => t.id));
    }
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      setMessage({ type: "error", text: "Please select at least one table to export." });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/db-export-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export", tables: selectedTables }),
      });

      if (!res.ok) {
        throw new Error("Export failed on server.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateString = new Date().toISOString().split("T")[0];
      a.download = `tempnow-db-backup-${dateString}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Export completed successfully. Backup downloaded." });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to export data." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.version || !json.data || typeof json.data !== "object") {
          throw new Error("Invalid backup format. Missing 'version' or 'data' field.");
        }
        setImportPreview(json);
      } catch (err: any) {
        setMessage({ type: "error", text: `Invalid backup file: ${err.message}` });
        setImportFile(null);
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importPreview) {
      setMessage({ type: "error", text: "Please upload a valid backup JSON file first." });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/db-export-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", payload: importPreview }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setImportFile(null);
        setImportPreview(null);
        // Refresh rowsCount metadata
        fetchMetadata();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to import data." });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to import database backup." });
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Database Export/Import</h1>
        <p className="text-gray-600 mt-1">Export database tables as a JSON file or import a previously exported backup.</p>
      </div>

      {message && (
        <Alert variant={message.type === "success" ? "default" : "destructive"} className={message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : ""}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle className="font-semibold">{message.type === "success" ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>

        {/* EXPORT TAB */}
        <TabsContent value="export" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Export Tables</CardTitle>
                <CardDescription>Select the tables you want to backup and download as a JSON file.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchMetadata} disabled={isLoadingMetadata}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMetadata ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingMetadata ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-500">Loading table schema information...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2 pb-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      {selectedTables.length === tables.length ? "Deselect All" : "Select All"}
                    </Button>
                    <span className="text-xs text-gray-500">
                      {selectedTables.length} of {tables.length} tables selected
                    </span>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Table Name</TableHead>
                          <TableHead className="text-right">Record Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tables.map((table) => (
                          <TableRow key={table.id} className="hover:bg-gray-50">
                            <TableCell>
                              <Checkbox
                                id={`select-${table.id}`}
                                checked={selectedTables.includes(table.id)}
                                onCheckedChange={() => handleSelectTable(table.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">
                              <label htmlFor={`select-${table.id}`} className="cursor-pointer">
                                {table.label} <code className="text-xs text-gray-400 bg-gray-100 px-1 py-0.5 rounded ml-2">{table.id}</code>
                              </label>
                            </TableCell>
                            <TableCell className="text-right font-mono text-gray-700">
                              {table.rowsCount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleExport} disabled={isProcessing || selectedTables.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing Export...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export Selected ({selectedTables.length})
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IMPORT TAB */}
        <TabsContent value="import" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Backup</CardTitle>
              <CardDescription>Upload a previously exported JSON backup file. All entries will be upserted (inserted or updated if existing unique keys match).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />

              <div
                onClick={triggerFileSelect}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all duration-200"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="font-semibold text-gray-800">
                  {importFile ? importFile.name : "Click to upload database backup file"}
                </span>
                <span className="text-xs text-gray-500 mt-1">Only .json files are supported</span>
              </div>

              {importPreview && (
                <div className="space-y-4">
                  <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="font-semibold text-amber-800">Important Warning</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      Importing will modify existing records:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Users Table:</strong> Existing emails will be overriden with the backup data.</li>
                        <li><strong>Orders/Quotes Table:</strong> Matching policy numbers will be updated.</li>
                        <li><strong>Other Tables:</strong> Identical primary keys will be updated.</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="border rounded-md overflow-hidden bg-gray-50/50">
                    <div className="bg-gray-100/80 px-4 py-3 border-b flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700 flex items-center">
                        <FileJson className="h-4 w-4 mr-2 text-blue-600" />
                        Backup Preview Details
                      </span>
                      <span className="text-xs text-gray-500">
                        Export Date: {new Date(importPreview.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Table</TableHead>
                          <TableHead className="text-right">Records inside Backup</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.keys(importPreview.data).map((key) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium text-gray-900">{key}</TableCell>
                            <TableCell className="text-right font-mono text-gray-700">
                              {importPreview.data[key]?.length?.toLocaleString() || 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end pt-2 space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImportFile(null);
                        setImportPreview(null);
                      }}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={isProcessing} className="bg-amber-600 hover:bg-amber-700 text-white">
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing Import...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Confirm & Override
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
