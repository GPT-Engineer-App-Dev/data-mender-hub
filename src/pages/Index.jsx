import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const parseCsv = (csvString) => {
  const rows = csvString.split('\n');
  return rows.map(row => row.split(','));
};

const stringifyCsv = (data) => {
  return data.map(row => row.join(',')).join('\n');
};

const Index = () => {
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();

  const { data: csvData, isLoading } = useQuery({
    queryKey: ['csvData'],
    queryFn: async () => {
      if (!file) return [];
      const text = await file.text();
      return parseCsv(text);
    },
    enabled: !!file,
  });

  const updateCsvMutation = useMutation({
    mutationFn: (newData) => {
      queryClient.setQueryData(['csvData'], newData);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success('CSV data updated');
    },
  });

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleCellEdit = (rowIndex, colIndex, value) => {
    const newData = [...csvData];
    newData[rowIndex][colIndex] = value;
    updateCsvMutation.mutate(newData);
  };

  const handleAddRow = () => {
    const newData = [...csvData, Array(csvData[0]?.length).fill('')];
    updateCsvMutation.mutate(newData);
  };

  const handleDeleteRow = (rowIndex) => {
    const newData = csvData.filter((_, index) => index !== rowIndex);
    updateCsvMutation.mutate(newData);
  };

  const handleDownload = () => {
    if (!csvData) return;
    const csvString = stringifyCsv(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'edited_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">CSV Editor Tool</h1>
      <Input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-4"
      />
      {isLoading ? (
        <p>Loading CSV data...</p>
      ) : csvData ? (
        <>
          <Table className="mb-4">
            <Table.Header>
              <Table.Row>
                {csvData[0]?.map((header, index) => (
                  <Table.Head key={index}>{header}</Table.Head>
                ))}
                <Table.Head>Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {csvData.slice(1).map((row, rowIndex) => (
                <Table.Row key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <Table.Cell key={cellIndex}>
                      <Input
                        value={cell}
                        onChange={(e) => handleCellEdit(rowIndex + 1, cellIndex, e.target.value)}
                      />
                    </Table.Cell>
                  ))}
                  <Table.Cell>
                    <Button variant="destructive" onClick={() => handleDeleteRow(rowIndex + 1)}>
                      Delete
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <div className="flex justify-between mb-4">
            <Button onClick={handleAddRow}>Add Row</Button>
            <Button onClick={handleDownload}>Download CSV</Button>
          </div>
        </>
      ) : (
        <p>Please upload a CSV file to begin editing.</p>
      )}
    </div>
  );
};

export default Index;
