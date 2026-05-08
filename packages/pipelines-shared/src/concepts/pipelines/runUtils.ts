type RunWithStateHistory = { created_at: string; state_history?: object[] };

type StateHistoryEntry = { state: unknown; update_time: unknown };

const isValidHistoryEntry = (entry: unknown): entry is StateHistoryEntry =>
  typeof entry === 'object' && entry !== null && 'state' in entry && 'update_time' in entry;

const RUNTIME_STATE_RUNNING = 'RUNNING';

export const getRunStartTime = (run: RunWithStateHistory): Date => {
  const history = run.state_history ?? [];
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (isValidHistoryEntry(entry) && String(entry.state) === RUNTIME_STATE_RUNNING) {
      return new Date(String(entry.update_time));
    }
  }
  return new Date(run.created_at);
};
