const ICON = {
  pending: '○',
  active: '◉',
  completed: '✓',
  failed: '✕',
  skipped: '–',
}

const STEPS = [
  ['TAKEOFF', 'Takeoff'],
  ['TRAVEL', 'Travel to destination'],
  ['DELIVERY', 'Complete delivery'],
  ['RETURN_HOME', 'Return to base'],
]

function statusForStep(stepType, signals, missionStatus) {
  const signal = signals
    .filter((item) => item.signalType?.toUpperCase() === stepType)
    .at(-1)
  const signalStatus = signal?.signalStatus?.toUpperCase()

  if (signalStatus === 'COMPLETED') return 'completed'
  if (signalStatus === 'IN_PROGRESS' || signalStatus === 'RETRYING') {
    if (
      missionStatus === 'FAILED' &&
      signals.some((item) =>
        item.signalType?.toUpperCase() === 'MISSION' &&
        item.signalStatus?.toUpperCase() === 'FAILED',
      )
    ) {
      return 'failed'
    }
    return 'active'
  }
  if (signalStatus === 'FAILED') return 'failed'
  return 'pending'
}

function Node({ label, status }) {
  return (
    <div className={`dag-node ${status}`}>
      <span className="dag-ic">{ICON[status]}</span>
      <span>{label}</span>
    </div>
  )
}

export default function MissionDag({ mission, signals = [], onExecute, busy }) {
  const status = mission?.status?.toUpperCase() || 'NO MISSION'
  const missionSignals = signals
    .filter((signal) => String(signal.missionId) === String(mission?.id))
    .sort((a, b) => Number(a.id) - Number(b.id))
  const latestSignal = missionSignals.at(-1)

  return (
    <section>
      <div className="row">
        <h3>Mission workflow</h3>
        <span className={`wf-badge ${status}`}>{status}</span>
      </div>
      <div className="tiny wf-sub">
        {mission ? `${mission.missionName} · ${mission.destination}` : 'No mission assigned to this drone'}
      </div>

      {mission && (
        <>
          <div className="dag">
            {STEPS.map(([id, label], index) => (
              <div key={id}>
                <Node label={label} status={statusForStep(id, missionSignals, status)} />
                {index < STEPS.length - 1 && <div className="dag-link" />}
              </div>
            ))}
          </div>
          {latestSignal && (
            <p className="tiny" aria-live="polite">
              Latest event: {latestSignal.signalType} · {latestSignal.signalStatus}
              {latestSignal.message ? ` · ${latestSignal.message}` : ''}
            </p>
          )}

          {status === 'PENDING' && (
            <button className="inject" onClick={() => onExecute(mission.id)} disabled={busy}>
              {busy ? 'Starting mission…' : 'Start Temporal mission'}
            </button>
          )}
        </>
      )}
      <p className="tiny">Workflow progress is read from the backend mission record.</p>
    </section>
  )
}
