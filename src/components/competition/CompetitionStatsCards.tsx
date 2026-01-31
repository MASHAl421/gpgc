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
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {/* Total Tests */}
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-3 sm:p-4 flex items-center justify-center">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <div className="text-center">
              <p className="text-[10px] sm:text-sm text-muted-foreground">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-primary">{totalTests}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Tests */}
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="p-3 sm:p-4 flex items-center justify-center">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
            <div className="text-center">
              <p className="text-[10px] sm:text-sm text-muted-foreground">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-destructive">{pendingTests}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taken Tests */}
      <Card className="bg-muted border-border">
        <CardContent className="p-3 sm:p-4 flex items-center justify-center">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            <div className="text-center">
              <p className="text-[10px] sm:text-sm text-muted-foreground">Taken</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{takenTests}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
