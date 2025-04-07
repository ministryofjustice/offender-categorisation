export type State = {
  name: string
  value: string
  displayOrder?: number
  previous?: (State | undefined)[]
}

const states: Record<string, State> = {
  UNCATEGORISED: { name: 'UNCATEGORISED', value: 'Not categorised' },
  STARTED: { name: 'STARTED', value: 'Started' },
  SECURITY_MANUAL: { name: 'SECURITY_MANUAL', value: 'Manually referred to Security' },
  SECURITY_AUTO: { name: 'SECURITY_AUTO', value: 'Automatically referred to Security' },
  SECURITY_FLAGGED: { name: 'SECURITY_FLAGGED', value: 'Flagged to be referred to Security' },
  SECURITY_BACK: { name: 'SECURITY_BACK', value: 'Completed Security', displayOrder: 10 },
  AWAITING_APPROVAL: { name: 'AWAITING_APPROVAL', value: 'Awaiting approval' },
  APPROVED: { name: 'APPROVED', value: 'Approved' },
  SUPERVISOR_BACK: { name: 'SUPERVISOR_BACK', value: 'Back from Supervisor', displayOrder: 20 },
  CANCELLED: { name: 'CANCELLED', value: 'Cancelled' },
} as const

states.SECURITY_MANUAL.previous = [
  states.STARTED,
  states.SECURITY_AUTO,
  states.SECURITY_FLAGGED,
  states.SECURITY_BACK,
  states.SUPERVISOR_BACK,
]

states.SECURITY_AUTO.previous = [undefined, states.STARTED]
states.SECURITY_FLAGGED.previous = [undefined, states.STARTED, states.SECURITY_AUTO]
states.SECURITY_BACK.previous = [states.SECURITY_MANUAL, states.SECURITY_AUTO, states.SECURITY_FLAGGED]
states.AWAITING_APPROVAL.previous = [states.STARTED, states.SECURITY_BACK, states.SUPERVISOR_BACK]
states.APPROVED.previous = [states.AWAITING_APPROVAL]
states.STARTED.previous = [undefined]
states.SUPERVISOR_BACK.previous = [states.AWAITING_APPROVAL]
states.CANCELLED.previous = [
  states.STARTED,
  states.SECURITY_MANUAL,
  states.SECURITY_AUTO,
  states.SECURITY_FLAGGED,
  states.SECURITY_BACK,
  states.SUPERVISOR_BACK,
  states.AWAITING_APPROVAL,
]

export default states
