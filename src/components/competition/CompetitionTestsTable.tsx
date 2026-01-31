import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Play, Eye, Clock } from 'lucide-react';

interface CompetitionAttempt {
  competition_id: string;
  completed_at: string | null;
  score: number | null;
  total_questions: number | null;
}

interface Competition {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  competition_type: string;
  semester: number | null;
  is_active: boolean;
}

interface CompetitionTestsTableProps {
  competitions: Competition[];
  attempts: CompetitionAttempt[];
  onStartTest: (competitionId: string) => void;
  onViewResult: (competitionId: string) => void;
}

export const CompetitionTestsTable = ({
  competitions,
  attempts,
  onStartTest,
  onViewResult,
}: CompetitionTestsTableProps) => {
  const getAttemptForCompetition = (competitionId: string) => {
    return attempts.find((a) => a.competition_id === competitionId);
  };

  const getCompetitionStatus = (comp: Competition) => {
    const now = new Date();
    const start = new Date(comp.start_time);
    const end = new Date(comp.end_time);

    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'live';
  };

  const getResultBadge = (attempt: CompetitionAttempt | undefined, status: string) => {
    if (!attempt) {
      if (status === 'upcoming') {
        return <Badge variant="secondary">Not Started</Badge>;
      }
      if (status === 'completed') {
        return <Badge variant="outline">Missed</Badge>;
      }
      return <Badge variant="secondary">Not Attempted</Badge>;
    }

    const score = attempt.score || 0;
    const total = attempt.total_questions || 1;
    const percentage = Math.round((score / total) * 100);

    if (percentage >= 80) {
      return <Badge className="bg-primary">{score}/{total} ({percentage}%)</Badge>;
    } else if (percentage >= 50) {
      return <Badge variant="secondary">{score}/{total} ({percentage}%)</Badge>;
    } else {
      return <Badge variant="destructive">{score}/{total} ({percentage}%)</Badge>;
    }
  };

  if (competitions.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No tests available at the moment.</p>
        <p className="text-sm text-muted-foreground mt-2">Check back later for upcoming competitions!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="text-primary-foreground font-semibold">Test Name</TableHead>
            <TableHead className="text-primary-foreground font-semibold">Opening Date</TableHead>
            <TableHead className="text-primary-foreground font-semibold">Closing Date</TableHead>
            <TableHead className="text-primary-foreground font-semibold">Date Attempt</TableHead>
            <TableHead className="text-primary-foreground font-semibold">Result</TableHead>
            <TableHead className="text-primary-foreground font-semibold text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitions.map((comp, index) => {
            const attempt = getAttemptForCompetition(comp.id);
            const status = getCompetitionStatus(comp);
            const isEven = index % 2 === 0;

            return (
              <TableRow key={comp.id} className={isEven ? 'bg-background' : 'bg-muted/30'}>
                <TableCell className="font-medium text-foreground">
                  {comp.title}
                  {comp.semester && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Sem {comp.semester}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(comp.start_time), 'dd-MM-yyyy')}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(comp.end_time), 'dd-MM-yyyy')}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {attempt?.completed_at
                    ? format(new Date(attempt.completed_at), 'dd-MM-yyyy')
                    : '-'}
                </TableCell>
                <TableCell>{getResultBadge(attempt, status)}</TableCell>
                <TableCell className="text-center">
                  {attempt ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewResult(comp.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  ) : status === 'live' ? (
                    <Button size="sm" onClick={() => onStartTest(comp.id)}>
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  ) : status === 'upcoming' ? (
                    <Button size="sm" variant="secondary" disabled>
                      <Clock className="h-4 w-4 mr-1" />
                      Soon
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Closed
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
