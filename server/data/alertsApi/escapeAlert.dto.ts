interface Alert {
  alertCode: {
    code: string
  }
  activeFrom: string
  isActive: boolean
}

export interface EscapeAlertDto {
  content: Alert[]
}
