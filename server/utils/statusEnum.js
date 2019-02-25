const states = {
  UNCATEGORISED: { name: 'UNCATEGORISED', value: 'Not categorised' },
  STARTED: { name: 'STARTED', value: 'Started' },
  SECURITY_MANUAL: { name: 'SECURITY_MANUAL', value: 'Manually referred to Security' },
  SECURITY_AUTO: { name: 'SECURITY_AUTO', value: 'Automatically referred to Security' },
  SECURITY_BACK: { name: 'SECURITY_BACK', value: 'Completed Security' },
  AWAITING_APPROVAL: { name: 'AWAITING_APPROVAL', value: 'Awaiting approval' },
  APPROVED: { name: 'APPROVED', value: 'Approved' },
}
states.SECURITY_MANUAL.previous = [states.STARTED, states.SECURITY_AUTO, states.SECURITY_BACK]
states.SECURITY_AUTO.previous = [states.STARTED]
states.SECURITY_BACK.previous = [states.SECURITY_MANUAL, states.SECURITY_AUTO]
states.AWAITING_APPROVAL.previous = [states.STARTED, states.SECURITY_BACK]
states.APPROVED.previous = [states.AWAITING_APPROVAL]

module.exports = Object.freeze(states)
