import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, CheckCircle } from 'lucide-react';

interface CompetitionStatsCardsProps {
  totalTests: number;
  pendingTests: number;
  takenTests: number;
}

export const CompetitionStatsCards = ({
  totalTests,
  pendingTests,
  takenTests,
}: CompetitionStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Tests */}
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-4 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Tests</p>
              <p className="text-2xl font-bold text-primary">{totalTests}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Tests */}
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="p-4 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-destructive" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Pending Tests</p>
              <p className="text-2xl font-bold text-destructive">{pendingTests}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taken Tests */}
      <Card className="bg-muted border-border">
        <CardContent className="p-4 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Taken Tests</p>
              <p className="text-2xl font-bold text-foreground">{takenTests}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
