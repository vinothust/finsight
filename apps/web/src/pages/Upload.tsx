import { useState } from 'react';
import { toast } from 'sonner';
import { FileSpreadsheet, UploadCloud } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { uploadService } from '@/services/uploadService';
import type { PreviewResponse } from '@/services/uploadService';

type Dataset = 'financial' | 'utilization';

const FINANCIAL_COLUMNS: { key: string; label: string }[] = [
  { key: 'project_id', label: 'Project ID' },
  { key: 'period', label: 'Period' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'cost', label: 'Cost' },
];

const UTILIZATION_COLUMNS: { key: string; label: string }[] = [
  { key: 'project_id', label: 'Project ID' },
  { key: 'resource_name', label: 'Resource' },
  { key: 'period', label: 'Period' },
  { key: 'allocation_pct', label: 'Allocation %' },
  { key: 'on_bench', label: 'On Bench' },
];

const Upload = () => {
  const [dataset, setDataset] = useState<Dataset>('financial');
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const columns = dataset === 'financial' ? FINANCIAL_COLUMNS : UTILIZATION_COLUMNS;

  const handleDatasetChange = (value: string) => {
    setDataset(value as Dataset);
    setPreview(null);
  };

  const handleFileSelected = async (file: File) => {
    setIsPreviewing(true);
    setPreview(null);
    try {
      const result = await uploadService.previewUpload(dataset, file);
      setPreview(result);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} row(s) had errors`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to preview file');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    setIsCommitting(true);
    try {
      const result = await uploadService.commitUpload(preview.upload_id);
      toast.success(`${result.rows_inserted} row(s) committed`);
      setPreview(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to commit upload');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-display font-bold mb-6">Upload Data</h1>

      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Upload File</CardTitle>
            <CardDescription>Select a dataset type, then choose a file to preview before committing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={dataset} onValueChange={handleDatasetChange}>
              <TabsList>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="utilization">Utilization</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="border-2 border-dashed rounded-xl p-8 text-center">
              <label htmlFor="upload-file-input" className="cursor-pointer">
                <UploadCloud size={32} className="mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Choose file to upload (.xlsx, .xls, .csv)</p>
              </label>
              <input
                id="upload-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                aria-label="Choose file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                  e.target.value = '';
                }}
              />
            </div>

            {isPreviewing && <p className="text-sm text-muted-foreground">Parsing file...</p>}

            {preview && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {preview.row_count > 20
                    ? `Showing 20 of ${preview.row_count} rows`
                    : `${preview.row_count} row(s) parsed`}
                </p>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map((col) => (
                          <TableHead key={col.key}>{col.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.preview.map((row, idx) => (
                        <TableRow key={idx}>
                          {columns.map((col) => (
                            <TableCell key={col.key}>{String(row[col.key] ?? '-')}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {preview.errors.length > 0 && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 space-y-1">
                    {preview.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-destructive">
                        Row {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                )}

                <Button onClick={handleCommit} disabled={isCommitting}>
                  Commit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Need a Template?</CardTitle>
            <CardDescription>Download the standard template to ensure your data is formatted correctly.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" className="gap-2" onClick={() => uploadService.downloadTemplate('pnl')}>
              <FileSpreadsheet size={18} />
              Download P&L Template
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => uploadService.downloadTemplate('utilization')}>
              <FileSpreadsheet size={18} />
              Download Utilization Template
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Upload;
