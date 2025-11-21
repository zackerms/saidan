import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PreviewTableProps {
  headers: string[]
  rows: string[][]
  maxRows?: number
}

export function PreviewTable({ headers, rows, maxRows = 10 }: PreviewTableProps) {
  const displayRows = rows.slice(0, maxRows)

  return (
    <Card>
      <CardHeader>
        <CardTitle>プレビュー（最初の{maxRows}行）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={index}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {rows.length > maxRows && (
          <p className="mt-4 text-sm text-muted-foreground">
            他 {rows.length - maxRows} 行が非表示です
          </p>
        )}
      </CardContent>
    </Card>
  )
}

