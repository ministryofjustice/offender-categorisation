export interface Alert {
  alertCode: {
    code: string
  }
  activeFrom: string
}

export interface EscapeAlertDto {
  content: Alert[]
}
